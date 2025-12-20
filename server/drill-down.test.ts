import { describe, it, expect } from "vitest";
import { getCampaignAdSets, getAdSetAds } from "./meta-api";

describe("Drill-Down Hierarchy Tests", () => {
  it("should fetch ad sets for a campaign", async () => {
    const campaignId = "120236291446940214"; // DCA Methode campaign
    
    const adsets = await getCampaignAdSets(campaignId, {
      datePreset: "this_month",
    });

    expect(adsets).toBeDefined();
    expect(Array.isArray(adsets)).toBe(true);
    
    if (adsets.length > 0) {
      const adset = adsets[0];
      expect(adset).toHaveProperty("id");
      expect(adset).toHaveProperty("name");
      expect(adset).toHaveProperty("status");
      expect(adset).toHaveProperty("insights");
      
      console.log(`✓ Found ${adsets.length} ad sets for campaign`);
      console.log(`  First ad set: ${adset.name} (${adset.status})`);
    }
  }, 30000);

  it("should fetch ads for an ad set", async () => {
    const adSetId = "120236291446950214"; // IB Leads AG1
    
    const ads = await getAdSetAds(adSetId, {
      datePreset: "this_month",
    });

    expect(ads).toBeDefined();
    expect(Array.isArray(ads)).toBe(true);
    
    if (ads.length > 0) {
      const ad = ads[0];
      expect(ad).toHaveProperty("id");
      expect(ad).toHaveProperty("name");
      expect(ad).toHaveProperty("status");
      expect(ad).toHaveProperty("insights");
      
      console.log(`✓ Found ${ads.length} ads for ad set`);
      console.log(`  First ad: ${ad.name} (${ad.status})`);
    }
  }, 30000);

  it("should have consistent metrics structure across all levels", async () => {
    const adSetId = "120236291446950214";
    const ads = await getAdSetAds(adSetId, {
      datePreset: "this_month",
    });

    if (ads.length > 0) {
      const ad = ads[0];
      const insights = ad.insights?.data?.[0];
      
      // Verify all required metrics are present
      expect(insights).toHaveProperty("impressions");
      expect(insights).toHaveProperty("spend");
      expect(insights).toHaveProperty("cpm");
      expect(insights).toHaveProperty("actions"); // for leads
      expect(insights).toHaveProperty("outbound_clicks");
      expect(insights).toHaveProperty("cost_per_outbound_click");
      
      console.log("✓ All required metrics are present in ad insights");
    }
  }, 30000);
});
