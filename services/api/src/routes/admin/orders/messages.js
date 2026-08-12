import { Hono } from "hono";
import { eq } from "drizzle-orm";

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


    // =================================================
    // فقط ادمین
    // =================================================

    if (!user || user.role !== "admin") {

        return c.json({
            success: false,
            message: "Unauthorized"
        }, 401);

    }


    // =================================================
    // Order ID
    // =================================================

    const orderId = Number(
        c.req.param("id")
    );


    if (!Number.isInteger(orderId)) {

        return c.json({
            success: false,
            message: "شناسه سفارش نامعتبر است."
        }, 400);

    }


    // =================================================
    // پیدا کردن سفارش
    // =================================================

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
            message: "سفارش پیدا نشد."
        }, 404);

    }


    // =================================================
    // دریافت متن پیام
    // =================================================

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
            message:
                "متن پیام نمی‌تواند خالی باشد."
        }, 400);

    }


    if (messageText.length > 2000) {

        return c.json({
            success: false,
            message:
                "متن پیام بیش از حد طولانی است."
        }, 400);

    }


    const now = Date.now();


    // =================================================
    // ثبت پیام
    // =================================================

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


    // =================================================
    // Notification برای مشتری
    // =================================================

    try {

        const customerId = order.userId;


        if (!customerId) {

            console.error(
                "Admin message notification error: order has no userId",
                {
                    orderId,
                    order
                }
            );

        } else {

            const notificationBody =
                `پیام جدید از پشتیبانی در سفارش #${orderId}: ${messageText}`;


            // -----------------------------------------
            // ذخیره Notification در دیتابیس
            // -----------------------------------------

            await createNotificationQuery(
                db,
                {
                    userId: customerId,
                    orderId,
                    title: "پیام جدید از پشتیبانی",
                    body: notificationBody,
                    type: "new_message"
                }
            );


            console.log(
                "Customer notification created:",
                {
                    customerId,
                    orderId
                }
            );


            // -----------------------------------------
            // ارسال Push با OneSignal
            // -----------------------------------------

            await sendNotificationPush(
                db,
                {
                    userId: customerId,
                    orderId,
                    title: "پیام جدید از پشتیبانی",
                    body: notificationBody,
                    type: "new_message"
                }
            );


            console.log(
                "Customer push notification processed:",
                {
                    customerId,
                    orderId
                }
            );

        }

    } catch (error) {

        /*
         * خطای Notification یا Push نباید
         * باعث شکست ارسال پیام اصلی شود.
         */

        console.error(
            "Admin message notification error:",
            error
        );

    }


    // =================================================
    // پاسخ
    // =================================================

    return c.json({

        success: true,

        message: {
            ...createdMessage,

            senderRole: "admin"
        }

    });

});


export default orderMessages;