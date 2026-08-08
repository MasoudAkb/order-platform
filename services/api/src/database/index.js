import { drizzle } from "drizzle-orm/d1";

export function createDatabase(env) {
  return drizzle(env.order_platform_db);
}