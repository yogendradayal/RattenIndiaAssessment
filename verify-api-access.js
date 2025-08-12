import dotenv from 'dotenv';
import https from 'https';
import WebSocket from 'ws';

dotenv.config();

console.log('🔍 Comprehensive Gemini API Access Verification\n');

if (!process.env.GEMINI_API_KEY) {
    console.log('❌ No API key found in .env file');
    process.exit(1);
}

const API_KEY = process.env.GEMINI_API_KEY;
console.log(`✅ API Key found: ${API_KEY.substring(0, 20)}...`);

// Test 1: Check basic Gemini API access
console.log('\n📡 Test 1: Basic Gemini API Access');
console.log('-----------------------------------');

const testBasicAPI = () => {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'generativelanguage.googleapis.com',
            path: `/v1beta/models?key=${API_KEY}`,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    if (res.statusCode === 200) {
                        const response = JSON.parse(data);
                        console.log('✅ Basic API access confirmed');
                        
                        // Check available models
                        const models = response.models || [];
                        const liveModels = models.filter(model => 
                            model.name.includes('live') || 
                            model.name.includes('native-audio')
                        );
                        
                        console.log(`📋 Total models available: ${models.length}`);
                        console.log(`🎙️ Live/Audio models found: ${liveModels.length}`);
                        
                        if (liveModels.length > 0) {
                            console.log('\n🎯 Available Live Models:');
                            liveModels.forEach(model => {
                                console.log(`   • ${model.name.replace('models/', '')}`);
                            });
                        } else {
                            console.log('⚠️  No Live API models found in your available models');
                        }
                        
                        resolve(liveModels.length > 0);
                    } else {
                        console.log(`❌ API access failed: HTTP ${res.statusCode}`);
                        console.log(`   Response: ${data}`);
                        resolve(false);
                    }
                } catch (error) {
                    console.log('❌ Error parsing API response:', error.message);
                    resolve(false);
                }
            });
        });

        req.on('error', (error) => {
            console.log('❌ Network error:', error.message);
            resolve(false);
        });

        req.setTimeout(10000, () => {
            console.log('❌ Request timeout');
            req.destroy();
            resolve(false);
        });

        req.end();
    });
};

// Test 2: Try Live API WebSocket connection
console.log('\n🔌 Test 2: Live API WebSocket Connection');
console.log('----------------------------------------');

const testLiveAPIWebSocket = (modelName) => {
    return new Promise((resolve) => {
        console.log(`🔄 Testing model: ${modelName}`);
        
        const url = `wss://generativelanguage.googleapis.com/ws/v1beta/models/${modelName}:streamGenerateContent?key=${API_KEY}`;
        const ws = new WebSocket(url);
        
        const timeout = setTimeout(() => {
            console.log('⏰ WebSocket connection timeout');
            ws.close();
            resolve(false);
        }, 15000);
        
        ws.on('open', () => {
            console.log('✅ WebSocket connection successful!');
            
            // Send a simple setup message
            const setupMessage = {
                "setup": {
                    "model": `models/${modelName}`,
                    "generation_config": {
                        "response_modalities": ["TEXT"]
                    }
                }
            };
            
            ws.send(JSON.stringify(setupMessage));
        });
        
        ws.on('message', (data) => {
            try {
                const response = JSON.parse(data);
                if (response.setupComplete) {
                    console.log('🎉 Live API setup completed successfully!');
                    clearTimeout(timeout);
                    ws.close();
                    resolve(true);
                } else if (response.error) {
                    console.log('❌ Setup error:', response.error);
                    clearTimeout(timeout);
                    ws.close();
                    resolve(false);
                }
            } catch (error) {
                console.log('📨 Received non-JSON message (might be normal)');
            }
        });
        
        ws.on('error', (error) => {
            console.log('❌ WebSocket error:', error.message);
            
            if (error.message.includes('404')) {
                console.log('   → This model may not be available with your API key');
            } else if (error.message.includes('403')) {
                console.log('   → Access forbidden - you may need to request Live API access');
            }
            
            clearTimeout(timeout);
            resolve(false);
        });
        
        ws.on('close', (code, reason) => {
            if (code !== 1000) {
                console.log(`❌ Connection closed: ${code} - ${reason}`);
            }
            clearTimeout(timeout);
        });
    });
};

// Main verification process
async function verifyAccess() {
    // Test basic API access first
    const hasBasicAccess = await testBasicAPI();
    
    if (!hasBasicAccess) {
        console.log('\n🚫 Cannot proceed - basic API access failed');
        console.log('\n💡 Troubleshooting steps:');
        console.log('   1. Check your API key is correct');
        console.log('   2. Ensure your Google AI Studio project is active');
        console.log('   3. Verify billing is set up (if required)');
        return;
    }
    
    // Test Live API models
    const modelsToTest = [
        'gemini-2.5-flash-preview-native-audio-dialog',
        'gemini-2.0-flash-live-001',
        'gemini-live-2.5-flash-preview'
    ];
    
    let hasLiveAccess = false;
    
    for (const model of modelsToTest) {
        const result = await testLiveAPIWebSocket(model);
        if (result) {
            hasLiveAccess = true;
            console.log(`✅ Live API access confirmed with model: ${model}`);
            break;
        }
        console.log(''); // Add spacing between tests
    }
    
    console.log('\n' + '='.repeat(60));
    
    if (hasLiveAccess) {
        console.log('🎉 SUCCESS: You have Gemini Live API access!');
        console.log('\n🚀 Next steps:');
        console.log('   1. Run: npm start');
        console.log('   2. Open: http://localhost:3000');
        console.log('   3. Test the voice interface');
        console.log('   4. Record your demo video');
    } else {
        console.log('⚠️  ISSUE: Live API access not confirmed');
        console.log('\n💡 How to get access:');
        console.log('   1. Visit: https://aistudio.google.com/live');
        console.log('   2. Try the live playground first');
        console.log('   3. If playground works, there might be an endpoint issue');
        console.log('   4. If playground doesn\'t work, request preview access');
        console.log('\n🔄 Alternative for testing:');
        console.log('   • Use "npm run old-server" to test the UI without Live API');
        console.log('   • This will help you prepare the demo structure');
    }
}

verifyAccess().catch(console.error);
