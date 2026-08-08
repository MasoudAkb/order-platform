export async function adminMiddleware(c, next) {

  const user = c.get("user");

  if (!user) {
    return c.json({
      success: false,
      message: "Unauthorized"
    }, 401);
  }


  if (user.role !== "admin") {
    return c.json({
      success: false,
      message: "Admin access required"
    }, 403);
  }


  await next();
}