import { neonConfig, Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

// In Node.js (local dev) there's no global WebSocket — supply the ws package
if (typeof WebSocket === "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  neonConfig.webSocketConstructor = require("ws");
}

function createDb() {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  const pool = new Pool({ connectionString: url });
  return drizzle(pool, { schema });
}

export type Db = NonNullable<ReturnType<typeof createDb>>;
export const db = createDb();
