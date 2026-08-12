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
// ارسال پیام توسط مشتری
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
     * ثبت پیام در دیتابیس
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


    // =====================================================
    // Notification برای ادمین‌ها
    // =====================================================

    try {

        /*
         * پیدا کردن تمام ادمین‌ها
         */

        const admins = await db
            .select()
            .from(users)
            .where(
                eq(users.role, "admin")
            );


        /*
         * متن Notification
         */

        const notificationBody =
            `پیام جدید مشتری در سفارش #${orderId}: ${messageText}`;


        /*
         * ارسال Notification به تمام ادمین‌ها
         */

        for (const admin of admins) {

            /*
             * ذخیره Notification در دیتابیس
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
             * ارسال Push با OneSignal
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

        }


    } catch (error) {

        /*
         * اگر Notification یا Push شکست خورد،
         * پیام اصلی همچنان موفق محسوب می‌شود.
         */

        console.error(
            "Customer message notification error:",
            error
        );

    }


    /*
     * پاسخ به فرانت‌اند
     */

    return c.json({

        success: true,

        message: {
            ...createdMessage,

            senderRole: "customer"
        }

    });

});


export default orderMessages;