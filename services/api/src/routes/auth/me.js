import { Hono } from "hono";
import { authMiddleware } from "../../middleware/auth";
import { getDb } from "../../database/db";
import { users } from "../../database/schema";
import { eq } from "drizzle-orm";


const me = new Hono();


me.use("*", authMiddleware);



me.get("/", async (c)=>{


const db = getDb(c.env);


const user = c.get("user");


const result = await db
.select({
 id: users.id,
 name: users.name,
 phone: users.phone,
 role: users.role,
 balance: users.balance,
 mustChangePassword: users.mustChangePassword
})
.from(users)
.where(
 eq(users.id,user.id)
);



if(!result[0]){

return c.json({
success:false,
message:"User not found"
},404);

}



return c.json({

success:true,

user:result[0]

});


});


export default me;