import { getDb } from "./db";
import { users, accounts } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { createHash, randomBytes } from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-change-in-production";

/**
 * Simple password hashing using SHA-256 + salt
 * (bcrypt would be better but requires native compilation)
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = createHash("sha256")
    .update(password + salt)
    .digest("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(":");
  const testHash = createHash("sha256")
    .update(password + salt)
    .digest("hex");
  return hash === testHash;
}

/**
 * Generate JWT token for authenticated user
 */
export function generateToken(userId: number, accountId: number | null, role: string): string {
  return jwt.sign(
    {
      userId,
      accountId,
      role,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

/**
 * Verify JWT token and return payload
 */
export function verifyToken(token: string): { userId: number; accountId: number | null; role: string } | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    return {
      userId: payload.userId,
      accountId: payload.accountId,
      role: payload.role,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Authenticate user with email and password
 */
export async function authenticateUser(
  email: string,
  password: string
): Promise<{ user: typeof users.$inferSelect; token: string } | null> {
  const db = await getDb();
  if (!db) return null;

  // Find user by email
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (!user) {
    return null;
  }

  // Verify password
  if (!verifyPassword(password, user.passwordHash)) {
    return null;
  }

  // Check if user is active
  if (user.isActive !== 1) {
    return null;
  }

  // Update last signed in
  await db
    .update(users)
    .set({ lastSignedIn: new Date() })
    .where(eq(users.id, user.id));

  // Generate token
  const token = generateToken(user.id, user.accountId, user.role);

  return { user, token };
}

/**
 * Get user by ID with account info
 */
export async function getUserById(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

  if (!user) {
    return null;
  }

  // If user has accountId, fetch account info
  if (user.accountId) {
    const [account] = await db
      .select()
      .from(accounts)
      .where(eq(accounts.id, user.accountId))
      .limit(1);

    return {
      ...user,
      account: account || null,
    };
  }

  return {
    ...user,
    account: null,
  };
}

/**
 * Check if user has permission for action
 */
export function hasPermission(userRole: string, requiredRole: "super_admin" | "admin" | "team" | "customer"): boolean {
  const roleHierarchy = {
    super_admin: 4,
    admin: 3,
    team: 2,
    customer: 1,
  };

  const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0;
  const requiredLevel = roleHierarchy[requiredRole];

  return userLevel >= requiredLevel;
}
