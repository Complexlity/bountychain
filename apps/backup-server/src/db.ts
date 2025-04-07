
import env from "./env";
import { createDbClient } from "@repo/db";

const dbCredentials = {
  url: env.DATABASE_URL,
  authToken: env.DATABASE_AUTH_TOKEN,
}

const db = createDbClient(dbCredentials);

export default db;
