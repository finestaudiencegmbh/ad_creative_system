import { describe, it, expect, vi, beforeEach } from "vitest";
import { sendEmail, sendWelcomeEmail, sendPasswordResetEmail } from "./email-service";

// Mock fetch globally
global.fetch = vi.fn();

describe("Email Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("sendEmail", () => {
    it("should send email successfully", async () => {
      // Mock successful response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ messageId: "test-message-id" }),
      });

      const result = await sendEmail({
        to: "test@example.com",
        subject: "Test Subject",
        html: "<p>Test HTML</p>",
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe("test-message-id");
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/email/send"),
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            Authorization: expect.stringContaining("Bearer"),
          }),
        })
      );
    });

    it("should handle email service errors", async () => {
      // Mock error response
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => "Internal Server Error",
      });

      const result = await sendEmail({
        to: "test@example.com",
        subject: "Test Subject",
        html: "<p>Test HTML</p>",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("500");
    });

    it("should handle network errors", async () => {
      // Mock network error
      (global.fetch as any).mockRejectedValueOnce(new Error("Network error"));

      const result = await sendEmail({
        to: "test@example.com",
        subject: "Test Subject",
        html: "<p>Test HTML</p>",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Network error");
    });
  });

  describe("sendWelcomeEmail", () => {
    it("should send welcome email with correct content", async () => {
      // Mock successful response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ messageId: "welcome-message-id" }),
      });

      const result = await sendWelcomeEmail({
        to: "newuser@example.com",
        firstName: "John",
        lastName: "Doe",
        password: "secure-password-123",
        loginUrl: "https://example.com/login",
      });

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/email/send"),
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("John Doe"),
        })
      );

      // Check that email body contains important elements
      const callArgs = (global.fetch as any).mock.calls[0][1];
      const body = JSON.parse(callArgs.body);
      expect(body.subject).toContain("Willkommen");
      expect(body.html).toContain("John Doe");
      expect(body.html).toContain("secure-password-123");
      expect(body.html).toContain("https://example.com/login");
    });
  });

  describe("sendPasswordResetEmail", () => {
    it("should send password reset email with correct content", async () => {
      // Mock successful response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ messageId: "reset-message-id" }),
      });

      const result = await sendPasswordResetEmail({
        to: "user@example.com",
        resetUrl: "https://example.com/reset-password?token=abc123",
      });

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/email/send"),
        expect.objectContaining({
          method: "POST",
        })
      );

      // Check that email body contains reset URL
      const callArgs = (global.fetch as any).mock.calls[0][1];
      const body = JSON.parse(callArgs.body);
      expect(body.subject).toContain("Passwort");
      expect(body.html).toContain("https://example.com/reset-password?token=abc123");
    });
  });
});
