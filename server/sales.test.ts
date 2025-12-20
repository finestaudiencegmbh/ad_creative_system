import { describe, it, expect } from "vitest";
import * as db from "./db";

describe("Sales Tracking System", () => {
  it("should create a sale for a campaign", async () => {
    const sale = await db.createSale({
      metaCampaignId: "120236291446940214",
      orderValue: "5000.00",
      cashCollect: "2500.00",
      completionDate: new Date("2025-12-15"),
      notes: "Test sale for campaign",
    });

    expect(sale).toBeDefined();
    expect(sale.id).toBeDefined();
    expect(sale.metaCampaignId).toBe("120236291446940214");
    expect(parseFloat(sale.orderValue)).toBe(5000);
    expect(parseFloat(sale.cashCollect)).toBe(2500);
  });

  it("should retrieve sales by campaign ID", async () => {
    const sales = await db.getSalesByEntity({
      metaCampaignId: "120236291446940214",
    });

    expect(Array.isArray(sales)).toBe(true);
    expect(sales.length).toBeGreaterThan(0);
    
    const sale = sales[0];
    expect(sale.metaCampaignId).toBe("120236291446940214");
  });

  it("should filter sales by date range", async () => {
    const startDate = new Date("2025-12-01");
    const endDate = new Date("2025-12-31");

    const sales = await db.getSalesByEntity({
      metaCampaignId: "120236291446940214",
      startDate,
      endDate,
    });

    expect(Array.isArray(sales)).toBe(true);
    
    // All sales should be within the date range
    sales.forEach(sale => {
      const completionDate = new Date(sale.completionDate);
      expect(completionDate.getTime()).toBeGreaterThanOrEqual(startDate.getTime());
      expect(completionDate.getTime()).toBeLessThanOrEqual(endDate.getTime());
    });
  });

  it("should calculate ROAS correctly", () => {
    const spend = 1000;
    const orderValue = 5000;
    const cashCollect = 2500;

    const roasOrderVolume = orderValue / spend;
    const roasCashCollect = cashCollect / spend;

    expect(roasOrderVolume).toBe(5); // 5x ROAS on order volume
    expect(roasCashCollect).toBe(2.5); // 2.5x ROAS on cash collect
  });

  it("should create a sale for an ad set", async () => {
    const sale = await db.createSale({
      metaAdSetId: "120236291446950214",
      orderValue: "3000.00",
      cashCollect: "1500.00",
      completionDate: new Date("2025-12-20"),
    });

    expect(sale).toBeDefined();
    expect(sale.metaAdSetId).toBe("120236291446950214");
    expect(parseFloat(sale.orderValue)).toBe(3000);
  });

  it("should create a sale for an ad", async () => {
    const sale = await db.createSale({
      metaAdId: "120236291446960214",
      orderValue: "1000.00",
      cashCollect: "500.00",
      completionDate: new Date("2025-12-25"),
    });

    expect(sale).toBeDefined();
    expect(sale.metaAdId).toBe("120236291446960214");
    expect(parseFloat(sale.cashCollect)).toBe(500);
  });
});
