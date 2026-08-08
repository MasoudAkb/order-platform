import { Hono } from "hono";
import { eq, and, desc } from "drizzle-orm";

import { getDb } from "../database/db";
import { notifications } from "../database/schema";

import { authMiddleware } from "../middleware/auth";

const notificationsRoute = new Hono();


// تمام Routeهای اعلان فقط نیاز به لاگین دارند
notificationsRoute.use("*", authMiddleware);


// GET /notifications
// دریافت اعلان‌های کاربر فعلی
notificationsRoute.get("/", async (c) => {

    const db = getDb(c.env);
    const user = c.get("user");

    const result = await db
        .select()
        .from(notifications)
        .where(
            eq(
                notifications.userId,
                user.id
            )
        )
        .orderBy(
            desc(notifications.createdAt)
        );

    const unread = result.filter(
        item => item.isRead === 0
    ).length;

    return c.json({
        success: true,
        unread,
        notifications: result
    });
});


// PATCH /notifications/:id/read
// خواندن یک اعلان
notificationsRoute.patch("/:id/read", async (c) => {

    const db = getDb(c.env);
    const user = c.get("user");

    const id = Number(
        c.req.param("id")
    );

    if (!Number.isInteger(id)) {

        return c.json({
            success: false,
            message: "Invalid notification id"
        }, 400);

    }


    const result = await db
        .update(notifications)
        .set({
            isRead: 1
        })
        .where(
            and(
                eq(
                    notifications.id,
                    id
                ),

                // خیلی مهم:
                // فقط صاحب اعلان اجازه خواندن آن را دارد
                eq(
                    notifications.userId,
                    user.id
                )
            )
        )
        .returning();


    if (!result[0]) {

        return c.json({
            success: false,
            message: "Notification not found"
        }, 404);

    }


    return c.json({
        success: true,
        notification: result[0]
    });

});


// PATCH /notifications/read-all
// خواندن تمام اعلان‌های کاربر فعلی
notificationsRoute.patch("/read-all", async (c) => {

    const db = getDb(c.env);
    const user = c.get("user");


    await db
        .update(notifications)
        .set({
            isRead: 1
        })
        .where(
            eq(
                notifications.userId,
                user.id
            )
        );


    return c.json({
        success: true
    });

});


export default notificationsRoute;