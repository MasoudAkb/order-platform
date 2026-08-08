import { Hono } from "hono";
import { eq } from "drizzle-orm";

import { getDb } from "../../database/db";

import {
  orders,
  orderDetails,
  servicePrices
} from "../../database/schema";

import { authMiddleware } from "../../middleware/auth";

const appleId = new Hono();

appleId.use("*", authMiddleware);


// POST /orders/apple-id
//
// ثبت سفارش ساخت Apple ID
//
// قیمت سفارش در این مرحله ذخیره نمی‌شود.
// قیمت نهایی هنگام تأیید سفارش توسط ادمین
// از جدول service_prices خوانده خواهد شد.

appleId.post("/", async (c) => {

  const db = getDb(c.env);

  const user = c.get("user");


  // دریافت اطلاعات فرم

  let body;

  try {

    body = await c.req.json();

  } catch {

    return c.json({

      success: false,

      message: "Invalid JSON"

    }, 400);

  }


  const {
    email = "",
    fullName,
    phone = "",
    password = "",
    birthDate = "",
    security1 = "",
    security2 = "",
    security3 = ""
  } = body;


  // نام الزامی است

  if (!fullName || !fullName.trim()) {

    return c.json({

      success: false,

      message: "Full name is required"

    }, 400);

  }


  // تعیین نوع سرویس
  //
  // اگر مشتری ایمیل داشته باشد:
  // apple_id_with_email
  //
  // اگر ایمیل نداشته باشد:
  // apple_id_without_email

  const serviceType = email.trim()
    ? "apple_id_with_email"
    : "apple_id_without_email";


  // بررسی اینکه سرویس در دیتابیس تعریف شده باشد

  const priceResult = await db
    .select()
    .from(servicePrices)
    .where(
      eq(
        servicePrices.serviceType,
        serviceType
      )
    );


  const service = priceResult[0];


  if (!service) {

    return c.json({

      success: false,

      message: "Service is not available"

    }, 400);

  }


  const now = Date.now();


  // ایجاد سفارش
  //
  // توجه:
  // price عمداً اینجا ثبت نمی‌شود.
  //
  // قیمت نهایی هنگام Approve توسط ادمین
  // از service_prices خوانده می‌شود.

  const orderResult = await db
    .insert(orders)
    .values({

      userId: user.id,

      title: service.title,

      description: service.serviceType,

      status: "pending",

      price: service.basePrice,

      createdAt: now,

      updatedAt: now

    })
    .returning();


  const order = orderResult[0];


  // ذخیره جزئیات سفارش

  await db
    .insert(orderDetails)
    .values({

      orderId: order.id,

      serviceType,

      data: JSON.stringify({

        email: email.trim(),

        fullName: fullName.trim(),

        phone,

        password,

        birthDate,

        security1,

        security2,

        security3

      }),

      createdAt: now

    });


  // پاسخ

  return c.json({

    success: true,

    order: {

      id: order.id,

      title: order.title,

      description: order.description,

      status: order.status,

      price: order.price,

      createdAt: order.createdAt,

      updatedAt: order.updatedAt

    }

  });

});


export default appleId;

