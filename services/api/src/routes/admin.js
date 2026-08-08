import { Hono } from "hono";
import { getDb } from "../database/db";
import { users } from "../database/schema";
import { hashPassword } from "../utils/password";

const admin = new Hono();


admin.post("/users", async (c) => {

  const db = getDb(c.env);

  const body = await c.req.json();

  const {
    name,
    phone,
    password
  } = body;


  const passwordHash = await hashPassword(password);


  const result = await db.insert(users)
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


export default admin;