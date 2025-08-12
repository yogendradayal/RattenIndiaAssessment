import fs from 'fs';
import path from 'path';

console.log('🔧 Configuring for production with native audio dialog model...\n');

// Update server-live.js for production
const serverPath = path.join(process.cwd(), 'server-live.js');
let serverContent = fs.readFileSync(serverPath, 'utf8');

// Replace the model configuration
serverContent = serverContent.replace(
    /const MODEL_NAME = process\.env\.NODE_ENV === 'production' \?\s*'gemini-2\.5-flash-preview-native-audio-dialog' :\s*'gemini-2\.0-flash-live-001';/,
    "const MODEL_NAME = 'gemini-2.5-flash-preview-native-audio-dialog';"
);

fs.writeFileSync(serverPath, serverContent);

console.log('✅ Updated server-live.js to use gemini-2.5-flash-preview-native-audio-dialog');

// Update package.json scripts
const packagePath = path.join(process.cwd(), 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

packageJson.scripts['prod'] = 'NODE_ENV=production node server-live.js';
packageJson.scripts['start:prod'] = 'NODE_ENV=production node server-live.js';

fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));

console.log('✅ Added production scripts to package.json');
console.log('\n🚀 Production configuration complete!');
console.log('\nTo run in production mode:');
console.log('  npm run prod');
console.log('\nTo run in development mode:');
console.log('  npm start');
