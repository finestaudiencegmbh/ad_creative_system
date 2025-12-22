/**
 * Bannerbear Integration Tests
 * Validates API key and template configuration
 */

import { describe, it, expect } from 'vitest';
import { testBannerbearConnection } from './bannerbear';

describe('Bannerbear Integration', () => {
  it('should connect to Bannerbear API with valid credentials', async () => {
    const isConnected = await testBannerbearConnection();
    expect(isConnected).toBe(true);
  }, 30000); // 30 second timeout for API call
});
