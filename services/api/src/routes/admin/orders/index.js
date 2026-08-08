import { Hono } from "hono";
import { eq, desc } from "drizzle-orm";

import { getDb } from "../../../database/db";

import {
  orders,
  users,
  messages,
  orderStatusHistory,
  orderDetails
} from "../../../database/schema";


import { authMiddleware } from "../../../middleware/auth";
import { adminMiddleware } from "../../../middleware/admin";


const adminOrders = new Hono();


adminOrders.use("*", authMiddleware);
adminOrders.use("*", adminMiddleware);




// GET /admin/orders
// لیست سفارش‌ها

adminOrders.get("/", async (c)=>{


  const db = getDb(c.env);


  const status = c.req.query("status");



  let result;



  if(status){


    result = await db
      .select({

        order: orders,

        user: {

          id: users.id,

          name: users.name,

          phone: users.phone

        }

      })
      .from(orders)
      .leftJoin(
        users,
        eq(orders.userId, users.id)
      )
      .where(
        eq(orders.status,status)
      )
      .orderBy(
        desc(orders.createdAt)
      );


  } else {


    result = await db
      .select({

        order: orders,

        user: {

          id: users.id,

          name: users.name,

          phone: users.phone

        }

      })
      .from(orders)
      .leftJoin(
        users,
        eq(orders.userId, users.id)
      )
      .orderBy(
        desc(orders.createdAt)
      );


  }



  return c.json({

    success:true,

    orders:result

  });


});







// GET /admin/orders/:id
// جزئیات سفارش


adminOrders.get("/:id", async (c)=>{


  const db = getDb(c.env);


  const orderId = Number(
    c.req.param("id")
  );



  const result = await db
    .select({

      order: orders,

      user: {

        id: users.id,

        name: users.name,

        phone: users.phone

      }

    })
    .from(orders)
    .leftJoin(
      users,
      eq(orders.userId,users.id)
    )
    .where(
      eq(orders.id,orderId)
    );



  const data = result[0];



  if(!data){

    return c.json({

      success:false,

      message:"Order not found"

    },404);

  }





  const orderMessages = await db
    .select()
    .from(messages)
    .where(
      eq(messages.orderId,orderId)
    )
    .orderBy(
      messages.createdAt
    );




  const history = await db
    .select()
    .from(orderStatusHistory)
    .where(
      eq(orderStatusHistory.orderId,orderId)
    )
    .orderBy(
      orderStatusHistory.createdAt
    );





  const detailsResult = await db
    .select()
    .from(orderDetails)
    .where(
      eq(orderDetails.orderId,orderId)
    );



  let details = null;



  if(detailsResult[0]){

    details = {

      ...detailsResult[0],

      data: JSON.parse(
        detailsResult[0].data
      )

    };

  }





  return c.json({

    success:true,

    order:data.order,

    customer:data.user,

    details,

    messages:orderMessages,

    history

  });


});



export default adminOrders;