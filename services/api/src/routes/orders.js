import { Hono } from "hono";
import { eq, desc, and } from "drizzle-orm";

import { getDb } from "../database/db";

import {
    users,
    orders,
    orderDetails,
    orderStatusHistory,
    servicePrices,
} from "../database/schema";

import {
    createNotificationQuery,
} from "../utils/notification";

import { authMiddleware } from "../middleware/auth";
import { passwordChangeMiddleware } from "../middleware/password-change";

const ordersRoute = new Hono();

ordersRoute.use("*", authMiddleware);
ordersRoute.use("*", passwordChangeMiddleware);


// =====================================================
// ایجاد سفارش جدید
// POST /orders
// =====================================================

ordersRoute.post("/", async (c) => {

    const db = getDb(c.env);
    const user = c.get("user");

    let body;

    try {
        body = await c.req.json();
    } catch {
        return c.json({
            success: false,
            message: "Invalid JSON body"
        }, 400);
    }


    /*
     * نوع سرویس
     *
     * مثال:
     *
     * apple_id_with_email
     * apple_id_without_email
     */

    const serviceType = body.title;


    if (!serviceType) {
        return c.json({
            success: false,
            message: "Service type is required"
        }, 400);
    }


    /*
     * پیدا کردن سرویس و قیمت واقعی
     * از دیتابیس
     */

    const serviceResult = await db
        .select()
        .from(servicePrices)
        .where(
            eq(
                servicePrices.serviceType,
                serviceType
            )
        );


    const service = serviceResult[0];


    if (!service) {
        return c.json({
            success: false,
            message: "Service not found"
        }, 404);
    }


    /*
     * اطلاعات اختصاصی سرویس
     *
     * فرانت‌اند برای سرویس Apple ID
     * آن را در body.details می‌فرستد.
     */

    const details = body.details || null;


    /*
     * ایجاد سفارش و جزئیات آن
     * داخل یک transaction
     */

    const now = Date.now();


    try {
        const orderResult = await db
            .insert(orders)
            .values({
                userId: user.id,
                title: service.title,
                description: body.description || null,
                status: "pending",
                price: service.basePrice,
                paymentStatus: "unpaid",
                createdAt: now,
                updatedAt: now,
            })
            .returning();

        const order = orderResult[0];

        if (!order) {
            throw new Error("Failed to create order");
        }

        // ذخیره جزئیات اختصاصی سرویس
        if (details) {
            await db
                .insert(orderDetails)
                .values({
                    orderId: order.id,
                    serviceType: serviceType,
                    data: JSON.stringify(details),
                    createdAt: now,
                });
        }

        // پیدا کردن ادمین‌ها
        const admins = await db
            .select()
            .from(users)
            .where(
                eq(users.role, "admin")
            );

        // ساخت Notification برای ادمین‌ها
        for (const admin of admins) {
            await createNotificationQuery(
                db,
                {
                    userId: admin.id,
                    orderId: order.id,
                    title: "سفارش جدید",
                    body: `سفارش جدید ثبت شد: ${order.title}`,
                    type: "new_order",
                }
            );
        }

        return c.json({
            success: true,
            order,
        });

    } catch (error) {

        console.error(
            "Create order error:",
            error
        );

        return c.json({
            success: false,
            message:
                error.message ||
                "خطا در ایجاد سفارش",
        }, 500);
    }

});


// =====================================================
// سفارش‌های مشتری
// GET /orders/history
// =====================================================

ordersRoute.get("/history", async (c) => {

    const db = getDb(c.env);

    const user = c.get("user");


    const result = await db
        .select()
        .from(orders)
        .where(
            eq(
                orders.userId,
                user.id
            )
        )
        .orderBy(
            desc(
                orders.createdAt
            )
        );


    return c.json({

        success:
            true,

        orders:
            result,

    });

});


// =====================================================
// جزئیات سفارش مشتری
// GET /orders/:id
// =====================================================

ordersRoute.get("/:id", async (c) => {

    const db = getDb(c.env);

    const user = c.get("user");


    const orderId =
        Number(
            c.req.param("id")
        );


    if (!Number.isInteger(orderId)) {

        return c.json({

            success:
                false,

            message:
                "Invalid order id",

        }, 400);

    }


    /*
     * فقط سفارش متعلق به خود کاربر
     */

    const result = await db
        .select()
        .from(orders)
        .where(
            and(

                eq(
                    orders.id,
                    orderId
                ),

                eq(
                    orders.userId,
                    user.id
                )

            )
        );


    const order =
        result[0];


    if (!order) {

        return c.json({

            success:
                false,

            message:
                "Order not found",

        }, 404);

    }


    /*
     * تاریخچه وضعیت
     */

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


    /*
     * جزئیات سفارش
     */

    const details = await db
        .select()
        .from(orderDetails)
        .where(
            eq(
                orderDetails.orderId,
                orderId
            )
        );


    /*
     * اطلاعات حساس سرویس را فعلاً
     * برای مشتری برنمی‌گردانیم.
     *
     * بعداً اگر لازم بود، endpoint
     * جداگانه برای جزئیات طراحی می‌کنیم.
     */

    return c.json({

        success:
            true,

        order,

        history,

        details,

    });

});


export default ordersRoute;