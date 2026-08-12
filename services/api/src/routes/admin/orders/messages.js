import { Hono } from "hono";
import { eq, and } from "drizzle-orm";

import { getDb } from "../../../database/db";

import {
    orders,
    messages
} from "../../../database/schema";

import {
    createNotificationQuery,
    sendNotificationPush
} from "../../../utils/notification";

import { authMiddleware } from "../../../middleware/auth";

const orderMessages = new Hono();

orderMessages.use("*", authMiddleware);

// =====================================================
// ارسال پیام توسط ادمین
// POST /admin/orders/:id/messages
// =====================================================

orderMessages.post("/:id/messages", async (c) => {

    const db = getDb(c.env);

    const user = c.get("user");


    /*
     * فقط ادمین اجازه ارسال پیام دارد
     */

    if (!user || user.role !== "admin") {

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
     * پیدا کردن سفارش
     */

    const orderResult = await db
        .select()
        .from(orders)
        .where(
            eq(orders.id, orderId)
        );


    const order = orderResult[0];


    if (!order) {

        return c.json({
            success: false,
            message: "سفارش پیدا نشد."
        }, 404);

    }


    /*
     * دریافت متن پیام
     */

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
     * Notification برای صاحب سفارش
     */

    if (order.userId) {

        const notificationBody =
            `پیام جدید از پشتیبانی در سفارش #${orderId}: ${messageText}`;


        try {

            /*
             * Notification داخل دیتابیس
             */

            await createNotificationQuery(
                db,
                {
                    userId: order.userId,
                    orderId,
                    title: "پیام جدید از پشتیبانی",
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
                    userId: order.userId,
                    orderId,
                    title: "پیام جدید از پشتیبانی",
                    body: notificationBody,
                    type: "new_message"
                }
            );

        } catch (error) {

            /*
             * خطای Notification نباید باعث شود
             * پیام اصلی ادمین ناموفق اعلام شود.
             */

            console.error(
                "Admin message notification error:",
                error
            );

        }

    }


    return c.json({

        success: true,

        message: {
            ...createdMessage,

            senderRole: "admin"
        }

    });

});


export default orderMessages;