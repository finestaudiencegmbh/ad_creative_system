import { describe, it, expect, beforeAll } from 'vitest';

describe('Make.com Webhook Integration', () => {
  beforeAll(() => {
    // Ensure MAKE_WEBHOOK_URL is configured
    if (!process.env.MAKE_WEBHOOK_URL) {
      throw new Error('MAKE_WEBHOOK_URL is not configured');
    }
  });

  it('should have MAKE_WEBHOOK_URL configured', () => {
    expect(process.env.MAKE_WEBHOOK_URL).toBeDefined();
    expect(process.env.MAKE_WEBHOOK_URL).toContain('hooks.zapier.com');
  });

  it('should be able to reach Make.com webhook endpoint', async () => {
    const webhookUrl = process.env.MAKE_WEBHOOK_URL!;
    
    // Send a test ping to verify webhook is reachable
    const testPayload = {
      test: true,
      timestamp: new Date().toISOString(),
      message: 'Test ping from Creative Generator',
    };

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPayload),
      });

      // Zapier webhooks typically return 200 even for test payloads
      expect(response.status).toBe(200);
      expect(response.ok).toBe(true);
    } catch (error) {
      throw new Error(`Failed to reach Make.com webhook: ${(error as Error).message}`);
    }
  }, 10000); // 10 second timeout for network request
});
