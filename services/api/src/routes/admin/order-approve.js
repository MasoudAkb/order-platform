import { Hono } from "hono";

import { getDb } from "../../database/db";

import {
    orders,
    orderStatusHistory,
    notifications,
} from "../../database/schema";

import { authMiddleware } from "../../middleware/auth";
import { adminMiddleware } from "../../middleware/admin";

import {
    sendNotificationPush,
} from "../../utils/notification";

const approve = new Hono();

approve.use("*", authMiddleware);
approve.use("*", adminMiddleware);


// POST /admin/orders/:id/approve

approve.post("/:id/approve", async (c) => {

    const db = getDb(c.env);
    const rawDb = db._raw;

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

    if (!admin || !admin.id) {

        return c.json({
            success: false,
            message: "Unauthorized"
        }, 401);

    }


    /*
     * سفارش را پیدا می‌کنیم.
     */

    // const result = await db
    //     .select()
    //     .from(orders)
    //     .where(
    //         orders.id.eq
    //             ? orders.id.eq(orderId)
    //             : undefined
    //     );

    /*
     * چون Drizzle ممکن است در نسخه‌های مختلف
     * متد eq روی column نداشته باشد، سفارش را
     * با SQL خام می‌گیریم.
     */

    const orderResult = await rawDb
        .prepare(`
            SELECT *
            FROM orders
            WHERE id = ?
            LIMIT 1
        `)
        .bind(orderId)
        .all();

    const order = orderResult.results?.[0];


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
                "Only pending orders can be approved"
        }, 400);

    }


    if (!order.price || Number(order.price) <= 0) {

        return c.json({
            success: false,
            message: "Order price not set"
        }, 400);

    }


    const now = Date.now();


    /*
     * D1 batch:
     *
     * UPDATE + history + notification
     * در یک batch اتمیک اجرا می‌شوند.
     *
     * شرط pending داخل UPDATE بسیار مهم است.
     */

    try {

        await rawDb.batch([

            /*
             * 1) تغییر وضعیت
             */

            rawDb
                .prepare(`
                    UPDATE orders
                    SET
                        status = 'processing',
                        approved_at = ?,
                        updated_at = ?
                    WHERE
                        id = ?
                        AND status = 'pending'
                `)
                .bind(
                    now,
                    now,
                    orderId
                ),


            /*
             * 2) ثبت history فقط اگر همین approve
             * موفق شده باشد.
             */

            rawDb
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
                        id,
                        'pending',
                        'processing',
                        ?,
                        ?

                    FROM orders

                    WHERE
                        id = ?
                        AND status = 'processing'
                        AND approved_at = ?

                        AND NOT EXISTS (
                            SELECT 1
                            FROM order_status_history
                            WHERE
                                order_id = ?
                                AND old_status = 'pending'
                                AND new_status = 'processing'
                                AND changed_by = ?
                        )
                `)
                .bind(
                    admin.id,
                    now,
                    orderId,
                    now,
                    orderId,
                    admin.id
                ),


            /*
             * 3) notification دیتابیسی
             */

            rawDb
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
                        user_id,
                        id,
                        ?,
                        ?,
                        ?,
                        0,
                        ?

                    FROM orders

                    WHERE
                        id = ?
                        AND status = 'processing'
                        AND approved_at = ?

                        AND NOT EXISTS (
                            SELECT 1
                            FROM notifications
                            WHERE
                                order_id = ?
                                AND type = 'order_approved'
                                AND created_at = ?
                        )
                `)
                .bind(
                    "سفارش تایید شد",

                    `سفارش شما تایید شد. مبلغ سفارش ${Number(
                        order.price
                    ).toLocaleString("fa-IR")} تومان است.`,

                    "order_approved",

                    now,
                    orderId,
                    now,
                    orderId,
                    now
                )

        ]);


        /*
         * سفارش نهایی را دوباره می‌خوانیم.
         */

        const updatedResult = await rawDb
            .prepare(`
                SELECT *
                FROM orders
                WHERE id = ?
                LIMIT 1
            `)
            .bind(orderId)
            .all();

        const updatedOrder =
            updatedResult.results?.[0];


        if (!updatedOrder) {

            return c.json({
                success: false,
                message: "Order update failed"
            }, 500);

        }


        /*
         * اگر status هنوز processing نیست،
         * یعنی این درخواست عملاً approve را انجام نداده.
         */

        if (updatedOrder.status !== "processing") {

            return c.json({
                success: false,
                message:
                    "Order is no longer pending"
            }, 409);

        }


        /*
         * Push خارج از batch.
         *
         * شکست OneSignal نباید وضعیت سفارش
         * را rollback کند.
         */

        await sendNotificationPush(
            db,
            {
                userId:
                    updatedOrder.user_id,

                orderId:
                    updatedOrder.id,

                title:
                    "سفارش تایید شد",

                body:
                    `سفارش شما تایید شد. مبلغ سفارش ${Number(
                        updatedOrder.price
                    ).toLocaleString("fa-IR")} تومان است.`,

                type:
                    "order_approved"
            }
        );


        return c.json({

            success: true,

            order: updatedOrder,

            price: updatedOrder.price

        });


    } catch (error) {

        console.error(
            "Approve order error:",
            error
        );

        return c.json({

            success: false,

            message:
                error?.message ||
                "خطا در تأیید سفارش"

        }, 500);

    }

});


export default approve;