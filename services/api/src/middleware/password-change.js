import { eq } from "drizzle-orm";
import { getDb } from "../database/db";
import { users } from "../database/schema";

export async function passwordChangeMiddleware(c, next) {
  const user = c.get("user");

  if (!user) {
    return c.json(
      {
        success: false,
        message: "Unauthorized"
      },
      401
    );
  }

  const db = getDb(c.env);

  const result = await db
    .select({
      mustChangePassword: users.mustChangePassword
    })
    .from(users)
    .where(eq(users.id, user.id));

  const currentUser = result[0];

  if (!currentUser) {
    return c.json(
      {
        success: false,
        message: "User not found"
      },
      404
    );
  }

  if (currentUser.mustChangePassword === 1) {
    return c.json(
      {
        success: false,
        message: "Password change required",
        mustChangePassword: true
      },
      403
    );
  }

  await next();
}