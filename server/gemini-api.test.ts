/**
 * Test Gemini API Key
 * Validates that the GEMINI_API_KEY is working
 */

import { describe, it, expect } from 'vitest';
import { GoogleGenerativeAI } from '@google/generative-ai';

describe('Gemini API Integration', () => {
  it('should validate GEMINI_API_KEY with a simple request', async () => {
    const apiKey = process.env.GEMINI_API_KEY;
    
    expect(apiKey).toBeDefined();
    expect(apiKey).not.toBe('');
    
    const genAI = new GoogleGenerativeAI(apiKey!);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    
    const result = await model.generateContent('Say "API key is valid" in exactly 5 words.');
    const text = result.response.text();
    
    expect(text).toBeDefined();
    expect(text.length).toBeGreaterThan(0);
    
    console.log('✅ Gemini API key is valid');
    console.log('📝 Response:', text);
  }, 30000); // 30 second timeout for API call
});
