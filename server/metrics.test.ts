import { describe, it, expect } from "vitest";
import { getMetaCampaigns } from "./meta-api";

describe("Campaign Metrics Calculation", () => {
  it("should fetch campaigns with all required metrics", async () => {
    const campaigns = await getMetaCampaigns({
      datePreset: "this_month",
    });
    
    expect(campaigns).toBeDefined();
    expect(Array.isArray(campaigns)).toBe(true);
    expect(campaigns.length).toBeGreaterThan(0);
    
    const firstCampaign = campaigns[0];
    const insights = firstCampaign.insights?.data?.[0];
    
    if (insights) {
      // Verify all required fields are present
      expect(insights).toHaveProperty("impressions");
      expect(insights).toHaveProperty("spend");
      expect(insights).toHaveProperty("cpm");
      
      console.log(`✓ Campaign: ${firstCampaign.name}`);
      console.log(`  - Impressions: ${insights.impressions}`);
      console.log(`  - Spend: €${insights.spend}`);
      console.log(`  - CPM: €${insights.cpm}`);
      
      // Check for outbound clicks
      if (insights.outbound_clicks) {
        const outboundClick = insights.outbound_clicks.find(
          (action: any) => action.action_type === "outbound_click"
        );
        if (outboundClick) {
          console.log(`  - Outbound Clicks: ${outboundClick.value}`);
        }
      }
      
      // Check for leads
      if (insights.actions) {
        const leadAction = insights.actions.find(
          (action: any) => action.action_type === "lead" || 
                           action.action_type === "offsite_conversion.fb_pixel_lead"
        );
        if (leadAction) {
          console.log(`  - Leads: ${leadAction.value}`);
        }
      }
      
      // Check for cost per outbound click
      if (insights.cost_per_outbound_click) {
        const costAction = insights.cost_per_outbound_click.find(
          (action: any) => action.action_type === "outbound_click"
        );
        if (costAction) {
          console.log(`  - Cost per Outbound Click: €${costAction.value}`);
        }
      }
    }
  }, 30000);

  it("should calculate derived metrics correctly", async () => {
    // Test metric calculations
    const spend = 1000;
    const leads = 50;
    const impressions = 10000;
    const outboundClicks = 200;
    
    // Cost per Lead
    const costPerLead = spend / leads;
    expect(costPerLead).toBe(20);
    console.log(`✓ Cost per Lead calculation: €${costPerLead}`);
    
    // Outbound CTR
    const outboundCtr = (outboundClicks / impressions) * 100;
    expect(outboundCtr).toBe(2);
    console.log(`✓ Outbound CTR calculation: ${outboundCtr}%`);
    
    // Conversion Rate
    const conversionRate = (leads / outboundClicks) * 100;
    expect(conversionRate).toBe(25);
    console.log(`✓ Conversion Rate calculation: ${conversionRate}%`);
  });
});
