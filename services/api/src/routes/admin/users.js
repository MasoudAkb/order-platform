import { Hono } from "hono";
import { eq, desc, count } from "drizzle-orm";

import { getDb } from "../../database/db";

import {
  users,
  orders,
  walletTransactions
} from "../../database/schema";

import { hashPassword } from "../../utils/password";

import { authMiddleware } from "../../middleware/auth";
import { adminMiddleware } from "../../middleware/admin";


const adminUsers = new Hono();


adminUsers.use("*", authMiddleware);
adminUsers.use("*", adminMiddleware);


// ساخت کاربر توسط ادمین
// POST /admin/users

adminUsers.post("/", async (c) => {

  const db = getDb(c.env);

  const body = await c.req.json();

  const {
    name,
    phone,
    password
  } = body;


  if (!name || !phone || !password) {

    return c.json({
      success: false,
      message: "name phone password required"
    }, 400);

  }


  const passwordHash = await hashPassword(password);


  const result = await db
    .insert(users)
    .values({

      name,

      phone,

      passwordHash,

      role: "customer",

      balance: 0,

      mustChangePassword: 1,

      createdAt: Date.now()

    })
    .returning();


  const user = result[0];


  return c.json({
    success: true,

    user: {
      id: user.id,
      name: user.name,
      phone: user.phone,
      role: user.role,
      balance: user.balance,
      mustChangePassword: user.mustChangePassword,
      createdAt: user.createdAt
    }
  });

});


// لیست کاربران
// GET /admin/users

adminUsers.get("/", async (c) => {

  const db = getDb(c.env);


  const result = await db
    .select()
    .from(users)
    .orderBy(
      desc(users.createdAt)
    );


  const data = [];


  for (const user of result) {

    const orderCount = await db
      .select({
        count: count()
      })
      .from(orders)
      .where(
        eq(
          orders.userId,
          user.id
        )
      );


    data.push({

      id: user.id,

      name: user.name,

      phone: user.phone,

      role: user.role,

      balance: user.balance,

      mustChangePassword: user.mustChangePassword,

      ordersCount:
        orderCount[0].count

    });

  }


  return c.json({
    success: true,
    users: data
  });

});


// جزئیات کاربر
// GET /admin/users/:id

adminUsers.get("/:id", async (c) => {

  const db = getDb(c.env);


  const userId = Number(
    c.req.param("id")
  );


  const userResult = await db
    .select({
      id: users.id,
      name: users.name,
      phone: users.phone,
      role: users.role,
      balance: users.balance,
      mustChangePassword: users.mustChangePassword,
      createdAt: users.createdAt
    })
    .from(users)
    .where(
      eq(users.id, userId)
    );


  const user = userResult[0];


  if (!user) {

    return c.json({
      success: false,
      message: "User not found"
    }, 404);

  }


  const userOrders = await db
    .select()
    .from(orders)
    .where(
      eq(
        orders.userId,
        userId
      )
    )
    .orderBy(
      desc(orders.createdAt)
    );


  const transactions = await db
    .select()
    .from(walletTransactions)
    .where(
      eq(
        walletTransactions.userId,
        userId
      )
    )
    .orderBy(
      desc(walletTransactions.createdAt)
    );


  return c.json({

    success: true,

    user,

    orders: userOrders,

    transactions

  });

});


// تغییر رمز
// PATCH /admin/users/:id/password

adminUsers.patch("/:id/password", async (c) => {

  const db = getDb(c.env);


  const userId = Number(
    c.req.param("id")
  );


  const body = await c.req.json();


  if (!body.password) {

    return c.json({
      success: false,
      message: "Password required"
    }, 400);

  }


  const passwordHash =
    await hashPassword(body.password);


  const result = await db
    .update(users)
    .set({

      passwordHash,

      mustChangePassword: 1

    })
    .where(
      eq(users.id, userId)
    )
    .returning();


  if (!result[0]) {

    return c.json({
      success: false,
      message: "User not found"
    }, 404);

  }


  return c.json({
    success: true
  });

});


// تغییر نقش
// PATCH /admin/users/:id/role

adminUsers.patch("/:id/role", async (c) => {

  const db = getDb(c.env);


  const userId = Number(
    c.req.param("id")
  );


  const body = await c.req.json();

  const allowed = [
    "customer",
    "admin"
  ];


  if (!allowed.includes(body.role)) {

    return c.json({
      success: false,
      message: "Invalid role"
    }, 400);

  }


  const result = await db
    .update(users)
    .set({

      role: body.role

    })
    .where(
      eq(users.id, userId)
    )
    .returning();


  if (!result[0]) {

    return c.json({
      success: false,
      message: "User not found"
    }, 404);

  }


  const user = result[0];


  return c.json({
    success: true,

    user: {
      id: user.id,
      name: user.name,
      phone: user.phone,
      role: user.role,
      balance: user.balance,
      mustChangePassword: user.mustChangePassword,
      createdAt: user.createdAt
    }
  });

});


export default adminUsers;
