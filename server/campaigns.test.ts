import { describe, it, expect } from "vitest";
import { getMetaCampaigns } from "./meta-api";

describe("Campaigns API Integration", () => {
  it("should fetch campaigns with this_month date preset", async () => {
    const campaigns = await getMetaCampaigns({
      datePreset: "this_month",
    });
    
    expect(campaigns).toBeDefined();
    expect(Array.isArray(campaigns)).toBe(true);
    expect(campaigns.length).toBeGreaterThan(0);
    
    // Verify campaign structure
    const firstCampaign = campaigns[0];
    expect(firstCampaign).toHaveProperty("id");
    expect(firstCampaign).toHaveProperty("name");
    expect(firstCampaign).toHaveProperty("status");
    
    console.log(`✓ Fetched ${campaigns.length} campaigns`);
    console.log(`✓ First campaign: ${firstCampaign.name} (${firstCampaign.status})`);
    
    // Verify insights data if available
    if (firstCampaign.insights?.data?.[0]) {
      const insights = firstCampaign.insights.data[0];
      expect(insights).toHaveProperty("impressions");
      expect(insights).toHaveProperty("spend");
      expect(insights).toHaveProperty("ctr");
      console.log(`✓ Insights available: ${insights.impressions} impressions, €${insights.spend} spend`);
    }
  }, 30000); // 30 second timeout for API call

  it("should fetch campaigns with last_7d date preset", async () => {
    const campaigns = await getMetaCampaigns({
      datePreset: "last_7d",
    });
    
    expect(campaigns).toBeDefined();
    expect(Array.isArray(campaigns)).toBe(true);
    
    console.log(`✓ Fetched ${campaigns.length} campaigns for last 7 days`);
  }, 30000);
});
