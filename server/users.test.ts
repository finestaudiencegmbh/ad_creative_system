import { describe, it, expect, beforeAll } from "vitest";
import { getDb } from "./db";
import { users, accounts } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword } from "./auth";
import { generateSecurePassword } from "./password-generator";

describe("User Management System", () => {
  let testAccountId: number;
  let testUserId: number;
  const timestamp = Date.now();

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create test account
    const [account] = await db
      .insert(accounts)
      .values({
        companyName: `Test Company ${timestamp}`,
        email: `test-users-${timestamp}@example.com`,
        firstName: "Test",
        lastName: "User",
      })
      .$returningId();

    testAccountId = account.id;

    // Create test user
    const password = "TestPassword123!";
    const passwordHash = hashPassword(password);

    const [user] = await db
      .insert(users)
      .values({
        accountId: testAccountId,
        email: `testuser-${timestamp}@example.com`,
        passwordHash,
        name: "Test User",
        role: "customer",
        tabPermissions: null, // All tabs
        isActive: 1,
      })
      .$returningId();

    testUserId = user.id;
  });

  describe("Tab Permissions", () => {
    it("should store tab permissions as JSON string", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const permissions = ["campaigns", "creatives"];
      const passwordHash = hashPassword("test123");

      const [user] = await db
        .insert(users)
        .values({
          accountId: testAccountId,
          email: `permissions-test-${timestamp}@example.com`,
          passwordHash,
          name: "Permissions Test",
          role: "customer",
          tabPermissions: JSON.stringify(permissions),
          isActive: 1,
        })
        .$returningId();

      const [savedUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1);

      expect(savedUser.tabPermissions).toBe(JSON.stringify(permissions));

      // Parse and verify
      const parsed = JSON.parse(savedUser.tabPermissions!);
      expect(parsed).toEqual(permissions);
    });

    it("should allow null tab permissions (all tabs)", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, testUserId))
        .limit(1);

      expect(user.tabPermissions).toBeNull();
    });

    it("should support empty array (no tabs)", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const passwordHash = hashPassword("test123");

      const [user] = await db
        .insert(users)
        .values({
          accountId: testAccountId,
          email: `no-tabs-${timestamp}@example.com`,
          passwordHash,
          name: "No Tabs User",
          role: "customer",
          tabPermissions: JSON.stringify([]),
          isActive: 1,
        })
        .$returningId();

      const [savedUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1);

      const parsed = JSON.parse(savedUser.tabPermissions!);
      expect(parsed).toEqual([]);
    });
  });

  describe("User CRUD Operations", () => {
    it("should create user with tab permissions", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const password = generateSecurePassword();
      const passwordHash = hashPassword(password);
      const permissions = ["campaigns", "performance"];

      const [user] = await db
        .insert(users)
        .values({
          accountId: testAccountId,
          email: `crud-test-${timestamp}@example.com`,
          passwordHash,
          name: "CRUD Test User",
          role: "customer",
          tabPermissions: JSON.stringify(permissions),
          isActive: 1,
        })
        .$returningId();

      expect(user.id).toBeGreaterThan(0);

      const [savedUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1);

      expect(savedUser.email).toBe(`crud-test-${timestamp}@example.com`);
      expect(savedUser.name).toBe("CRUD Test User");
      expect(JSON.parse(savedUser.tabPermissions!)).toEqual(permissions);
    });

    it("should update user tab permissions", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const newPermissions = ["generator", "creatives"];

      await db
        .update(users)
        .set({ tabPermissions: JSON.stringify(newPermissions) })
        .where(eq(users.id, testUserId));

      const [updatedUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, testUserId))
        .limit(1);

      expect(JSON.parse(updatedUser.tabPermissions!)).toEqual(newPermissions);

      // Reset to null
      await db
        .update(users)
        .set({ tabPermissions: null })
        .where(eq(users.id, testUserId));
    });

    it("should update user name and email", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const newName = "Updated Test User";
      const newEmail = `updated-testuser-${timestamp}@example.com`;

      await db
        .update(users)
        .set({ name: newName, email: newEmail })
        .where(eq(users.id, testUserId));

      const [updatedUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, testUserId))
        .limit(1);

      expect(updatedUser.name).toBe(newName);
      expect(updatedUser.email).toBe(newEmail);

      // Reset
      await db
        .update(users)
        .set({ name: "Test User", email: `testuser-${timestamp}@example.com` })
        .where(eq(users.id, testUserId));
    });

    it("should delete user", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const passwordHash = hashPassword("test123");

      const [user] = await db
        .insert(users)
        .values({
          accountId: testAccountId,
          email: `delete-test-${timestamp}@example.com`,
          passwordHash,
          name: "Delete Test",
          role: "customer",
          isActive: 1,
        })
        .$returningId();

      await db.delete(users).where(eq(users.id, user.id));

      const [deletedUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1);

      expect(deletedUser).toBeUndefined();
    });
  });

  describe("Multiple Users per Account", () => {
    it("should allow multiple users for same account", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const passwordHash = hashPassword("test123");

      // Create first user
      const [user1] = await db
        .insert(users)
        .values({
          accountId: testAccountId,
          email: `multi-user-1-${timestamp}@example.com`,
          passwordHash,
          name: "Multi User 1",
          role: "customer",
          tabPermissions: JSON.stringify(["campaigns"]),
          isActive: 1,
        })
        .$returningId();

      // Create second user
      const [user2] = await db
        .insert(users)
        .values({
          accountId: testAccountId,
          email: `multi-user-2-${timestamp}@example.com`,
          passwordHash,
          name: "Multi User 2",
          role: "customer",
          tabPermissions: JSON.stringify(["performance"]),
          isActive: 1,
        })
        .$returningId();

      // Fetch all users for account
      const accountUsers = await db
        .select()
        .from(users)
        .where(eq(users.accountId, testAccountId));

      expect(accountUsers.length).toBeGreaterThanOrEqual(2);

      const user1Data = accountUsers.find((u) => u.id === user1.id);
      const user2Data = accountUsers.find((u) => u.id === user2.id);

      expect(user1Data).toBeDefined();
      expect(user2Data).toBeDefined();
      expect(JSON.parse(user1Data!.tabPermissions!)).toEqual(["campaigns"]);
      expect(JSON.parse(user2Data!.tabPermissions!)).toEqual(["performance"]);
    });
  });

  describe("Password Management", () => {
    it("should hash and verify password correctly", () => {
      const password = "SecurePassword123!";
      const hash = hashPassword(password);

      expect(hash).not.toBe(password);
      expect(verifyPassword(password, hash)).toBe(true);
      expect(verifyPassword("WrongPassword", hash)).toBe(false);
    });

    it("should generate secure password", () => {
      const password = generateSecurePassword();

      expect(password).toBeDefined();
      expect(password.length).toBeGreaterThan(8);
      expect(password.split("-").length).toBe(5); // 4 words + 2 digits = 5 parts
      
      // Verify format: word-word-word-word-##
      const parts = password.split("-");
      expect(parts.length).toBe(5);
      
      // Last part should be 2 digits
      const lastPart = parts[parts.length - 1];
      expect(lastPart).toMatch(/^\d{2}$/);
    });

    it("should update user password", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const newPassword = "NewPassword123!";
      const newPasswordHash = hashPassword(newPassword);

      await db
        .update(users)
        .set({ passwordHash: newPasswordHash })
        .where(eq(users.id, testUserId));

      const [updatedUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, testUserId))
        .limit(1);

      expect(verifyPassword(newPassword, updatedUser.passwordHash)).toBe(true);
    });
  });

  describe("User Roles and Permissions", () => {
    it("should support different user roles", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const passwordHash = hashPassword("test123");

      const roles = ["super_admin", "admin", "team", "customer"] as const;

      for (const role of roles) {
        const [user] = await db
          .insert(users)
          .values({
            accountId: testAccountId,
            email: `${role}-test-${timestamp}@example.com`,
            passwordHash,
            name: `${role} Test`,
            role,
            isActive: 1,
          })
          .$returningId();

        const [savedUser] = await db
          .select()
          .from(users)
          .where(eq(users.id, user.id))
          .limit(1);

        expect(savedUser.role).toBe(role);
      }
    });

    it("should default to customer role", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const passwordHash = hashPassword("test123");

      const [user] = await db
        .insert(users)
        .values({
          accountId: testAccountId,
          email: `default-role-${timestamp}@example.com`,
          passwordHash,
          name: "Default Role Test",
          // role not specified, should default to customer
          isActive: 1,
        })
        .$returningId();

      const [savedUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1);

      expect(savedUser.role).toBe("customer");
    });
  });

  describe("User Active Status", () => {
    it("should deactivate user", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(users)
        .set({ isActive: 0 })
        .where(eq(users.id, testUserId));

      const [deactivatedUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, testUserId))
        .limit(1);

      expect(deactivatedUser.isActive).toBe(0);

      // Reactivate
      await db
        .update(users)
        .set({ isActive: 1 })
        .where(eq(users.id, testUserId));
    });
  });
});
