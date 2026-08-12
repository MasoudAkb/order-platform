import { Hono } from "hono";
import { eq, desc } from "drizzle-orm";

import { getDb } from "../../../database/db";

import {
    orders,
    users,
    messages,
    orderStatusHistory,
    orderDetails
} from "../../../database/schema";

import {
    createNotificationQuery,
    sendNotificationPush
} from "../../../utils/notification";

import { authMiddleware } from "../../../middleware/auth";
import { adminMiddleware } from "../../../middleware/admin";

const adminOrders = new Hono();

adminOrders.use("*", authMiddleware);
adminOrders.use("*", adminMiddleware);


// =====================================================
// GET /admin/orders
// لیست سفارش‌ها
// =====================================================

adminOrders.get("/", async (c) => {

    const db = getDb(c.env);

    const status = c.req.query("status");

    let result;

    if (status) {

        result = await db
            .select({
                order: orders,

                user: {
                    id: users.id,
                    name: users.name,
                    phone: users.phone
                }
            })
            .from(orders)
            .leftJoin(
                users,
                eq(orders.userId, users.id)
            )
            .where(
                eq(orders.status, status)
            )
            .orderBy(
                desc(orders.createdAt)
            );

    } else {

        result = await db
            .select({
                order: orders,

                user: {
                    id: users.id,
                    name: users.name,
                    phone: users.phone
                }
            })
            .from(orders)
            .leftJoin(
                users,
                eq(orders.userId, users.id)
            )
            .orderBy(
                desc(orders.createdAt)
            );

    }

    return c.json({
        success: true,
        orders: result
    });

});


// =====================================================
// GET /admin/orders/:id
// جزئیات سفارش
// =====================================================

adminOrders.get("/:id", async (c) => {

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

    const result = await db
        .select({
            order: orders,

            user: {
                id: users.id,
                name: users.name,
                phone: users.phone
            }
        })
        .from(orders)
        .leftJoin(
            users,
            eq(orders.userId, users.id)
        )
        .where(
            eq(orders.id, orderId)
        );

    const data = result[0];

    if (!data) {

        return c.json({
            success: false,
            message: "Order not found"
        }, 404);

    }


    // -------------------------
    // پیام‌ها
    // -------------------------

    const orderMessages = await db
        .select({
            id: messages.id,
            orderId: messages.orderId,
            senderId: messages.senderId,
            message: messages.message,
            createdAt: messages.createdAt,

            senderName: users.name,
            senderRole: users.role
        })
        .from(messages)
        .leftJoin(
            users,
            eq(messages.senderId, users.id)
        )
        .where(
            eq(messages.orderId, orderId)
        )
        .orderBy(
            messages.createdAt
        );


    // -------------------------
    // تاریخچه وضعیت
    // -------------------------

    const history = await db
        .select()
        .from(orderStatusHistory)
        .where(
            eq(
                orderStatusHistory.orderId,
                orderId
            )
        )
        .orderBy(
            orderStatusHistory.createdAt
        );


    // -------------------------
    // جزئیات سفارش
    // -------------------------

    const detailsResult = await db
        .select()
        .from(orderDetails)
        .where(
            eq(
                orderDetails.orderId,
                orderId
            )
        );

    let details = null;

    if (detailsResult[0]) {

        let parsedData = {};

        try {

            parsedData = JSON.parse(
                detailsResult[0].data
            );

        } catch {

            parsedData = detailsResult[0].data;

        }

        details = {
            ...detailsResult[0],
            data: parsedData
        };

    }


    return c.json({

        success: true,

        order: data.order,

        customer: data.user,

        details,

        messages: orderMessages,

        history

    });

});


// =====================================================
// POST /admin/orders/:id/messages
// ارسال پیام توسط ادمین
// =====================================================

adminOrders.post("/:id/messages", async (c) => {

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


    // -------------------------
    // ادمین فعلی
    // -------------------------

    const admin = c.get("user");

    if (!admin || !admin.id) {

        return c.json({
            success: false,
            message: "Unauthorized"
        }, 401);

    }


    // -------------------------
    // بررسی سفارش
    // -------------------------

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


    // -------------------------
    // دریافت Body
    // -------------------------

    let body;

    try {

        body = await c.req.json();

    } catch {

        return c.json({
            success: false,
            message: "Invalid JSON body"
        }, 400);

    }


    const message =
        typeof body.message === "string"
            ? body.message.trim()
            : "";


    if (!message) {

        return c.json({
            success: false,
            message: "Message is required"
        }, 400);

    }


    if (message.length > 2000) {

        return c.json({
            success: false,
            message: "Message is too long"
        }, 400);

    }


    // -------------------------
    // ایجاد پیام
    // -------------------------

    const now = Date.now();

    const result = await db
        .insert(messages)
        .values({
            orderId,
            senderId: admin.id,
            message,
            createdAt: now
        })
        .returning();


    const createdMessage = result[0];

    if (!createdMessage) {

        return c.json({
            success: false,
            message: "Failed to create message"
        }, 500);

    }


    // =================================================
    // Notification برای صاحب سفارش
    // =================================================

    if (order.userId) {

        const notificationTitle =
            "پیام جدید از پشتیبانی";

        const notificationBody =
            `پیام جدید در سفارش #${orderId}: ${message}`;


        try {

            // -------------------------
            // ذخیره Notification در DB
            // -------------------------

            await createNotificationQuery(
                db,
                {
                    userId: order.userId,
                    orderId,
                    title: notificationTitle,
                    body: notificationBody,
                    type: "new_message"
                }
            );


            // -------------------------
            // ارسال Push با OneSignal
            // -------------------------

            await sendNotificationPush(
                db,
                {
                    userId: order.userId,
                    orderId,
                    title: notificationTitle,
                    body: notificationBody,
                    type: "new_message"
                }
            );


        } catch (error) {

            /*
             * اگر Notification یا Push شکست خورد،
             * ثبت پیام اصلی نباید شکست بخورد.
             */

            console.error(
                "Admin message notification error:",
                error
            );

        }

    }


    // -------------------------
    // پاسخ
    // -------------------------

    return c.json({

        success: true,

        message: {
            ...createdMessage,

            senderName: admin.name,

            senderRole: admin.role

        }

    });

});


export default adminOrders;