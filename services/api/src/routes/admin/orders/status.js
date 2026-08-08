import { Hono } from "hono";
import { eq } from "drizzle-orm";

import { getDb } from "../../../database/db";
import {
  orders,
  orderStatusHistory
} from "../../../database/schema";

import { authMiddleware } from "../../../middleware/auth";
import { adminMiddleware } from "../../../middleware/admin";


const status = new Hono();


status.use("*", authMiddleware);
status.use("*", adminMiddleware);



status.patch("/:id/status", async (c)=>{


  const db = getDb(c.env);



  const orderId = Number(
    c.req.param("id")
  );



  const body = await c.req.json();


  const newStatus = body.status;



  if(newStatus !== "processing"){

    return c.json({

      success:false,

      message:"Only processing status is allowed"

    },400);

  }



  const result = await db
    .select()
    .from(orders)
    .where(eq(orders.id,orderId));



  const order = result[0];



  if(!order){

    return c.json({

      success:false,

      message:"Order not found"

    },404);

  }



  if(order.status !== "pending"){

    return c.json({

      success:false,

      message:"Only pending orders can be moved to processing"

    },400);

  }



  const now = Date.now();



  const updated = await db
    .update(orders)
    .set({

      status:"processing",

      updatedAt:now

    })
    .where(eq(orders.id,orderId))
    .returning();




  await db
    .insert(orderStatusHistory)
    .values({

      orderId:orderId,

      oldStatus:order.status,

      newStatus:"processing",

      changedBy:c.get("user").id,

      createdAt:now

    });




  return c.json({

    success:true,

    order:updated[0]

  });


});


export default status;