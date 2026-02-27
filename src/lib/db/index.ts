import { drizzle } from "drizzle-orm/singlestore/driver";
import { Pool } from "pg";
import * as schema from "./schema";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
});

export const db = drizzle(pool, { schema });

// What this does, line by line:

// Pool — a connection pool from the pg driver. Instead of opening a new database connection every time we run a query, a pool keeps a set of connections open and reuses them. Much faster and more efficient
// drizzle(pool, { schema }) — creates the Drizzle client, passing it the connection pool and our schema so it knows all our tables
// export const db — this is what we'll import everywhere in our app when we need to talk to the database. One single db instance shared across the whole project

// From now on, anywhere we need data, we just:
// import { db } from "@/lib/db";
// And that's our database connection, ready to query.
