import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

import * as schema from "./schema";

export function createDbClient({ url, authToken }: { url: string, authToken: string | undefined }) {
    const client = createClient({
      url,
      authToken,
    });
    return drizzle(client, {
      schema,
    });
}

;
