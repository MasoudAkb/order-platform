import { Hono } from "hono";

import { getDb } from "../../database/db";

import { authMiddleware } from "../../middleware/auth";
import { adminMiddleware } from "../../middleware/admin";

import {
    sendNotificationPush,
} from "../../utils/notification";

const reject = new Hono();

reject.use("*", authMiddleware);
reject.use("*", adminMiddleware);


// POST /admin/orders/:id/reject

reject.post("/:id/reject", async (c) => {

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


    let body = {};

    try {

        body = await c.req.json();

    } catch {
        // body اختیاری است
    }


    const rejectReason =
        body.rejectReason
            ? String(body.rejectReason).trim()
            : "";


    /*
     * پیدا کردن سفارش
     */

    const result = await rawDb
        .prepare(`
            SELECT *
            FROM orders
            WHERE id = ?
            LIMIT 1
        `)
        .bind(orderId)
        .all();

    const order = result.results?.[0];


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
                "Only pending orders can be rejected"
        }, 400);

    }


    const now = Date.now();


    const notificationBody =
        rejectReason
            ? `سفارش شما رد شد. دلیل: ${rejectReason}`
            : "سفارش شما رد شد.";


    try {

        /*
         * D1 batch:
         *
         * UPDATE
         * + STATUS HISTORY
         * + NOTIFICATION
         */

        await rawDb.batch([

            /*
             * 1) Reject
             */

            rawDb
                .prepare(`
                    UPDATE orders
                    SET
                        status = 'rejected',
                        reject_reason = ?,
                        updated_at = ?
                    WHERE
                        id = ?
                        AND status = 'pending'
                `)
                .bind(
                    rejectReason || null,
                    now,
                    orderId
                ),


            /*
             * 2) History
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
                        'rejected',
                        ?,
                        ?

                    FROM orders

                    WHERE
                        id = ?
                        AND status = 'rejected'
                        AND updated_at = ?

                        AND NOT EXISTS (
                            SELECT 1
                            FROM order_status_history
                            WHERE
                                order_id = ?
                                AND old_status = 'pending'
                                AND new_status = 'rejected'
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
             * 3) Notification
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
                        AND status = 'rejected'
                        AND updated_at = ?

                        AND NOT EXISTS (
                            SELECT 1
                            FROM notifications
                            WHERE
                                order_id = ?
                                AND type = 'order_rejected'
                                AND created_at = ?
                        )
                `)
                .bind(
                    "سفارش رد شد",
                    notificationBody,
                    "order_rejected",
                    now,
                    orderId,
                    now,
                    orderId,
                    now
                )

        ]);


        /*
         * سفارش نهایی
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


        if (updatedOrder.status !== "rejected") {

            return c.json({
                success: false,
                message:
                    "Order is no longer pending"
            }, 409);

        }


        /*
         * Push خارج از batch
         */

        await sendNotificationPush(
            db,
            {
                userId:
                    updatedOrder.user_id,

                orderId:
                    updatedOrder.id,

                title:
                    "سفارش رد شد",

                body:
                    notificationBody,

                type:
                    "order_rejected"
            }
        );


        return c.json({

            success: true,

            order: updatedOrder

        });


    } catch (error) {

        console.error(
            "Reject order error:",
            error
        );

        return c.json({

            success: false,

            message:
                error?.message ||
                "خطا در رد سفارش"

        }, 500);

    }

});


export default reject;