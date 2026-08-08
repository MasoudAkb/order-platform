import { Hono } from "hono";
import { eq, and } from "drizzle-orm";

import { getDb } from "../../database/db";

import {
  orders,
  orderStatusHistory
} from "../../database/schema";

import { authMiddleware } from "../../middleware/auth";
import { adminMiddleware } from "../../middleware/admin";

import {
  createNotificationQuery,
  sendNotificationPush
} from "../../utils/notification";

const approve = new Hono();

approve.use("*", authMiddleware);
approve.use("*", adminMiddleware);


// POST /admin/orders/:id/approve

approve.post("/:id/approve", async (c) => {

  const db = getDb(c.env);

  const orderId = Number(
    c.req.param("id")
  );



  if (!Number.isInteger(orderId)) {

    return c.json({
      success: false,
      message: "Invalid order id"
    }, 400);

  }



  const admin = c.get("user");



  // ابتدا سفارش را پیدا می‌کنیم
  const result = await db
    .select()
    .from(orders)
    .where(
      eq(
        orders.id,
        orderId
      )
    );



  const order = result[0];



  if (!order) {

    return c.json({
      success: false,
      message: "Order not found"
    }, 404);

  }



  if (order.status !== "pending") {

    return c.json({
      success: false,
      message:
        "Only pending orders can be approved"
    }, 400);

  }



  if (!order.price || order.price <= 0) {

    return c.json({
      success: false,
      message: "Order price not set"
    }, 400);

  }



  const now = Date.now();



  try {

    /*
     * تمام تغییرات دیتابیس مربوط به تأیید
     * سفارش داخل یک transaction انجام می‌شوند.
     */

    const updatedOrder =
      await db.transaction(async (tx) => {

        /*
         * شرط status = pending عمداً
         * داخل UPDATE هم قرار گرفته است.
         *
         * این کار جلوی تأیید همزمان یک سفارش
         * توسط دو درخواست را می‌گیرد.
         */

        const updated = await tx
          .update(orders)
          .set({

            status: "processing",

            approvedAt: now,

            updatedAt: now

          })
          .where(
            and(
              eq(
                orders.id,
                orderId
              ),

              eq(
                orders.status,
                "pending"
              )
            )
          )
          .returning();



        if (!updated[0]) {

          throw new Error(
            "Order is no longer pending"
          );

        }



        const newOrder =
          updated[0];



        /*
         * ثبت تاریخچه وضعیت
         */

        await tx
          .insert(orderStatusHistory)
          .values({

            orderId:
              newOrder.id,

            oldStatus:
              "pending",

            newStatus:
              "processing",

            changedBy:
              admin.id,

            createdAt:
              now

          });



        /*
         * ثبت notification در D1
         *
         * توجه:
         * اینجا Push ارسال نمی‌شود.
         */

        await createNotificationQuery(
          tx,
          {

            userId:
              newOrder.userId,

            orderId:
              newOrder.id,

            title:
              "سفارش تایید شد",

            body:
              `سفارش شما تایید شد. مبلغ سفارش ${Number(
                newOrder.price
              ).toLocaleString("fa-IR")} تومان است.`,

            type:
              "order_approved"

          }
        );



        return newOrder;

      });



    /*
     * اگر transaction بالا موفق شده باشد،
     * حالا Push را خارج از transaction ارسال می‌کنیم.
     *
     * شکست OneSignal نباید transaction دیتابیس
     * را rollback کند.
     */

    await sendNotificationPush(
      db,
      {

        userId:
          updatedOrder.userId,

        orderId:
          updatedOrder.id,

        title:
          "سفارش تایید شد",

        body:
          `سفارش شما تایید شد. مبلغ سفارش ${Number(
            updatedOrder.price
          ).toLocaleString("fa-IR")} تومان است.`,

        type:
          "order_approved"

      }
    );



    return c.json({

      success: true,

      order:
        updatedOrder,

      price:
        updatedOrder.price

    });



  } catch (error) {

    console.error(
      "Approve order error:",
      error
    );



    return c.json({

      success: false,

      message:
        error.message ||
        "خطا در تأیید سفارش"

    }, 500);

  }

});


export default approve;
