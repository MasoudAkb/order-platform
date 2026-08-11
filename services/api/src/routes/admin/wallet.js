import { Hono } from "hono";
import { eq, desc } from "drizzle-orm";

import { getDb } from "../../database/db";

import {
  users,
  walletTransactions
} from "../../database/schema";

import { authMiddleware } from "../../middleware/auth";
import { adminMiddleware } from "../../middleware/admin";

const wallet = new Hono();

wallet.use("*", authMiddleware);
wallet.use("*", adminMiddleware);


// =====================================================
// لیست موجودی کاربران
// GET /admin/wallet
// =====================================================

wallet.get("/", async (c) => {

  const db = getDb(c.env);

  const result = await db
    .select({
      id: users.id,
      name: users.name,
      phone: users.phone,
      balance: users.balance
    })
    .from(users);

  return c.json({
    success: true,
    users: result
  });

});


// =====================================================
// تاریخچه تراکنش‌های یک کاربر
// GET /admin/wallet/:userId
// =====================================================

wallet.get("/:userId", async (c) => {

  const db = getDb(c.env);

  const userId = Number(
    c.req.param("userId")
  );

  if (!Number.isInteger(userId)) {

    return c.json({
      success: false,
      message: "Invalid user id"
    }, 400);

  }

  const userResult = await db
    .select({
      id: users.id,
      name: users.name,
      phone: users.phone,
      balance: users.balance
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
      desc(
        walletTransactions.createdAt
      )
    );

  return c.json({
    success: true,
    user,
    transactions
  });

});


// =====================================================
// شارژ کیف پول کاربر
// POST /admin/wallet/:userId
// =====================================================

wallet.post("/:userId", async (c) => {

  const db = getDb(c.env);

  const userId = Number(
    c.req.param("userId")
  );

  if (!Number.isInteger(userId)) {

    return c.json({
      success: false,
      message: "Invalid user id"
    }, 400);

  }

  let body;

  try {

    body = await c.req.json();

  } catch {

    return c.json({
      success: false,
      message: "Invalid JSON body"
    }, 400);

  }

  const amount = Number(
    body.amount
  );

  if (
    !Number.isInteger(amount) ||
    amount <= 0
  ) {

    return c.json({
      success: false,
      message: "Invalid amount"
    }, 400);

  }


  // بررسی وجود کاربر

  const userResult = await db
    .select({
      id: users.id
    })
    .from(users)
    .where(
      eq(users.id, userId)
    );

  if (!userResult[0]) {

    return c.json({
      success: false,
      message: "User not found"
    }, 404);

  }


  const now = Date.now();

  const description =
    body.description
      ? String(body.description)
      : "Admin charge";


  try {

    /*
     * عملیات زیر عمداً با D1 native API
     * انجام می‌شوند.
     *
     * db.batch() فقط D1PreparedStatement
     * قبول می‌کند.
     *
     * هر دو Query داخل یک batch اتمیک
     * اجرا می‌شوند.
     */

    const updateBalance = c.env.DB
      .prepare(`
        UPDATE users
        SET balance = balance + ?
        WHERE id = ?
      `)
      .bind(
        amount,
        userId
      );


    const insertTransaction = c.env.DB
      .prepare(`
        INSERT INTO wallet_transactions
        (
          user_id,
          amount,
          type,
          description,
          created_at
        )
        VALUES (?, ?, ?, ?, ?)
      `)
      .bind(
        userId,
        amount,
        "charge",
        description,
        now
      );


    await c.env.DB.batch([
      updateBalance,
      insertTransaction
    ]);


    // موجودی نهایی

    const updatedUser = await db
      .select({
        id: users.id,
        name: users.name,
        phone: users.phone,
        balance: users.balance
      })
      .from(users)
      .where(
        eq(
          users.id,
          userId
        )
      );


    if (!updatedUser[0]) {

      return c.json({
        success: false,
        message: "User not found"
      }, 404);

    }


    return c.json({

      success: true,

      userId,

      amount,

      balance:
        updatedUser[0].balance

    });


  } catch (error) {

    console.error(
      "Wallet charge error:",
      error
    );

    return c.json({

      success: false,

      message:
        error?.message ||
        "خطا در شارژ کیف پول"

    }, 500);

  }

});


export default wallet;