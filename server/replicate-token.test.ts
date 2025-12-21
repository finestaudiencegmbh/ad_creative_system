/**
 * Replicate API Token Validation Test
 * Validates that the REPLICATE_API_TOKEN is correctly configured
 */

import { describe, it, expect } from 'vitest';
import Replicate from 'replicate';
import { ENV } from './_core/env';

describe('Replicate API Token Validation', () => {
  it('should have REPLICATE_API_TOKEN configured', () => {
    expect(ENV.replicateApiToken).toBeTruthy();
    expect(ENV.replicateApiToken).not.toBe('');
    expect(ENV.replicateApiToken.startsWith('r8_')).toBe(true);
  });

  it('should successfully authenticate with Replicate API', async () => {
    const replicate = new Replicate({
      auth: ENV.replicateApiToken,
    });

    // Test authentication by listing models (lightweight API call)
    try {
      // This is a minimal API call to verify authentication
      const models = await replicate.models.list();
      expect(models).toBeDefined();
      expect(Array.isArray(models.results)).toBe(true);
    } catch (error: any) {
      // If authentication fails, error message will indicate invalid token
      if (error.message?.includes('Unauthorized') || error.message?.includes('Invalid')) {
        throw new Error('Replicate API token is invalid or unauthorized');
      }
      throw error;
    }
  }, 15000); // 15 second timeout for API call
});
