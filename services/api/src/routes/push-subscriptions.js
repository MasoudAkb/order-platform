import { Hono } from "hono";
import { eq } from "drizzle-orm";

import { getDb } from "../database/db";
import { pushSubscriptions } from "../database/schema";

import { authMiddleware } from "../middleware/auth";


const push = new Hono();


push.use("*", authMiddleware);



push.post("/", async (c) => {

  const db = getDb(c.env);

  const user = c.get("user");


  let body;

  try {

    body = await c.req.json();

  } catch {

    return c.json({

      success: false,
      message: "Invalid JSON"

    }, 400);

  }


  const playerId = body.playerId;



  if (!playerId) {

    return c.json({

      success: false,
      message: "playerId required"

    }, 400);

  }



  const existing = await db
    .select()
    .from(pushSubscriptions)
    .where(
      eq(
        pushSubscriptions.playerId,
        playerId
      )
    );



  if (existing.length) {


    await db
      .update(pushSubscriptions)
      .set({

        userId: user.id

      })
      .where(

        eq(
          pushSubscriptions.playerId,
          playerId
        )

      );



  } else {


    await db
      .insert(pushSubscriptions)
      .values({

        userId: user.id,
        playerId,
        createdAt: Date.now()

      });


  }



  return c.json({

    success: true

  });


});


export default push;