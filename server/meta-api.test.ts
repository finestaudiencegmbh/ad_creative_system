import { describe, it, expect } from "vitest";
import { testMetaConnection } from "./meta-api";

describe("Meta API Integration", () => {
  it("should successfully connect to Meta API with valid credentials", async () => {
    const result = await testMetaConnection();
    
    if (!result.success) {
      console.error("Meta API Connection Failed:");
      console.error(result.error);
    }
    
    expect(result.success).toBe(true);
    expect(result.accountId).toBeDefined();
    expect(result.accountName).toBeDefined();
    expect(result.error).toBeUndefined();
    
    console.log("Meta API Connection Test:");
    console.log(`✓ Account ID: ${result.accountId}`);
    console.log(`✓ Account Name: ${result.accountName}`);
  }, 30000); // 30 second timeout for API call
});
