import { Kysely, SqliteDialect } from "kysely";
import SQLiteDatabase from "better-sqlite3";
import { join } from "path";
import { DB } from "./types";

// Get the database path from environment variable or use default
const dbPath =
  process.env.DATABASE_URL?.replace("file:", "") ||
  join(__dirname, "../../prisma/dev.db");

console.log("dbPath", dbPath);

// SQLite database instance
const sqlite = new SQLiteDatabase(dbPath);

// Kysely instance with generated types
export const db = new Kysely<DB>({
  dialect: new SqliteDialect({
    database: sqlite,
  }),
});

// Export for convenience
export type { DB };
