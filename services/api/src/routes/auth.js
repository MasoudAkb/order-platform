import { Hono } from "hono";
import { eq } from "drizzle-orm";

import { getDb } from "../database/db";
import { users } from "../database/schema";

import { verifyPassword } from "../utils/password";
import { createToken } from "../utils/jwt";

const auth = new Hono();

auth.post("/login", async (c) => {
  const db = getDb(c.env);

  let body;

  try {
    body = await c.req.json();
  } catch {
    return c.json(
      {
        success: false,
        message: "Invalid JSON body",
      },
      400
    );
  }

  const phone = body.phone?.trim();
  const password = body.password;

  if (!phone || !password) {
    return c.json(
      {
        success: false,
        message: "شماره موبایل و رمز عبور الزامی است",
      },
      400
    );
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.phone, phone));

  const user = result[0];

  if (!user) {
    return c.json(
      {
        success: false,
        message: "شماره موبایل یا رمز عبور اشتباه است",
      },
      401
    );
  }

  const valid = await verifyPassword(
    password,
    user.passwordHash
  );

  if (!valid) {
    return c.json(
      {
        success: false,
        message: "شماره موبایل یا رمز عبور اشتباه است",
      },
      401
    );
  }

  const token = await createToken(
    user,
    c.env.JWT_SECRET
  );

  return c.json({
    success: true,
    token,
    user: {
      id: user.id,
      name: user.name,
      phone: user.phone,
      role: user.role,
      balance: user.balance,
      mustChangePassword: user.mustChangePassword,
    },
  });
});

export default auth;