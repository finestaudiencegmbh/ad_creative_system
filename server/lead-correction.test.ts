import { describe, it, expect, beforeAll } from 'vitest';
import * as db from './db';

describe('Lead Correction System', () => {
  let testCorrectionId: number;

  beforeAll(async () => {
    // Clean up any existing test data
    const existing = await db.getLeadCorrectionByEntity({ metaCampaignId: 'test_campaign_123' });
    if (existing) {
      await db.deleteLeadCorrection(existing.id);
    }
  });

  it('should create a new lead correction', async () => {
    const correction = await db.upsertLeadCorrection({
      metaCampaignId: 'test_campaign_123',
      correctedLeadCount: 150,
      notes: 'Manual correction based on CRM data',
    });

    expect(correction).toBeDefined();
    expect(correction.correctedLeadCount).toBe(150);
    expect(correction.notes).toBe('Manual correction based on CRM data');
    expect(correction.metaCampaignId).toBe('test_campaign_123');
    
    testCorrectionId = correction.id;
  });

  it('should retrieve lead correction by campaign ID', async () => {
    const correction = await db.getLeadCorrectionByEntity({ metaCampaignId: 'test_campaign_123' });

    expect(correction).toBeDefined();
    expect(correction?.correctedLeadCount).toBe(150);
    expect(correction?.metaCampaignId).toBe('test_campaign_123');
  });

  it('should update existing lead correction', async () => {
    const updated = await db.upsertLeadCorrection({
      metaCampaignId: 'test_campaign_123',
      correctedLeadCount: 175,
      notes: 'Updated correction',
    });

    expect(updated.correctedLeadCount).toBe(175);
    expect(updated.notes).toBe('Updated correction');
  });

  it('should delete lead correction', async () => {
    await db.deleteLeadCorrection(testCorrectionId);

    const deleted = await db.getLeadCorrectionByEntity({ metaCampaignId: 'test_campaign_123' });
    expect(deleted).toBeUndefined();
  });

  it('should create lead correction for ad set', async () => {
    const correction = await db.upsertLeadCorrection({
      metaAdSetId: 'test_adset_456',
      correctedLeadCount: 50,
      notes: 'Ad set correction',
    });

    expect(correction).toBeDefined();
    expect(correction.metaAdSetId).toBe('test_adset_456');
    expect(correction.correctedLeadCount).toBe(50);

    // Clean up
    await db.deleteLeadCorrection(correction.id);
  });

  it('should create lead correction for ad', async () => {
    const correction = await db.upsertLeadCorrection({
      metaAdId: 'test_ad_789',
      correctedLeadCount: 25,
      notes: 'Ad correction',
    });

    expect(correction).toBeDefined();
    expect(correction.metaAdId).toBe('test_ad_789');
    expect(correction.correctedLeadCount).toBe(25);

    // Clean up
    await db.deleteLeadCorrection(correction.id);
  });
});
