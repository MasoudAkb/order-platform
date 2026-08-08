import { Hono } from "hono";
import { getDb } from "../../database/db";
import { users } from "../../database/schema";
import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword } from "../../utils/password";
import { authMiddleware } from "../../middleware/auth";


const password = new Hono();


password.use("*", authMiddleware);



password.post("/change", async (c) => {

  try {

    const db = getDb(c.env);

    const user = c.get("user");


    const body = await c.req.json();


    const {
      oldPassword,
      newPassword,
      confirmPassword
    } = body;



    if (!oldPassword || !newPassword || !confirmPassword) {

      return c.json({
        success:false,
        message:"Old password and new password are required"
      },400);

    }



    if (newPassword !== confirmPassword) {

      return c.json({
        success:false,
        message:"New passwords do not match"
      },400);

    }



    if (newPassword.length < 6) {

      return c.json({
        success:false,
        message:"Password must be at least 6 characters"
      },400);

    }



    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id));



    const currentUser = result[0];



    if (!currentUser) {

      return c.json({
        success:false,
        message:"User not found"
      },404);

    }



    const valid = await verifyPassword(
      oldPassword,
      currentUser.passwordHash
    );



    if (!valid) {

      return c.json({
        success:false,
        message:"Current password is incorrect"
      },401);

    }



    const newHash = await hashPassword(
      newPassword
    );



    await db
      .update(users)
      .set({

        passwordHash:newHash,

        mustChangePassword:0

      })
      .where(eq(users.id,user.id));



    return c.json({

      success:true,

      message:"Password changed successfully"

    });



  } catch(error){

    console.error(error);

    return c.json({

      success:false,

      message:"Internal server error"

    },500);

  }

});


export default password;