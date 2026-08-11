import { Hono } from "hono";

import { getDb } from "../../../database/db";

import {
  orders,
  walletTransactions,
  orderStatusHistory,
  messages,
} from "../../../database/schema";

import { authMiddleware } from "../../../middleware/auth";
import { adminMiddleware } from "../../../middleware/admin";

import {
  sendNotificationPush,
} from "../../../utils/notification";

const complete = new Hono();

complete.use("*", authMiddleware);
complete.use("*", adminMiddleware);


// =====================================================
// POST /admin/orders/:id/complete
// تکمیل سفارش + پرداخت اتمیک
// =====================================================

complete.post("/:id/complete", async (c) => {

  const db = getDb(c.env);
  const d1 = c.env.DB;

  const orderId = Number(
    c.req.param("id")
  );

  if (!Number.isInteger(orderId)) {

    return c.json({
      success: false,
      message: "Invalid order id"
    }, 400);

  }


  // ===================================================
  // دریافت نتیجه تکمیل از ادمین
  // ===================================================

  let body = {};

  try {

    body = await c.req.json();

  } catch {

    body = {};

  }


  const resultText =
    body.result
      ? String(body.result).trim()
      : "";


  const admin = c.get("user");

  const now = Date.now();


  // ===================================================
  // پیدا کردن سفارش
  // ===================================================

  const orderResult = await db
    .select()
    .from(orders)
    .where(
      orders.id
        ? undefined
        : undefined
    );


  /*
   * برای جلوگیری از وابستگی به query builder
   * در عملیات مالی، سفارش را مستقیم از D1 می‌خوانیم.
   */

  const orderQuery = await d1
    .prepare(`
      SELECT
        id,
        user_id,
        title,
        description,
        status,
        price,
        payment_status,
        approved_at,
        completed_at,
        reject_reason,
        created_at,
        updated_at
      FROM orders
      WHERE id = ?
      LIMIT 1
    `)
    .bind(orderId)
    .first();


  const order = orderQuery;


  if (!order) {

    return c.json({
      success: false,
      message: "Order not found"
    }, 404);

  }


  // ===================================================
  // فقط processing قابل تکمیل است
  // ===================================================

  if (order.status !== "processing") {

    return c.json({
      success: false,
      message: "Only processing orders can be completed"
    }, 400);

  }


  // ===================================================
  // بررسی قیمت
  // ===================================================

  const price = Number(order.price);

  if (
    !Number.isInteger(price) ||
    price <= 0
  ) {

    return c.json({
      success: false,
      message: "Order price not set"
    }, 400);

  }


  // ===================================================
  // متن پیام
  // ===================================================

  const messageText =
    resultText
      ? `سفارش انجام شد: ${resultText}`
      : "سفارش شما با موفقیت انجام شد";


  const pushBody = messageText;


  // ===================================================
  // ATOMIC PAYMENT
  //
  // ترتیب:
  //
  // 1. سفارش را completed می‌کنیم فقط اگر:
  //    - processing باشد
  //    - پرداخت نشده باشد
  //    - کاربر موجودی کافی داشته باشد
  //
  // 2. موجودی کم می‌شود
  //
  // 3. تراکنش wallet ثبت می‌شود
  //
  // 4. history ثبت می‌شود
  //
  // 5. message ثبت می‌شود
  //
  // 6. notification ثبت می‌شود
  //
  // تمام این موارد داخل D1 batch هستند.
  // ===================================================


  try {

    /*
     * STEP 1
     *
     * تغییر وضعیت سفارش.
     *
     * این مهم‌ترین statement است.
     *
     * اگر موجودی کافی نباشد:
     *
     * changes = 0
     *
     * و تمام statementهای بعدی هم شرط دارند
     * که فقط در صورت completed شدن سفارش اجرا شوند.
     */

    const completeOrder = d1
      .prepare(`
        UPDATE orders

        SET
          status = 'completed',
          payment_status = 'paid',
          completed_at = ?,
          updated_at = ?

        WHERE
          id = ?
          AND status = 'processing'
          AND payment_status = 'unpaid'

          AND EXISTS (
            SELECT 1
            FROM users
            WHERE
              users.id = orders.user_id
              AND users.balance >= orders.price
          )
      `)
      .bind(
        now,
        now,
        orderId
      );


    /*
     * STEP 2
     *
     * کم کردن موجودی.
     *
     * فقط اگر STEP 1 موفق شده باشد.
     */

    const deductBalance = d1
      .prepare(`
        UPDATE users

        SET
          balance = balance - ?

        WHERE
          id = ?

          AND EXISTS (
            SELECT 1
            FROM orders
            WHERE
              orders.id = ?
              AND orders.status = 'completed'
              AND orders.payment_status = 'paid'
              AND orders.completed_at = ?
          )

          AND balance >= ?
      `)
      .bind(
        price,
        order.user_id,
        orderId,
        now,
        price
      );


    /*
     * STEP 3
     *
     * ثبت تراکنش کیف پول.
     */

    const insertWalletTransaction = d1
      .prepare(`
        INSERT INTO wallet_transactions
        (
          user_id,
          amount,
          type,
          description,
          created_at
        )

        SELECT
          ?,
          ?,
          'payment',
          ?,
          ?

        WHERE EXISTS (
          SELECT 1
          FROM orders
          WHERE
            id = ?
            AND status = 'completed'
            AND payment_status = 'paid'
            AND completed_at = ?
        )
      `)
      .bind(
        order.user_id,
        -price,
        `Payment for order #${order.id}`,
        now,
        orderId,
        now
      );


    /*
     * STEP 4
     *
     * ثبت تاریخچه وضعیت.
     */

    const insertHistory = d1
      .prepare(`
        INSERT INTO order_status_history
        (
          order_id,
          old_status,
          new_status,
          changed_by,
          created_at
        )

        SELECT
          ?,
          'processing',
          'completed',
          ?,
          ?

        WHERE EXISTS (
          SELECT 1
          FROM orders
          WHERE
            id = ?
            AND status = 'completed'
            AND payment_status = 'paid'
            AND completed_at = ?
        )
      `)
      .bind(
        orderId,
        admin.id,
        now,
        orderId,
        now
      );


    /*
     * STEP 5
     *
     * ثبت پیام برای مشتری.
     */

    const insertMessage = d1
      .prepare(`
        INSERT INTO messages
        (
          order_id,
          sender_id,
          message,
          created_at
        )

        SELECT
          ?,
          ?,
          ?,
          ?

        WHERE EXISTS (
          SELECT 1
          FROM orders
          WHERE
            id = ?
            AND status = 'completed'
            AND payment_status = 'paid'
            AND completed_at = ?
        )
      `)
      .bind(
        orderId,
        admin.id,
        messageText,
        now,
        orderId,
        now
      );


    /*
     * STEP 6
     *
     * Notification دیتابیسی.
     *
     * Push بعداً و خارج از batch ارسال می‌شود.
     */

    const insertNotification = d1
      .prepare(`
        INSERT INTO notifications
        (
          user_id,
          order_id,
          title,
          body,
          type,
          is_read,
          created_at
        )

        SELECT
          ?,
          ?,
          ?,
          ?,
          ?,
          0,
          ?

        WHERE EXISTS (
          SELECT 1
          FROM orders
          WHERE
            id = ?
            AND status = 'completed'
            AND payment_status = 'paid'
            AND completed_at = ?
        )
      `)
      .bind(
        order.user_id,
        orderId,
        "سفارش تکمیل شد",
        messageText,
        "order_completed",
        now,
        orderId,
        now
      );


    /*
     * اجرای اتمیک
     */

    const batchResult = await d1.batch([
      completeOrder,
      deductBalance,
      insertWalletTransaction,
      insertHistory,
      insertMessage,
      insertNotification,
    ]);


    /*
     * نتیجه statement اول
     */

    const firstResult =
      batchResult[0];


    const changes =
      firstResult?.meta?.changes ?? 0;


    /*
     * اگر سفارش تکمیل نشده باشد،
     * یعنی موجودی کافی نبوده یا سفارش دیگر processing نیست.
     *
     * چون batch اتمیک بوده، هیچ پرداختی هم ثبت نشده.
     */

    if (changes !== 1) {

      /*
       * تشخیص موجودی برای پیام مناسب‌تر
       */

      const currentUser = await d1
        .prepare(`
          SELECT balance
          FROM users
          WHERE id = ?
          LIMIT 1
        `)
        .bind(order.user_id)
        .first();


      if (!currentUser) {

        return c.json({
          success: false,
          message: "User not found"
        }, 404);

      }


      if (Number(currentUser.balance) < price) {

        return c.json({
          success: false,
          message: "Insufficient balance"
        }, 400);

      }


      return c.json({
        success: false,
        message: "Order is no longer processing"
      }, 400);

    }


    /*
     * بررسی اینکه موجودی واقعاً کم شده باشد.
     */

    const balanceResult =
      batchResult[1];


    const balanceChanges =
      balanceResult?.meta?.changes ?? 0;


    if (balanceChanges !== 1) {

      /*
       * این حالت نباید رخ دهد چون statement اول
       * موجودی کافی را بررسی کرده است.
       *
       * اگر رخ داد، کل batch باید rollback شده باشد.
       */

      console.error(
        "Unexpected balance deduction result:",
        batchResult
      );

      return c.json({
        success: false,
        message: "Payment could not be completed"
      }, 500);

    }


    // =================================================
    // دریافت سفارش نهایی
    // =================================================

    const completedOrder =
      await d1
        .prepare(`
          SELECT
            id,
            user_id,
            title,
            description,
            status,
            price,
            payment_status,
            approved_at,
            completed_at,
            reject_reason,
            created_at,
            updated_at
          FROM orders
          WHERE id = ?
          LIMIT 1
        `)
        .bind(orderId)
        .first();


    // =================================================
    // ارسال Push بعد از Commit
    // =================================================

    try {

      await sendNotificationPush(
        db,
        {
          userId: order.user_id,
          orderId,
          title: "سفارش تکمیل شد",
          body: pushBody,
          type: "order_completed"
        }
      );

    } catch (pushError) {

      console.error(
        "Completion push error:",
        pushError
      );

    }


    // =================================================
    // پاسخ
    // =================================================

    return c.json({

      success: true,

      order: completedOrder

    });


  } catch (error) {

    console.error(
      "Complete order error:",
      error
    );


    return c.json({

      success: false,

      message:
        error?.message ||
        "خطا در تکمیل سفارش"

    }, 500);

  }

});


export default complete;