import { Hono } from "hono";
import { eq } from "drizzle-orm";


import { getDb } from "../../database/db";

import {
  orders,
  users
} from "../../database/schema";


import { authMiddleware } from "../../middleware/auth";
import { adminMiddleware } from "../../middleware/admin";



const dashboard = new Hono();



dashboard.use("*", authMiddleware);
dashboard.use("*", adminMiddleware);





dashboard.get("/", async (c)=>{


  const db = getDb(c.env);



  const allOrders = await db
    .select()
    .from(orders);



  const allUsers = await db
    .select()
    .from(users);




  const orderStats = {

    total: allOrders.length,

    pending:
      allOrders.filter(
        o => o.status === "pending"
      ).length,


    processing:
      allOrders.filter(
        o => o.status === "processing"
      ).length,


    completed:
      allOrders.filter(
        o => o.status === "completed"
      ).length,


    rejected:
      allOrders.filter(
        o => o.status === "rejected"
      ).length

  };





  const totalRevenue =
    allOrders
      .filter(
        o =>
          o.paymentStatus === "paid"
      )
      .reduce(
        (sum,o)=>
          sum + (o.price || 0),
        0
      );





  const totalWalletBalance =
    allUsers.reduce(
      (sum,u)=>
        sum + u.balance,
      0
    );





  return c.json({

    success:true,

    dashboard:{


      orders:orderStats,


      users:{
        total:allUsers.length
      },


      finance:{
        totalRevenue,

        totalWalletBalance
      }


    }

  });



});



export default dashboard;