import fs from 'fs';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚀 Revolt Voice Chat Setup\n');
console.log('This script will help you configure your Gemini API key.\n');

console.log('📋 Steps to get your API key:');
console.log('1. Visit https://aistudio.google.com');
console.log('2. Sign in with your Google account');
console.log('3. Click "Get API key" or "Create API key"');
console.log('4. Copy the generated API key\n');

rl.question('Enter your Gemini API key: ', (apiKey) => {
  if (!apiKey || apiKey.trim() === '') {
    console.log('❌ No API key provided. Please run this script again with a valid API key.');
    rl.close();
    return;
  }
  
  // Validate API key format (basic check)
  if (!apiKey.startsWith('AIzaSy') || apiKey.length < 30) {
    console.log('⚠️  The API key format doesn\'t look correct. Google API keys usually start with "AIzaSy".');
    console.log('   Please double-check your API key.');
  }
  
  const envContent = `# Get your API key from https://aistudio.google.com
GEMINI_API_KEY=${apiKey.trim()}
PORT=3000`;
  
  try {
    fs.writeFileSync('.env', envContent);
    console.log('\n✅ API key configured successfully!');
    console.log('\nNext steps:');
    console.log('1. Run: npm start');
    console.log('2. Open http://localhost:3000 in your browser');
    console.log('3. Allow microphone permissions');
    console.log('4. Click "Start Talking" and ask about Revolt Motors!\n');
  } catch (error) {
    console.log('❌ Error writing .env file:', error.message);
  }
  
  rl.close();
});

rl.on('close', () => {
  console.log('Setup completed. Happy chatting with Rev! 🏍️⚡');
});
