import { describe, it, expect } from "vitest";
import * as db from "./db";

describe("Sales Management (Update & Delete)", () => {
  let testSaleId: number;

  it("should create a test sale for management operations", async () => {
    const sale = await db.createSale({
      metaCampaignId: "120236291446940214",
      orderValue: "1000.00",
      cashCollect: "500.00",
      completionDate: new Date("2025-12-10"),
      notes: "Test sale for management",
    });

    expect(sale).toBeDefined();
    expect(sale.id).toBeDefined();
    testSaleId = sale.id;
  });

  it("should update a sale's order value and cash collect", async () => {
    await db.updateSale(testSaleId, {
      orderValue: "1500.00",
      cashCollect: "750.00",
    });

    const updatedSale = await db.getSaleById(testSaleId);
    expect(updatedSale).toBeDefined();
    expect(parseFloat(updatedSale!.orderValue)).toBe(1500);
    expect(parseFloat(updatedSale!.cashCollect)).toBe(750);
  });

  it("should update a sale's completion date", async () => {
    const newDate = new Date("2025-12-20");
    await db.updateSale(testSaleId, {
      completionDate: newDate,
    });

    const updatedSale = await db.getSaleById(testSaleId);
    expect(updatedSale).toBeDefined();
    expect(new Date(updatedSale!.completionDate).toISOString()).toBe(newDate.toISOString());
  });

  it("should update a sale's notes", async () => {
    await db.updateSale(testSaleId, {
      notes: "Updated notes for testing",
    });

    const updatedSale = await db.getSaleById(testSaleId);
    expect(updatedSale).toBeDefined();
    expect(updatedSale!.notes).toBe("Updated notes for testing");
  });

  it("should delete a sale", async () => {
    await db.deleteSale(testSaleId);

    const deletedSale = await db.getSaleById(testSaleId);
    expect(deletedSale).toBeUndefined();
  });

  it("should verify ROAS calculation after sales changes", async () => {
    // Create multiple sales
    const sale1 = await db.createSale({
      metaCampaignId: "TEST_CAMPAIGN_001",
      orderValue: "5000.00",
      cashCollect: "2500.00",
      completionDate: new Date("2025-12-15"),
    });

    const sale2 = await db.createSale({
      metaCampaignId: "TEST_CAMPAIGN_001",
      orderValue: "3000.00",
      cashCollect: "1500.00",
      completionDate: new Date("2025-12-16"),
    });

    // Get all sales for the campaign
    const sales = await db.getSalesByEntity({
      metaCampaignId: "TEST_CAMPAIGN_001",
    });

    expect(sales.length).toBeGreaterThanOrEqual(2);

    // Calculate total order value and cash collect
    const totalOrderValue = sales.reduce((sum, sale) => sum + parseFloat(sale.orderValue), 0);
    const totalCashCollect = sales.reduce((sum, sale) => sum + parseFloat(sale.cashCollect), 0);

    expect(totalOrderValue).toBeGreaterThanOrEqual(8000);
    expect(totalCashCollect).toBeGreaterThanOrEqual(4000);

    // Simulate ROAS calculation (assuming €1000 spend)
    const spend = 1000;
    const roasOrderVolume = totalOrderValue / spend;
    const roasCashCollect = totalCashCollect / spend;

    expect(roasOrderVolume).toBeGreaterThanOrEqual(8);
    expect(roasCashCollect).toBeGreaterThanOrEqual(4);

    // Cleanup
    await db.deleteSale(sale1.id);
    await db.deleteSale(sale2.id);
  });
});
