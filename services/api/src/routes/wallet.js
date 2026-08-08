import { Hono } from "hono";
import { eq, desc } from "drizzle-orm";

import { getDb } from "../database/db";
import {
  users,
  walletTransactions
} from "../database/schema";

import { authMiddleware } from "../middleware/auth";


const wallet = new Hono();


wallet.use("*", authMiddleware);



wallet.get("/", async (c)=>{

  const db = getDb(c.env);

  const user = c.get("user");


  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.id,user.id));


  const currentUser = userResult[0];



  const transactions = await db
    .select()
    .from(walletTransactions)
    .where(
      eq(walletTransactions.userId,user.id)
    )
    .orderBy(
      desc(walletTransactions.createdAt)
    );



  return c.json({

    success:true,

    balance: currentUser.balance,

    transactions

  });


});


export default wallet;