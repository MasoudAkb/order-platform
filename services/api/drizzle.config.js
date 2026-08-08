import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/database/schema.js",
  out: "./migrations",
  dialect: "sqlite",
  dbCredentials: {
    url: "./local.db"
  }
});