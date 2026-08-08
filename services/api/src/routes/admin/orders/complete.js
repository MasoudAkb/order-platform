import { Hono } from "hono";
import { eq, and } from "drizzle-orm";

import { getDb } from "../../../database/db";

import {
  users,
  orders,
  walletTransactions,
  orderStatusHistory,
  messages
} from "../../../database/schema";

import { authMiddleware } from "../../../middleware/auth";
import { adminMiddleware } from "../../../middleware/admin";

import {
  createNotificationQuery,
  sendNotificationPush
} from "../../../utils/notification";


const complete = new Hono();


complete.use("*", authMiddleware);
complete.use("*", adminMiddleware);


// POST /admin/orders/:id/complete

complete.post("/:id/complete", async (c) => {

  const db = getDb(c.env);

  const orderId =
    Number(c.req.param("id"));



  if (!Number.isInteger(orderId)) {

    return c.json({
      success: false,
      message: "Invalid order id"
    }, 400);

  }



  let body = {};

  try {

    body = await c.req.json();

  } catch { }



  const resultText =
    body.result
      ? String(body.result).trim()
      : "";



  const admin =
    c.get("user");



  const now =
    Date.now();



  try {

    /*
     * تمام عملیات مالی و تغییر وضعیت
     * داخل یک transaction.
     */

    const completedOrder =
      await db.transaction(async (tx) => {

        /*
         * سفارش را پیدا می‌کنیم.
         */

        const orderResult =
          await tx
            .select()
            .from(orders)
            .where(
              eq(
                orders.id,
                orderId
              )
            );



        const order =
          orderResult[0];



        if (!order) {

          throw new Error(
            "Order not found"
          );

        }



        /*
         * فقط سفارش processing
         * قابل تکمیل است.
         */

        if (
          order.status !==
          "processing"
        ) {

          throw new Error(
            "Only processing orders can be completed"
          );

        }



        /*
         * قیمت باید معتبر باشد.
         */

        if (
          !order.price ||
          order.price <= 0
        ) {

          throw new Error(
            "Order price not set"
          );

        }



        /*
         * مشتری
         */

        const userResult =
          await tx
            .select()
            .from(users)
            .where(
              eq(
                users.id,
                order.userId
              )
            );



        const customer =
          userResult[0];



        if (!customer) {

          throw new Error(
            "User not found"
          );

        }



        /*
         * بررسی موجودی
         */

        if (
          customer.balance <
          order.price
        ) {

          throw new Error(
            "Insufficient balance"
          );

        }



        /*
         * کم کردن موجودی
         */

        const newBalance =
          customer.balance -
          order.price;

        const balanceUpdate =
          await tx
            .update(users)
            .set({
              balance: newBalance
            })
            .where(
              and(
                eq(users.id, customer.id),
                // موجودی باید همچنان کافی باشد
                // و از مبلغ سفارش کمتر نشده باشد
                // این شرط جلوی برداشت نامعتبر را می‌گیرد.
                // توجه: balance قبلی را هم در شرط بررسی می‌کنیم.
                eq(users.balance, customer.balance)
              )
            )
            .returning();

        if (!balanceUpdate[0]) {
          throw new Error(
            "Balance changed, please retry"
          );
        }



        /*
         * ثبت تراکنش مالی
         */

        await tx
          .insert(walletTransactions)
          .values({

            userId:
              customer.id,

            amount:
              -order.price,

            type:
              "payment",

            description:
              `Payment for order #${order.id}`,

            createdAt:
              now

          });



        /*
         * تکمیل سفارش
         */

        const updatedResult =
          await tx
            .update(orders)
            .set({

              status:
                "completed",

              paymentStatus:
                "paid",

              completedAt:
                now,

              updatedAt:
                now

            })
            .where(
              and(

                eq(
                  orders.id,
                  order.id
                ),

                /*
                 * دوباره وضعیت را
                 * داخل UPDATE هم چک می‌کنیم.
                 */

                eq(
                  orders.status,
                  "processing"
                )

              )
            )
            .returning();



        if (!updatedResult[0]) {

          throw new Error(
            "Order is no longer processing"
          );

        }



        const updatedOrder =
          updatedResult[0];



        /*
         * ثبت تاریخچه وضعیت
         */

        await tx
          .insert(orderStatusHistory)
          .values({

            orderId:
              order.id,

            oldStatus:
              "processing",

            newStatus:
              "completed",

            changedBy:
              admin.id,

            createdAt:
              now

          });



        /*
         * ثبت پیام برای مشتری
         */

        const messageText =
          resultText

            ? `سفارش انجام شد: ${resultText}`

            : "سفارش شما با موفقیت انجام شد";



        await tx
          .insert(messages)
          .values({

            orderId:
              order.id,

            senderId:
              admin.id,

            message:
              messageText,

            createdAt:
              now

          });



        /*
         * ثبت Notification در دیتابیس
         *
         * فقط INSERT
         * بدون ارسال Push
         */

        await createNotificationQuery(
          tx,
          {

            userId:
              order.userId,

            orderId:
              order.id,

            title:
              "سفارش تکمیل شد",

            body:
              messageText,

            type:
              "order_completed"

          }
        );



        /*
         * اگر همه عملیات تا اینجا
         * موفق باشند، transaction
         * commit خواهد شد.
         */

        return updatedOrder;

      });



    /*
     * اینجا transaction با موفقیت
     * commit شده است.
     *
     * حالا Push ارسال می‌کنیم.
     */

    const pushBody =
      resultText

        ? `سفارش شما تکمیل شد: ${resultText}`

        : "سفارش شما با موفقیت انجام شد";



    await sendNotificationPush(
      db,
      {

        userId:
          completedOrder.userId,

        orderId:
          completedOrder.id,

        title:
          "سفارش تکمیل شد",

        body:
          pushBody,

        type:
          "order_completed"

      }
    );



    return c.json({

      success: true,

      order:
        completedOrder

    });



  } catch (error) {

    console.error(
      "Complete order error:",
      error
    );



    const message =
      error.message ||
      "خطا در تکمیل سفارش";



    if (
      message ===
      "Order not found"
    ) {

      return c.json({
        success: false,
        message
      }, 404);

    }



    if (
      message ===
      "User not found"
    ) {

      return c.json({
        success: false,
        message
      }, 404);

    }



    if (
      message ===
      "Insufficient balance"
    ) {

      return c.json({
        success: false,
        message
      }, 400);

    }



    return c.json({

      success: false,

      message

    }, 400);

  }

});


export default complete;
