import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

console.log('🧪 Testing SDXL API with minimal parameters...');

try {
  const output = await replicate.run(
    "stability-ai/sdxl:c221b2b8ef527988fb59bf24a8b97c4561f1c671f73bd389f866bfb27c061316",
    {
      input: {
        prompt: "A beautiful sunset over mountains",
        width: 1024,
        height: 1024,
        num_outputs: 1,
      },
    }
  );

  console.log('✅ SDXL API Response:');
  console.log('Type:', typeof output);
  console.log('Is Array:', Array.isArray(output));
  console.log('Content:', JSON.stringify(output, null, 2));
  
  if (Array.isArray(output) && output.length > 0 && typeof output[0] === 'string') {
    console.log('✅ SUCCESS: Got valid image URL:', output[0]);
  } else {
    console.log('❌ FAILED: Invalid output format');
  }
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('Full error:', error);
}
