import { Hono } from "hono";
import { eq, and } from "drizzle-orm";

import { getDb } from "../../database/db";

import {
    orders,
    messages
} from "../../database/schema";

import { authMiddleware } from "../../middleware/auth";

const orderMessages = new Hono();

orderMessages.use("*", authMiddleware);


// POST /orders/:id/messages
// ارسال پیام توسط صاحب سفارش

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


    const body = await c.req.json();

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


    const result = await db
        .insert(messages)
        .values({
            orderId,
            senderId: user.id,
            message: messageText,
            createdAt: now
        })
        .returning();


    return c.json({

        success: true,

        message: {
            ...result[0],

            senderRole: "customer"
        }

    });

});


export default orderMessages;