import { eq } from "drizzle-orm";

import {
  notifications,
  pushSubscriptions
} from "../database/schema";



// فقط ذخیره Notification در دیتابیس
// این تابع می‌تواند داخل transaction اجرا شود.

export async function createNotificationQuery(
  db,
  {
    userId,
    orderId = null,
    title,
    body,
    type
  }
) {

  const now = Date.now();

  await db
    .insert(notifications)
    .values({

      userId,

      orderId,

      title,

      body,

      type,

      isRead: 0,

      createdAt: now

    });

}



// ارسال Push به OneSignal
// این تابع نباید داخل transaction اجرا شود.

export async function sendNotificationPush(
  db,
  {
    userId,
    orderId = null,
    title,
    body,
    type
  }
) {

  const env = db._env;



  if (
    !env ||
    !env.ONESIGNAL_APP_ID ||
    !env.ONESIGNAL_REST_API_KEY
  ) {

    return;

  }



  const subscriptions = await db
    .select()
    .from(pushSubscriptions)
    .where(
      eq(
        pushSubscriptions.userId,
        userId
      )
    );



  if (!subscriptions.length) {

    return;

  }



  const playerIds =
    subscriptions.map(
      item => item.playerId
    );



  try {

    const response = await fetch(
      "https://onesignal.com/api/v1/notifications",
      {

        method: "POST",

        headers: {

          "Content-Type":
            "application/json",

          "Authorization":
            `Basic ${env.ONESIGNAL_REST_API_KEY}`

        },

        body: JSON.stringify({

          app_id:
            env.ONESIGNAL_APP_ID,

          include_player_ids:
            playerIds,

          headings: {

            en:
              title

          },

          contents: {

            en:
              body

          },

          data: {

            orderId,

            type

          }

        })

      }
    );



    if (!response.ok) {

      const errorText =
        await response.text();

      console.error(
        "OneSignal error:",
        response.status,
        errorText
      );

    }

  } catch (error) {

    /*
     * Push شکست خورد ولی سفارش
     * قبلاً با موفقیت Commit شده است.
     *
     * بنابراین transaction را rollback نمی‌کنیم.
     */

    console.error(
      "OneSignal fetch error:",
      error
    );

  }

}
