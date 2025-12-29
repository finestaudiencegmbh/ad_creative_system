import { describe, it, expect, beforeAll } from "vitest";
import { generateResetToken, createPasswordResetToken, verifyResetToken, resetPasswordWithToken } from "./password-reset";
import { getDb } from "./db";
import { users, passwordResetTokens } from "../drizzle/schema";
import { hashPassword } from "./auth";
import { eq } from "drizzle-orm";

describe("Password Reset System", () => {
  let testUserId: number;
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = "TestPassword123!";

  beforeAll(async () => {
    // Create test user
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const [user] = await db.insert(users).values({
      email: testEmail,
      passwordHash: hashPassword(testPassword),
      name: "Test User",
      role: "customer",
      accountId: null,
      isActive: 1,
    }).$returningId();

    testUserId = user.id;
  });

  describe("Token Generation", () => {
    it("should generate random token", () => {
      const token1 = generateResetToken();
      const token2 = generateResetToken();

      expect(token1).toBeTruthy();
      expect(token2).toBeTruthy();
      expect(token1).not.toBe(token2);
      expect(token1.length).toBe(64); // 32 bytes = 64 hex chars
    });
  });

  describe("Create Reset Token", () => {
    it("should create reset token for existing user", async () => {
      const result = await createPasswordResetToken(testEmail);

      expect(result).toBeTruthy();
      expect(result?.token).toBeTruthy();
      expect(result?.userId).toBe(testUserId);
    });

    it("should return null for non-existent user", async () => {
      const result = await createPasswordResetToken("nonexistent@example.com");
      expect(result).toBeNull();
    });

    it("should store token in database", async () => {
      const result = await createPasswordResetToken(testEmail);
      expect(result).toBeTruthy();

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [token] = await db
        .select()
        .from(passwordResetTokens)
        .where(eq(passwordResetTokens.token, result!.token))
        .limit(1);

      expect(token).toBeTruthy();
      expect(token.userId).toBe(testUserId);
      expect(token.used).toBe(0);
    });
  });

  describe("Verify Reset Token", () => {
    it("should verify valid token", async () => {
      const result = await createPasswordResetToken(testEmail);
      expect(result).toBeTruthy();

      const userId = await verifyResetToken(result!.token);
      expect(userId).toBe(testUserId);
    });

    it("should reject invalid token", async () => {
      const userId = await verifyResetToken("invalid-token-12345");
      expect(userId).toBeNull();
    });

    it("should reject used token", async () => {
      const result = await createPasswordResetToken(testEmail);
      expect(result).toBeTruthy();

      // Use token once
      await resetPasswordWithToken(result!.token, "NewPassword123!");

      // Try to verify again
      const userId = await verifyResetToken(result!.token);
      expect(userId).toBeNull();
    });
  });

  describe("Reset Password", () => {
    it("should reset password with valid token", async () => {
      const result = await createPasswordResetToken(testEmail);
      expect(result).toBeTruthy();

      const newPassword = "NewPassword456!";
      const success = await resetPasswordWithToken(result!.token, newPassword);

      expect(success).toBe(true);

      // Verify password was changed
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, testUserId))
        .limit(1);

      expect(user).toBeTruthy();
      // Password hash should be different now
      expect(user.passwordHash).not.toBe(hashPassword(testPassword));
    });

    it("should fail with invalid token", async () => {
      const success = await resetPasswordWithToken("invalid-token", "NewPassword789!");
      expect(success).toBe(false);
    });
  });
});
