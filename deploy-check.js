import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

console.log('🔍 Checking deployment readiness...\n');

let allGood = true;
const issues = [];

// Check API key
if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_api_key_here') {
  issues.push('❌ GEMINI_API_KEY not configured properly');
  allGood = false;
} else {
  console.log('✅ API key configured');
}

// Check model configuration
const serverContent = fs.readFileSync('server-live.js', 'utf8');
if (serverContent.includes('gemini-2.5-flash-preview-native-audio-dialog')) {
  console.log('✅ Using production model (gemini-2.5-flash-preview-native-audio-dialog)');
} else if (serverContent.includes('gemini-2.0-flash-live-001')) {
  console.log('⚠️  Using development model (gemini-2.0-flash-live-001)');
  console.log('   Run "npm run config-prod" to switch to production model');
}

// Check required files
const requiredFiles = [
  'server-live.js',
  'public/index.html',
  'public/app.js',
  'public/styles.css',
  'package.json',
  '.env'
];

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} exists`);
  } else {
    issues.push(`❌ Missing file: ${file}`);
    allGood = false;
  }
});

// Check dependencies
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const deps = Object.keys(packageJson.dependencies || {});
  const requiredDeps = ['express', 'ws', 'cors', 'dotenv'];
  
  requiredDeps.forEach(dep => {
    if (deps.includes(dep)) {
      console.log(`✅ Dependency ${dep} installed`);
    } else {
      issues.push(`❌ Missing dependency: ${dep}`);
      allGood = false;
    }
  });
} catch (error) {
  issues.push('❌ Unable to read package.json');
  allGood = false;
}

console.log('\n' + '='.repeat(50));

if (allGood) {
  console.log('🎉 Application is ready for deployment!');
  console.log('\nTo start the server:');
  console.log('  npm start      (development mode)');
  console.log('  npm run prod   (production mode)');
  console.log('\nThen visit: http://localhost:3000');
} else {
  console.log('⚠️  Issues found that need attention:');
  issues.forEach(issue => console.log(`  ${issue}`));
  console.log('\nPlease fix these issues before deploying.');
}

console.log('\n📋 Pre-demo checklist:');
console.log('  □ Test microphone permissions');
console.log('  □ Verify audio playback works');
console.log('  □ Test interruption functionality');
console.log('  □ Check conversation flow about Revolt Motors');
console.log('  □ Verify low latency responses');
console.log('  □ Record 30-60 second demo video');
