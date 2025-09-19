import db from "./db";
import fs from "fs";
import path from "path";

export async function runMigrations() {
  const migrationPath = path.join(process.cwd(), "frontend/migrations/001_init.sql");
  const sql = fs.readFileSync(migrationPath, "utf-8");
  await db.query(sql);
  console.log("✅ Database migrations applied");
}
