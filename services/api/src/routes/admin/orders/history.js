import { Hono } from "hono";
import { eq, asc } from "drizzle-orm";

import { getDb } from "../../../database/db";
import {
  orders,
  orderStatusHistory
} from "../../../database/schema";

import { authMiddleware } from "../../../middleware/auth";
import { adminMiddleware } from "../../../middleware/admin";

const history = new Hono();

history.use("*", authMiddleware);
history.use("*", adminMiddleware);

// GET /admin/orders/:id/history

history.get("/:id/history", async (c) => {

  const db = getDb(c.env);

  const orderId = Number(
    c.req.param("id")
  );

  if (!Number.isInteger(orderId)) {
    return c.json({
      success: false,
      message: "Invalid order id"
    }, 400);
  }

  const orderResult = await db
    .select()
    .from(orders)
    .where(
      eq(
        orders.id,
        orderId
      )
    );

  const order = orderResult[0];

  if (!order) {
    return c.json({
      success: false,
      message: "Order not found"
    }, 404);
  }

  const result = await db
    .select()
    .from(orderStatusHistory)
    .where(
      eq(
        orderStatusHistory.orderId,
        orderId
      )
    )
    .orderBy(
      asc(
        orderStatusHistory.createdAt
      )
    );

  return c.json({
    success: true,
    order,
    history: result
  });

});

export default history;