import { SignJWT, jwtVerify } from "jose";

export async function createToken(user, secret) {
  const key = new TextEncoder().encode(secret);

  return await new SignJWT({
    id: user.id,
    role: user.role,
  })
    .setProtectedHeader({
      alg: "HS256",
    })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(key);
}

export async function verifyToken(token, secret) {
  const key = new TextEncoder().encode(secret);

  const { payload } = await jwtVerify(token, key);

  return payload;
}