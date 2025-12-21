import type { DeepAnalysisResult } from './deep-analysis-claude';
import type { TextIteration } from './text-iterations-claude';

export async function generateVisualPrompt(
  headline: string,
  analysis: DeepAnalysisResult
): Promise<string> {
  // Build hyperrealistic 3D visual prompt based on headline + analysis
  
  const coreTheme = extractCoreTheme(headline, analysis);
  const visualStyle = analysis.aestheticStyle || 'modern, premium, futuristic';
  const colorHints = analysis.colorPalette.length > 0 
    ? `Color palette: ${analysis.colorPalette.join(', ')}` 
    : '';
  
  const prompt = `Hyperrealistic 3D render, ${coreTheme}, ${visualStyle} aesthetic. 
${colorHints}
Professional advertising photography, studio lighting, depth of field, 8K resolution, photorealistic materials.
Clean composition, modern design, premium quality.
NO TEXT, NO WORDS, NO LETTERS - pure visual only.

Composition: Dark gradient background fading from solid black at top and bottom edges to vibrant colored center.
Main 3D elements concentrated in the middle third of the frame.
Smooth, simple gradients in upper and lower areas.
Cinematic lighting with neon accents, dramatic shadows.
Minimalist top and bottom sections for clean overlay space.`;

  return prompt.trim();
}

function extractCoreTheme(headline: string, analysis: DeepAnalysisResult): string {
  // Extract the core visual theme from headline + analysis
  
  // Check if headline mentions specific objects/concepts
  const headlineLower = headline.toLowerCase();
  
  // Common themes for lead-gen/marketing products
  if (headlineLower.includes('leads') || headlineLower.includes('kunden')) {
    return 'glowing funnel visualization with flowing data streams, marketing dashboard hologram';
  }
  
  if (headlineLower.includes('system') || headlineLower.includes('methode')) {
    return 'futuristic control panel with glowing interfaces, automated system visualization';
  }
  
  if (headlineLower.includes('ads') || headlineLower.includes('werbung')) {
    return 'meta ads interface hologram, social media advertising dashboard in 3D space';
  }
  
  if (headlineLower.includes('geld') || headlineLower.includes('umsatz') || headlineLower.includes('revenue')) {
    return 'money flow visualization, revenue growth chart in 3D holographic display';
  }
  
  // Fallback: use visual themes from analysis
  if (analysis.visualThemes.length > 0) {
    return analysis.visualThemes[0];
  }
  
  // Ultimate fallback
  return 'modern business success visualization, professional marketing concept';
}

export async function generateVisual(
  textIteration: TextIteration,
  analysis: DeepAnalysisResult
): Promise<string> {
  const { generateImageWithImagen } = await import('./_core/geminiImagen');
  
  const visualPrompt = await generateVisualPrompt(textIteration.headline, analysis);
  
  console.log(`🎨 Visual Prompt: ${visualPrompt}`);
  
  const images = await generateImageWithImagen({
    prompt: visualPrompt,
    aspectRatio: '1:1', // Feed format first, will be adapted later
  });
  
  return images[0].imageUrl;
}
