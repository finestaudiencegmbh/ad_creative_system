/**
 * Bannerbear API Integration
 * Professional text overlay rendering service
 * 
 * Replaces Sharp-based text rendering with reliable cloud service
 */

import { Bannerbear } from 'bannerbear';

type CreativeFormat = 'feed' | 'story' | 'reel';

interface BannerbearRenderConfig {
  backgroundImageUrl: string;
  eyebrowText?: string;
  headlineText: string;
  ctaText?: string;
  format: CreativeFormat;
  designSystem?: {
    colorPalette: string[];
  };
}

interface BannerbearRenderResult {
  imageUrl: string;
  uid: string;
}

/**
 * Get Bannerbear template UID for format
 * Templates must be created in Bannerbear dashboard first
 */
function getTemplateUid(format: CreativeFormat): string {
  const templates = {
    feed: process.env.BANNERBEAR_TEMPLATE_FEED || '',
    story: process.env.BANNERBEAR_TEMPLATE_STORY || '',
    reel: process.env.BANNERBEAR_TEMPLATE_REEL || '',
  };
  
  const templateUid = templates[format];
  if (!templateUid) {
    throw new Error(`Bannerbear template not configured for format: ${format}. Please set BANNERBEAR_TEMPLATE_${format.toUpperCase()} in environment.`);
  }
  
  return templateUid;
}

/**
 * Render creative with text overlays using Bannerbear
 * 
 * @param config - Rendering configuration
 * @returns Image URL and UID
 */
export async function renderCreativeWithBannerbear(
  config: BannerbearRenderConfig
): Promise<BannerbearRenderResult> {
  const apiKey = process.env.BANNERBEAR_API_KEY;
  
  if (!apiKey) {
    throw new Error('BANNERBEAR_API_KEY not configured. Please add it to your environment variables.');
  }
  
  const bb = new Bannerbear(apiKey);
  const templateUid = getTemplateUid(config.format);
  
  // Build modifications object based on template layer names
  // These layer names must match your Bannerbear template
  const modifications: any[] = [
    {
      name: 'background',
      image_url: config.backgroundImageUrl,
    },
  ];
  
  if (config.eyebrowText) {
    modifications.push({
      name: 'eyebrow',
      text: config.eyebrowText,
    });
  }
  
  modifications.push({
    name: 'headline',
    text: config.headlineText,
  });
  
  if (config.ctaText) {
    modifications.push({
      name: 'cta',
      text: config.ctaText,
    });
  }
  
  // Add color overrides if provided
  if (config.designSystem?.colorPalette?.[0]) {
    modifications.push({
      name: 'accent_color',
      color: config.designSystem.colorPalette[0],
    });
  }
  
  try {
    console.log(`🎨 Rendering creative with Bannerbear (${config.format})...`);
    console.log(`📝 Headline: ${config.headlineText}`);
    
    // Create image synchronously (wait for completion)
    const image: any = await bb.create_image(
      templateUid,
      {
        modifications,
        webhook_url: undefined, // Synchronous mode
      },
      true // Wait for completion
    );
    
    if (!image.image_url) {
      throw new Error('Bannerbear did not return an image URL');
    }
    
    console.log(`✅ Bannerbear render complete: ${image.uid}`);
    
    return {
      imageUrl: image.image_url,
      uid: image.uid,
    };
  } catch (error) {
    console.error('❌ Bannerbear rendering failed:', error);
    throw new Error(
      `Bannerbear rendering failed: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Test Bannerbear connection and template configuration
 */
export async function testBannerbearConnection(): Promise<boolean> {
  const apiKey = process.env.BANNERBEAR_API_KEY;
  
  if (!apiKey) {
    console.error('❌ BANNERBEAR_API_KEY not configured');
    return false;
  }
  
  try {
    const bb = new Bannerbear(apiKey);
    
    // Test API connection by fetching account info
    const account: any = await bb.account();
    console.log(`✅ Bannerbear connected: ${account.email || 'Unknown'}`);
    console.log(`📊 API requests remaining: ${account.api_requests_remaining || 'Unknown'}`);
    
    // Check template configuration
    const formats: CreativeFormat[] = ['feed', 'story', 'reel'];
    for (const format of formats) {
      try {
        const templateUid = getTemplateUid(format);
        console.log(`✅ Template configured for ${format}: ${templateUid}`);
      } catch (error) {
        console.warn(`⚠️  No template configured for ${format}`);
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ Bannerbear connection test failed:', error);
    return false;
  }
}
