import 'dotenv/config';

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

console.log('🧪 Testing SDXL via HTTP API directly...');

try {
  // Step 1: Create prediction
  const createResponse = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Token ${REPLICATE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      version: '7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc',
      input: {
        prompt: 'A beautiful sunset over mountains',
        width: 1024,
        height: 1024,
      }
    })
  });

  const prediction = await createResponse.json();
  console.log('✅ Prediction created:', prediction.id);
  console.log('Status:', prediction.status);

  // Step 2: Poll for completion
  let finalPrediction = prediction;
  while (finalPrediction.status === 'starting' || finalPrediction.status === 'processing') {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const pollResponse = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
      headers: {
        'Authorization': `Token ${REPLICATE_API_TOKEN}`,
      }
    });
    
    finalPrediction = await pollResponse.json();
    console.log('Status:', finalPrediction.status);
  }

  // Step 3: Check output
  console.log('\n✅ Final Status:', finalPrediction.status);
  console.log('Output Type:', typeof finalPrediction.output);
  console.log('Is Array:', Array.isArray(finalPrediction.output));
  console.log('Output:', JSON.stringify(finalPrediction.output, null, 2));

  if (finalPrediction.status === 'succeeded' && finalPrediction.output && finalPrediction.output.length > 0) {
    console.log('\n✅ SUCCESS! Image URL:', finalPrediction.output[0]);
  } else {
    console.log('\n❌ FAILED: No valid output');
    console.log('Full response:', JSON.stringify(finalPrediction, null, 2));
  }

} catch (error) {
  console.error('❌ Error:', error.message);
  console.error(error);
}
