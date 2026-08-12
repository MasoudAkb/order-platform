import { Hono } from "hono";
import { eq, and } from "drizzle-orm";

import { getDb } from "../../database/db";

import {
    users,
    orders,
    messages
} from "../../database/schema";

import {
    createNotificationQuery,
    sendNotificationPush
} from "../../utils/notification";

import { authMiddleware } from "../../middleware/auth";

const orderMessages = new Hono();

orderMessages.use("*", authMiddleware);

// =====================================================
// ارسال پیام توسط صاحب سفارش
// POST /orders/:id/messages
// =====================================================

orderMessages.post("/:id/messages", async (c) => {

    const db = getDb(c.env);

    const user = c.get("user");

    if (!user) {

        return c.json({
            success: false,
            message: "Unauthorized"
        }, 401);

    }


    const orderId = Number(
        c.req.param("id")
    );


    if (!Number.isInteger(orderId)) {

        return c.json({
            success: false,
            message: "شناسه سفارش نامعتبر است."
        }, 400);

    }


    /*
     * فقط صاحب سفارش اجازه ارسال پیام دارد
     */

    const orderResult = await db
        .select()
        .from(orders)
        .where(
            and(
                eq(orders.id, orderId),
                eq(orders.userId, user.id)
            )
        );


    const order = orderResult[0];


    if (!order) {

        return c.json({
            success: false,
            message: "سفارش پیدا نشد."
        }, 404);

    }


    /*
     * کاربر فقط هنگام پردازش سفارش
     * می‌تواند پیام ارسال کند.
     */

    if (order.status !== "processing") {

        return c.json({
            success: false,
            message:
                "در وضعیت فعلی سفارش امکان ارسال پیام وجود ندارد."
        }, 400);

    }


    let body;

    try {

        body = await c.req.json();

    } catch {

        return c.json({
            success: false,
            message: "اطلاعات پیام نامعتبر است."
        }, 400);

    }


    const messageText =
        typeof body.message === "string"
            ? body.message.trim()
            : "";


    if (!messageText) {

        return c.json({
            success: false,
            message: "متن پیام نمی‌تواند خالی باشد."
        }, 400);

    }


    if (messageText.length > 2000) {

        return c.json({
            success: false,
            message: "متن پیام بیش از حد طولانی است."
        }, 400);

    }


    const now = Date.now();


    /*
     * ثبت پیام
     */

    const result = await db
        .insert(messages)
        .values({
            orderId,
            senderId: user.id,
            message: messageText,
            createdAt: now
        })
        .returning();


    const createdMessage = result[0];


    if (!createdMessage) {

        return c.json({
            success: false,
            message: "ثبت پیام انجام نشد."
        }, 500);

    }


    /*
     * پیدا کردن ادمین‌ها
     */

    const admins = await db
        .select()
        .from(users)
        .where(
            eq(users.role, "admin")
        );


    /*
     * ساخت Notification و ارسال Push
     * برای تمام ادمین‌ها
     */

    const notificationBody =
        `پیام جدید در سفارش #${orderId}: ${messageText}`;


    for (const admin of admins) {

        try {

            /*
             * Notification داخل دیتابیس
             */

            await createNotificationQuery(
                db,
                {
                    userId: admin.id,
                    orderId,
                    title: "پیام جدید مشتری",
                    body: notificationBody,
                    type: "new_message"
                }
            );


            /*
             * Push Notification
             */

            await sendNotificationPush(
                db,
                {
                    userId: admin.id,
                    orderId,
                    title: "پیام جدید مشتری",
                    body: notificationBody,
                    type: "new_message"
                }
            );

        } catch (error) {

            /*
             * خطای Notification نباید باعث شود
             * پیام اصلی کاربر ناموفق اعلام شود.
             */

            console.error(
                "Customer message notification error:",
                error
            );

        }

    }


    return c.json({

        success: true,

        message: {
            ...createdMessage,

            senderRole: "customer"
        }

    });

});


export default orderMessages;