import { describe, it, expect } from "vitest";
import { sendEmail, sendWelcomeEmail, sendPasswordResetEmail } from "./email-service";

describe("Resend Email Service", () => {
  it("should validate Resend API key is configured", () => {
    expect(process.env.RESEND_API_KEY).toBeDefined();
    expect(process.env.RESEND_API_KEY).toMatch(/^re_/);
  });

  it("should send test email successfully", async () => {
    const result = await sendEmail({
      to: "jan-ortmueller@web.de",
      subject: "Test Email from Resend",
      html: "<h1>Test</h1><p>This is a test email to verify Resend integration works.</p>",
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBeDefined();
    expect(result.error).toBeUndefined();
  }, 15000); // 15 second timeout for API call

  it("should send welcome email successfully", async () => {
    const result = await sendWelcomeEmail({
      to: "jan-ortmueller@web.de",
      firstName: "Jan",
      lastName: "Ortmüller",
      password: "a7K9mP2x",
      loginUrl: "https://3000-iifcp8pl6g0xvqpxalng1-27415a74.manusvm.computer/login",
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBeDefined();
  }, 15000);

  it("should send password reset email successfully", async () => {
    const result = await sendPasswordResetEmail({
      to: "jan-ortmueller@web.de",
      resetUrl: "https://3000-iifcp8pl6g0xvqpxalng1-27415a74.manusvm.computer/reset-password?token=test123",
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBeDefined();
  }, 15000);
});
