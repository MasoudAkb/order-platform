import { Hono } from "hono";
import { eq, desc, sql } from "drizzle-orm";

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




// لیست موجودی کاربران
// GET /admin/wallet

wallet.get("/", async (c)=>{

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

    success:true,

    users:result

  });


});






// تاریخچه تراکنش‌های یک کاربر
// GET /admin/wallet/:userId

wallet.get("/:userId", async (c)=>{


  const db = getDb(c.env);



  const userId = Number(
    c.req.param("userId")
  );



  const userResult = await db
    .select({

      id: users.id,

      name: users.name,

      phone: users.phone,

      balance: users.balance

    })
    .from(users)
    .where(
      eq(users.id,userId)
    );



  const user = userResult[0];



  if(!user){

    return c.json({

      success:false,

      message:"User not found"

    },404);

  }




  const transactions = await db
    .select()
    .from(walletTransactions)
    .where(
      eq(walletTransactions.userId,userId)
    )
    .orderBy(
      desc(walletTransactions.createdAt)
    );



  return c.json({

    success:true,

    user,

    transactions

  });


});








// شارژ کیف پول کاربر
// POST /admin/wallet/:userId

wallet.post("/:userId", async (c)=>{


  const db = getDb(c.env);



  const userId = Number(
    c.req.param("userId")
  );



  let body;


  try {

    body = await c.req.json();

  } catch {

    return c.json({

      success:false,

      message:"Invalid JSON body"

    },400);

  }




  const amount = Number(
    body.amount
  );



  if(!amount || amount <= 0){

    return c.json({

      success:false,

      message:"Invalid amount"

    },400);

  }





  const userResult = await db
    .select()
    .from(users)
    .where(
      eq(users.id,userId)
    );



  const user = userResult[0];



  if(!user){

    return c.json({

      success:false,

      message:"User not found"

    },404);

  }



const now = Date.now();

try {

  const result =
    await db.transaction(async (tx) => {

      /*
       * افزایش موجودی و ثبت تراکنش
       * باید اتمیک باشند.
       */

      const updated =
        await tx
          .update(users)
          .set({
            balance: sql`${users.balance} + ${amount}`
          })
          .where(
            eq(users.id, userId)
          )
          .returning();

      if (!updated[0]) {
        throw new Error("User not found");
      }

      const updatedUser =
        updated[0];

      /*
       * ثبت تراکنش کیف پول
       */

      await tx
        .insert(walletTransactions)
        .values({

          userId,

          amount,

          type: "charge",

          description:
            body.description
              ? String(body.description)
              : "Admin charge",

          createdAt: now

        });

      return updatedUser;

    });


  return c.json({

    success: true,

    userId,

    amount,

    balance: result.balance

  });

} catch (error) {

  console.error(
    "Wallet charge error:",
    error
  );

  return c.json({

    success: false,

    message:
      error.message ||
      "خطا در شارژ کیف پول"

  }, 500);

}


});



export default wallet;