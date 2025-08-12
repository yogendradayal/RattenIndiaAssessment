import dotenv from 'dotenv';
import WebSocket from 'ws';

dotenv.config();

console.log('🧪 Testing Gemini Live API Connection\n');

if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_api_key_here') {
  console.log('❌ GEMINI_API_KEY not found in .env file');
  console.log('   Run: npm run setup');
  process.exit(1);
}

console.log('✅ API key found in environment');
console.log('🔗 Testing connection to Gemini Live API...\n');

const MODEL_NAME = 'gemini-2.0-flash-live-001';
const url = `wss://generativelanguage.googleapis.com/ws/v1beta/models/${MODEL_NAME}:streamGenerateContent?key=${process.env.GEMINI_API_KEY}`;

const testWs = new WebSocket(url);

const timeout = setTimeout(() => {
  console.log('⏰ Connection timeout - this might indicate API issues or network problems');
  testWs.close();
  process.exit(1);
}, 10000);

testWs.on('open', () => {
  console.log('🎉 Successfully connected to Gemini Live API!');
  
  // Send a simple setup message
  const setupMessage = {
    "setup": {
      "model": `models/${MODEL_NAME}`,
      "generation_config": {
        "response_modalities": ["TEXT"]
      }
    }
  };
  
  testWs.send(JSON.stringify(setupMessage));
});

testWs.on('message', (data) => {
  try {
    const response = JSON.parse(data);
    
    if (response.setupComplete) {
      console.log('✅ Gemini Live API setup completed successfully');
      console.log('🚀 Your application is ready to use!\n');
      console.log('Next steps:');
      console.log('1. Run: npm start');
      console.log('2. Open: http://localhost:3000');
      clearTimeout(timeout);
      testWs.close();
      process.exit(0);
    }
    
    if (response.error) {
      console.log('❌ API Error:', response.error);
      clearTimeout(timeout);
      testWs.close();
      process.exit(1);
    }
    
  } catch (error) {
    console.log('📨 Received data from API (parsing error):', error.message);
  }
});

testWs.on('error', (error) => {
  console.log('❌ Connection failed:', error.message);
  console.log('\n🔍 Troubleshooting tips:');
  console.log('1. Check your API key is correct');
  console.log('2. Ensure you have access to Gemini Live API');
  console.log('3. Check your internet connection');
  console.log('4. Verify your Google AI Studio project settings');
  clearTimeout(timeout);
  process.exit(1);
});

testWs.on('close', (code, reason) => {
  if (code !== 1000) {
    console.log(`❌ Connection closed unexpectedly: ${code} - ${reason}`);
  }
  clearTimeout(timeout);
});
