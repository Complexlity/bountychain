import { defineConfig } from "drizzle-kit";

import env from "@/lib/server-env";

const config = Object.freeze({
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: env.DIALECT,
  dbCredentials: {
    url: env.DATABASE_URL,
    authToken: env.DATABASE_AUTH_TOKEN,
  },
});
export default defineConfig(config);
