import { describe, it, expect, beforeAll } from "vitest";
import { hashPassword, verifyPassword, generateToken, verifyToken, hasPermission } from "./auth";

describe("Authentication System", () => {
  describe("Password Hashing", () => {
    it("should hash password correctly", () => {
      const password = "TestPassword123!";
      const hashed = hashPassword(password);
      
      expect(hashed).toBeTruthy();
      expect(hashed).toContain(":");
      expect(hashed.split(":")).toHaveLength(2);
    });

    it("should verify correct password", () => {
      const password = "TestPassword123!";
      const hashed = hashPassword(password);
      
      const isValid = verifyPassword(password, hashed);
      expect(isValid).toBe(true);
    });

    it("should reject incorrect password", () => {
      const password = "TestPassword123!";
      const wrongPassword = "WrongPassword456!";
      const hashed = hashPassword(password);
      
      const isValid = verifyPassword(wrongPassword, hashed);
      expect(isValid).toBe(false);
    });

    it("should generate different hashes for same password", () => {
      const password = "TestPassword123!";
      const hash1 = hashPassword(password);
      const hash2 = hashPassword(password);
      
      expect(hash1).not.toBe(hash2);
      expect(verifyPassword(password, hash1)).toBe(true);
      expect(verifyPassword(password, hash2)).toBe(true);
    });
  });

  describe("JWT Token", () => {
    it("should generate valid JWT token", () => {
      const token = generateToken(1, 10, "customer");
      
      expect(token).toBeTruthy();
      expect(typeof token).toBe("string");
    });

    it("should verify valid token", () => {
      const userId = 1;
      const accountId = 10;
      const role = "customer";
      
      const token = generateToken(userId, accountId, role);
      const payload = verifyToken(token);
      
      expect(payload).toBeTruthy();
      expect(payload?.userId).toBe(userId);
      expect(payload?.accountId).toBe(accountId);
      expect(payload?.role).toBe(role);
    });

    it("should reject invalid token", () => {
      const invalidToken = "invalid.token.here";
      const payload = verifyToken(invalidToken);
      
      expect(payload).toBeNull();
    });

    it("should handle null accountId for super admin", () => {
      const token = generateToken(1, null, "super_admin");
      const payload = verifyToken(token);
      
      expect(payload).toBeTruthy();
      expect(payload?.accountId).toBeNull();
      expect(payload?.role).toBe("super_admin");
    });
  });

  describe("Role-based Permissions", () => {
    it("super_admin should have all permissions", () => {
      expect(hasPermission("super_admin", "super_admin")).toBe(true);
      expect(hasPermission("super_admin", "admin")).toBe(true);
      expect(hasPermission("super_admin", "team")).toBe(true);
      expect(hasPermission("super_admin", "customer")).toBe(true);
    });

    it("admin should have admin, team, and customer permissions", () => {
      expect(hasPermission("admin", "super_admin")).toBe(false);
      expect(hasPermission("admin", "admin")).toBe(true);
      expect(hasPermission("admin", "team")).toBe(true);
      expect(hasPermission("admin", "customer")).toBe(true);
    });

    it("team should have team and customer permissions", () => {
      expect(hasPermission("team", "super_admin")).toBe(false);
      expect(hasPermission("team", "admin")).toBe(false);
      expect(hasPermission("team", "team")).toBe(true);
      expect(hasPermission("team", "customer")).toBe(true);
    });

    it("customer should only have customer permissions", () => {
      expect(hasPermission("customer", "super_admin")).toBe(false);
      expect(hasPermission("customer", "admin")).toBe(false);
      expect(hasPermission("customer", "team")).toBe(false);
      expect(hasPermission("customer", "customer")).toBe(true);
    });

    it("should handle invalid roles", () => {
      expect(hasPermission("invalid_role", "admin")).toBe(false);
    });
  });
});
