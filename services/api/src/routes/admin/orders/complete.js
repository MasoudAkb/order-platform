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

  const orderId = Number(
    c.req.param("id")
  );

  if (!Number.isInteger(orderId)) {

    return c.json({
      success: false,
      message: "Invalid order id"
    }, 400);

  }

  let body = {};

  try {

    body = await c.req.json();

  } catch {}

  const resultText =
    body.result
      ? String(body.result).trim()
      : "";

  const admin = c.get("user");

  const now = Date.now();

  try {

    /*
     * پیدا کردن سفارش
     */

    const orderResult = await db
      .select()
      .from(orders)
      .where(
        eq(
          orders.id,
          orderId
        )
      );

    const order = orderResult[0];

    if (!order) {

      return c.json({
        success: false,
        message: "Order not found"
      }, 404);

    }

    /*
     * فقط سفارش processing
     * قابل تکمیل است.
     */

    if (order.status !== "processing") {

      return c.json({
        success: false,
        message: "Only processing orders can be completed"
      }, 400);

    }

    /*
     * قیمت باید معتبر باشد.
     */

    if (
      !order.price ||
      order.price <= 0
    ) {

      return c.json({
        success: false,
        message: "Order price not set"
      }, 400);

    }

    /*
     * پیدا کردن مشتری
     */

    const userResult = await db
      .select()
      .from(users)
      .where(
        eq(
          users.id,
          order.userId
        )
      );

    const customer = userResult[0];

    if (!customer) {

      return c.json({
        success: false,
        message: "User not found"
      }, 404);

    }

    /*
     * بررسی موجودی
     */

    if (
      customer.balance <
      order.price
    ) {

      return c.json({
        success: false,
        message: "Insufficient balance"
      }, 400);

    }

    /*
     * کم کردن موجودی
     *
     * شرط balance قبلی عمداً
     * داخل UPDATE قرار گرفته است.
     *
     * این شرط جلوی برداشت همزمان
     * از موجودی را می‌گیرد.
     */

    const newBalance =
      customer.balance -
      order.price;

    const balanceUpdate = await db
      .update(users)
      .set({
        balance: newBalance
      })
      .where(
        and(
          eq(
            users.id,
            customer.id
          ),

          eq(
            users.balance,
            customer.balance
          )
        )
      )
      .returning();

    if (!balanceUpdate[0]) {

      return c.json({
        success: false,
        message: "Balance changed, please retry"
      }, 409);

    }

    /*
     * ثبت تراکنش مالی
     */

    await db
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
     *
     * شرط processing داخل UPDATE
     * جلوی تکمیل همزمان سفارش را می‌گیرد.
     */

    const updatedResult = await db
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

          eq(
            orders.status,
            "processing"
          )

        )
      )
      .returning();

    if (!updatedResult[0]) {

      return c.json({
        success: false,
        message: "Order is no longer processing"
      }, 409);

    }

    const updatedOrder =
      updatedResult[0];

    /*
     * ثبت تاریخچه وضعیت
     */

    await db
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

    await db
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
     */

    await createNotificationQuery(
      db,
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
     * ارسال Push خارج از عملیات دیتابیس
     */

    const pushBody =
      resultText
        ? `سفارش شما تکمیل شد: ${resultText}`
        : "سفارش شما با موفقیت انجام شد";

    await sendNotificationPush(
      db,
      {
        userId:
          updatedOrder.userId,

        orderId:
          updatedOrder.id,

        title:
          "سفارش تکمیل شد",

        body:
          pushBody,

        type:
          "order_completed"
      }
    );

    /*
     * پاسخ
     */

    return c.json({

      success:
        true,

      order:
        updatedOrder

    });

  } catch (error) {

    console.error(
      "Complete order error:",
      error
    );

    return c.json({

      success:
        false,

      message:
        error.message ||
        "خطا در تکمیل سفارش"

    }, 500);

  }

});

export default complete;