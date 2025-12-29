import { drizzle } from "drizzle-orm/mysql2";
import { mysqlTable, int, varchar, text, timestamp, mysqlEnum } from "drizzle-orm/mysql-core";
import { createHash, randomBytes } from "crypto";

// Define users table inline to avoid TypeScript import issues
const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  accountId: int("accountId"),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: text("passwordHash").notNull(),
  name: text("name"),
  role: mysqlEnum("role", ["super_admin", "admin", "team", "customer"]).default("customer").notNull(),
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

// Simple password hashing (same as in server/auth.ts)
function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = createHash("sha256")
    .update(password + salt)
    .digest("hex");
  return `${salt}:${hash}`;
}

async function createSuperAdmin() {
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL not set");
    process.exit(1);
  }

  const db = drizzle(process.env.DATABASE_URL);

  const email = "admin@finestaudience.de";
  const password = "FinestAudience2025!";
  const name = "Finest Audience Admin";

  try {
    const passwordHash = hashPassword(password);

    await db.insert(users).values({
      email,
      passwordHash,
      name,
      role: "super_admin",
      accountId: null, // Super admin has no account (manages all accounts)
      isActive: 1,
    });

    console.log("✅ Super Admin Account erstellt!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📧 Email:    ", email);
    console.log("🔑 Passwort: ", password);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n⚠️  WICHTIG: Bitte Passwort nach dem ersten Login ändern!");

    process.exit(0);
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      console.log("ℹ️  Super Admin Account existiert bereits");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("📧 Email:    ", email);
      console.log("🔑 Passwort: ", password);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      process.exit(0);
    }

    console.error("❌ Fehler beim Erstellen des Super Admin Accounts:", error);
    process.exit(1);
  }
}

createSuperAdmin();
