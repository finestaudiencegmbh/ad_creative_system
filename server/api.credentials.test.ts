import { describe, expect, it } from "vitest";

describe("API Credentials Validation", () => {
  it("should have valid REPLICATE_API_TOKEN", async () => {
    const token = process.env.REPLICATE_API_TOKEN;
    expect(token).toBeDefined();
    expect(token).not.toBe("");
    
    // Test with a lightweight API call to verify the token
    const response = await fetch("https://api.replicate.com/v1/models", {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });
    
    expect(response.status).toBe(200);
  }, 10000);

  it("should have valid OPENAI_API_KEY", async () => {
    const key = process.env.OPENAI_API_KEY;
    expect(key).toBeDefined();
    expect(key).not.toBe("");
    
    // Test with a lightweight API call to verify the key
    const response = await fetch("https://api.openai.com/v1/models", {
      headers: {
        "Authorization": `Bearer ${key}`,
      },
    });
    
    expect(response.status).toBe(200);
  }, 10000);
});
