import { drizzle } from "drizzle-orm/d1";


export function getDb(env) {

  const db = drizzle(env.DB);

  db._env = env;
  db._raw = env.DB;

  return db;

}