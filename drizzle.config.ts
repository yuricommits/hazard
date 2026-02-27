// import { defineConfig } from "drizzle-kit";

// export default defineConfig({
//   schema: "./src/lib/db/schema.ts",
//   out: "./supabase/migrations",
//   dialect: "postgresql",
//   dbCredentials: {
//     url: process.env.DATABASE_URL!,
//   },
// });

import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./supabase/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});

// What changed: dotenv.config({ path: ".env.local" }) tells Drizzle Kit to load environment variables from .env.local specifically, before it tries to read anything else.
