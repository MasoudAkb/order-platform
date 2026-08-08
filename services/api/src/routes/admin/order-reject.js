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

const reject = new Hono();

reject.use("*", authMiddleware);
reject.use("*", adminMiddleware);


// POST /admin/orders/:id/reject

reject.post("/:id/reject", async (c) => {

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



  let body = {};

  try {

    body = await c.req.json();

  } catch {}



  /*
   * دلیل رد سفارش اختیاری است.
   */

  const rejectReason =
    body.rejectReason
      ? String(body.rejectReason).trim()
      : "";



  /*
   * پیدا کردن سفارش
   */

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
        "Only pending orders can be rejected"
    }, 400);

  }



  const now = Date.now();



  try {

    /*
     * تمام تغییرات دیتابیس مربوط به Reject
     * داخل یک transaction انجام می‌شوند.
     */

    const updatedOrder =
      await db.transaction(async (tx) => {

        /*
         * شرط pending داخل UPDATE نیز وجود دارد
         * تا درخواست‌های همزمان نتوانند
         * یک سفارش را دوبار reject کنند.
         */

        const updated = await tx
          .update(orders)
          .set({

            status:
              "rejected",

            rejectReason:
              rejectReason || null,

            updatedAt:
              now

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
              "rejected",

            changedBy:
              admin.id,

            createdAt:
              now

          });



        /*
         * متن notification
         */

        const notificationBody =
          rejectReason

            ? `سفارش شما رد شد. دلیل: ${rejectReason}`

            : "سفارش شما رد شد.";



        /*
         * ثبت notification در D1
         */

        await createNotificationQuery(
          tx,
          {

            userId:
              newOrder.userId,

            orderId:
              newOrder.id,

            title:
              "سفارش رد شد",

            body:
              notificationBody,

            type:
              "order_rejected"

          }
        );



        return newOrder;

      });



    /*
     * Transaction با موفقیت Commit شده.
     *
     * حالا Push را خارج از transaction می‌فرستیم.
     */

    const notificationBody =
      rejectReason

        ? `سفارش شما رد شد. دلیل: ${rejectReason}`

        : "سفارش شما رد شد.";



    await sendNotificationPush(
      db,
      {

        userId:
          updatedOrder.userId,

        orderId:
          updatedOrder.id,

        title:
          "سفارش رد شد",

        body:
          notificationBody,

        type:
          "order_rejected"

      }
    );



    return c.json({

      success: true,

      order:
        updatedOrder

    });



  } catch (error) {

    console.error(
      "Reject order error:",
      error
    );



    return c.json({

      success: false,

      message:
        error.message ||
        "خطا در رد سفارش"

    }, 500);

  }

});


export default reject;
