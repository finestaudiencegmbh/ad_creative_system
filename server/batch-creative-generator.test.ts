/**
 * Integration test for batch creative generation
 */

import { describe, it, expect, vi } from 'vitest';

describe('Batch Creative Generator Integration', () => {
  it('should have all required modules available', async () => {
    // Test that all modules can be imported
    const { generateBatchCreatives } = await import('./batch-creative-generator');
    const { extractDesignSystem, generateStyleAwarePrompt } = await import('./creative-analyzer');
    const { addTextOverlay, FORMAT_SPECS } = await import('./text-overlay');
    
    expect(generateBatchCreatives).toBeDefined();
    expect(extractDesignSystem).toBeDefined();
    expect(generateStyleAwarePrompt).toBeDefined();
    expect(addTextOverlay).toBeDefined();
    expect(FORMAT_SPECS).toBeDefined();
    
    // Verify format specs
    expect(FORMAT_SPECS.feed).toBeDefined();
    expect(FORMAT_SPECS.story).toBeDefined();
    expect(FORMAT_SPECS.reel).toBeDefined();
    
    expect(FORMAT_SPECS.feed.aspectRatio).toBe('1:1');
    expect(FORMAT_SPECS.story.aspectRatio).toBe('9:16');
    expect(FORMAT_SPECS.reel.aspectRatio).toBe('9:16');
  });

  it('should validate format specs have correct dimensions', async () => {
    const { FORMAT_SPECS } = await import('./text-overlay');
    
    expect(FORMAT_SPECS.feed.width).toBe(1080);
    expect(FORMAT_SPECS.feed.height).toBe(1080);
    
    expect(FORMAT_SPECS.story.width).toBe(1080);
    expect(FORMAT_SPECS.story.height).toBe(1920);
    expect(FORMAT_SPECS.story.safeZones.top).toBe(0.14);
    expect(FORMAT_SPECS.story.safeZones.bottom).toBe(0.20);
    
    expect(FORMAT_SPECS.reel.width).toBe(1080);
    expect(FORMAT_SPECS.reel.height).toBe(1920);
    expect(FORMAT_SPECS.reel.safeZones.top).toBe(0.25);
    expect(FORMAT_SPECS.reel.safeZones.bottom).toBe(0.30);
  });

  it('should have tRPC procedure defined', async () => {
    const { appRouter } = await import('./routers');
    
    // Check that the procedure exists
    expect(appRouter.ai.generateBatchCreatives).toBeDefined();
  });
});
