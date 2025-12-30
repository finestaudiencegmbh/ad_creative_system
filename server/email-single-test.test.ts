import { describe, it, expect } from "vitest";
import { sendWelcomeEmail } from "./email-service";

describe("Resend Email Service - Single Test", () => {
  it("should send welcome email to jan-ortmueller@web.de", async () => {
    const result = await sendWelcomeEmail({
      to: "jan-ortmueller@web.de",
      firstName: "Jan",
      lastName: "Ortmüller",
      password: "a7K9mP2x",
      loginUrl: "https://3000-iifcp8pl6g0xvqpxalng1-27415a74.manusvm.computer/login",
    });

    console.log("Email send result:", result);

    expect(result.success).toBe(true);
    expect(result.messageId).toBeDefined();
    expect(result.error).toBeUndefined();
  }, 15000);
});
