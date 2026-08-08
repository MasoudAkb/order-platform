import { jwtVerify } from "jose";

export async function authMiddleware(c, next) {
  const authHeader = c.req.header("Authorization");

  if (!authHeader) {
    return c.json(
      {
        success: false,
        message: "Missing token"
      },
      401
    );
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    const secret = new TextEncoder().encode(
      c.env.JWT_SECRET
    );

    const { payload } = await jwtVerify(
      token,
      secret
    );

    c.set("user", payload);

    await next();

  } catch (error) {
    return c.json(
      {
        success: false,
        message: "Invalid token"
      },
      401
    );
  }
}