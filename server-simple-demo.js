import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Initialize dotenv
dotenv.config();

// Get current directory for ES modules
const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Pre-built responses for Revolt Motors - Comprehensive Knowledge Base
const REVOLT_RESPONSES = {
    // Company Information
    "about": "Revolt Motors is India's first AI-enabled electric motorcycle company! We're revolutionizing clean commuting with smart, connected electric bikes like the RV400 and RV320.",
    "company": "Revolt Motors was founded with a mission to democratize clean commuting in India. We're pioneering the electric mobility revolution with cutting-edge technology and design.",
    "founder": "Revolt Motors was founded by Rahul Sharma, who envisioned making electric motorcycles accessible to every Indian rider while promoting sustainable transportation.",
    
    // RV400 - Flagship Model
    "rv400": "The RV400 is our flagship electric motorcycle with a range of up to 150 km, top speed of 85 km/h, and smart connectivity through the My Revolt app. It's perfect for urban commuting!",
    "rv400_specs": "The RV400 features a 3.24 kWh battery, 85 km/h top speed, 150 km range, and weighs just 108 kg. It accelerates from 0 to 40 km/h in just 3.4 seconds!",
    "rv400_features": "The RV400 comes with artificial exhaust sound, mobile connectivity, GPS tracking, anti-theft protection, and OTA updates. It's like a smartphone on wheels!",
    "rv400_battery": "The RV400 uses a removable 3.24 kWh lithium-ion battery that can be charged at home or swapped at our stations. It's designed for convenience and longevity.",
    
    // RV320 - Entry Level
    "rv320": "The RV320 offers great value with a 100 km range, 65 km/h top speed, and all the essential features you need for daily rides. It's our entry-level smart electric motorcycle.",
    "rv320_specs": "The RV320 features a 2.7 kWh battery, 65 km/h top speed, 100 km range, and includes smart connectivity features at an affordable price point.",
    
    // My Revolt App
    "app": "The My Revolt app lets you remotely start your bike, track rides, find charging stations, get service updates, and even customize your bike's sound! It's like having a smart companion for your ride.",
    "app_features": "With My Revolt app, you can monitor battery status, plan routes, book services, access ride analytics, enable geo-fencing, and even share your bike with family members securely.",
    "remote_start": "Yes! You can remotely start your Revolt motorcycle using the My Revolt app. Perfect for warming up the systems before you even step outside.",
    
    // Performance & Range
    "range": "Our motorcycles offer impressive range - the RV400 gives you up to 150 km per charge, while the RV320 provides 100 km. Perfect for daily city commutes without range anxiety!",
    "performance": "Revolt motorcycles deliver instant torque with zero emissions. The RV400 accelerates from 0-40 km/h in just 3.4 seconds - that's quicker than most petrol bikes!",
    "speed": "The RV400 reaches a top speed of 85 km/h, while the RV320 tops out at 65 km/h. Both are perfectly suited for city riding and highway cruising.",
    "acceleration": "Electric motors provide instant torque! Our RV400 accelerates from 0 to 40 km/h in just 3.4 seconds, giving you that thrilling riding experience.",
    
    // Charging & Battery
    "charging": "Our bikes charge quickly with fast charging capabilities. You can charge at home or at any of our Revolt charging stations across India. The network is growing every day!",
    "charging_time": "The RV400 charges from 0 to 80% in just 3 hours with fast charging, or fully charges in 4.5 hours. The RV320 charges even faster due to its smaller battery.",
    "battery_life": "Our lithium-ion batteries are designed to last over 1500 charge cycles. With proper care, they'll serve you reliably for many years of riding.",
    "home_charging": "Yes, you can charge your Revolt motorcycle at home using a standard 15A socket. Just plug in overnight and wake up to a fully charged bike!",
    "swap_station": "We're building a network of battery swapping stations across India. Swap your drained battery for a fully charged one in under 60 seconds!",
    
    // Pricing & Purchase
    "price": "For the most current pricing and offers, please visit revoltmotors.com or contact our customer service. We often have exciting financing options and exchange offers available!",
    "emi": "We offer attractive EMI options starting from as low as 2,999 rupees per month. Visit our website or authorized dealers for detailed financing options.",
    "booking": "You can book your Revolt motorcycle online at revoltmotors.com with a refundable booking amount. Choose your preferred model, color, and delivery location.",
    "exchange": "We accept old petrol motorcycles in exchange! Our exchange program offers competitive prices and makes switching to electric more affordable.",
    
    // Service & Maintenance
    "service": "Revolt motorcycles require minimal maintenance compared to petrol bikes. No oil changes, fewer moving parts, and our service network ensures you're always on the road.",
    "maintenance": "Electric motorcycles need very little maintenance - just periodic checks, tire rotation, and brake inspection. Much simpler and cheaper than petrol bikes!",
    "warranty": "We provide comprehensive warranty coverage on our motorcycles and batteries. Check our website for detailed warranty terms and conditions.",
    
    // Technology & Innovation
    "technology": "Revolt motorcycles are packed with cutting-edge technology including AI integration, IoT connectivity, OTA updates, and advanced battery management systems.",
    "sound": "Our motorcycles feature artificial exhaust sound that you can customize through the app. Choose from multiple sound profiles or ride in silent mode.",
    "gps": "All Revolt motorcycles come with built-in GPS tracking for navigation, theft protection, and ride analytics. Your bike is always connected and secure.",
    "ota": "We provide Over-The-Air updates to improve your motorcycle's performance, add new features, and enhance security - just like your smartphone!",
    
    // Environment & Sustainability
    "environment": "By choosing Revolt, you're contributing to cleaner air and reduced carbon emissions. One electric motorcycle can save over 1,800 kg of CO2 annually!",
    "eco_friendly": "Electric motorcycles produce zero direct emissions and are much quieter than petrol vehicles, contributing to cleaner and more peaceful cities.",
    "green": "Going green with Revolt means lower running costs, zero emissions, and supporting India's transition to sustainable transportation.",
    
    // Availability & Locations
    "cities": "Revolt motorcycles are available in major cities across India including Delhi, Mumbai, Pune, Ahmedabad, Hyderabad, Chennai, and many more. Check our website for your city.",
    "dealers": "We have authorized dealers and experience centers in over 40 cities across India. Visit our website to find the nearest dealer in your area.",
    "test_ride": "Yes! You can book a test ride at any of our experience centers or authorized dealers. Experience the thrill of electric riding before you buy.",
    
    // Comparison
    "vs_petrol": "Electric motorcycles offer lower running costs, zero emissions, instant torque, minimal maintenance, and whisper-quiet operation compared to petrol bikes.",
    "savings": "You can save up to 80% on fuel costs with electric motorcycles. Plus, lower maintenance costs mean more money in your pocket every month!",
    
    // Safety & Features
    "safety": "Revolt motorcycles come with advanced safety features including ABS, LED lighting, digital displays, mobile alerts, and GPS tracking for enhanced rider safety.",
    "anti_theft": "Our motorcycles feature advanced anti-theft protection with GPS tracking, mobile alerts, remote immobilization, and geo-fencing through the My Revolt app.",
    
    // Future & Innovation
    "future": "We're constantly innovating with upcoming features like battery swapping networks, enhanced AI capabilities, and new model launches to lead India's electric revolution.",
    
    "default": "That's a great question about Revolt Motors! We're passionate about electric mobility and sustainable transportation. Ask me about our models, technology, charging, or anything else!"
};

// Enhanced keyword matching for comprehensive demo responses
function getRevoltResponse(input) {
    const lowerInput = input.toLowerCase();
    
    // Company & About
    if (lowerInput.includes('about revolt') || lowerInput.includes('what is revolt') || lowerInput.includes('tell me about revolt')) {
        return REVOLT_RESPONSES.about;
    } else if (lowerInput.includes('company') || lowerInput.includes('founded') || lowerInput.includes('history')) {
        return REVOLT_RESPONSES.company;
    } else if (lowerInput.includes('founder') || lowerInput.includes('rahul sharma') || lowerInput.includes('who started')) {
        return REVOLT_RESPONSES.founder;
    }
    
    // RV400 Specific
    else if (lowerInput.includes('rv400') || lowerInput.includes('flagship') || lowerInput.includes('premium model')) {
        if (lowerInput.includes('spec') || lowerInput.includes('specification') || lowerInput.includes('technical')) {
            return REVOLT_RESPONSES.rv400_specs;
        } else if (lowerInput.includes('feature') || lowerInput.includes('smart') || lowerInput.includes('connectivity')) {
            return REVOLT_RESPONSES.rv400_features;
        } else if (lowerInput.includes('battery') || lowerInput.includes('kwh')) {
            return REVOLT_RESPONSES.rv400_battery;
        } else {
            return REVOLT_RESPONSES.rv400;
        }
    }
    
    // RV320 Specific  
    else if (lowerInput.includes('rv320') || lowerInput.includes('entry level') || lowerInput.includes('affordable')) {
        if (lowerInput.includes('spec') || lowerInput.includes('specification')) {
            return REVOLT_RESPONSES.rv320_specs;
        } else {
            return REVOLT_RESPONSES.rv320;
        }
    }
    
    // App & Technology
    else if (lowerInput.includes('app') || lowerInput.includes('my revolt') || lowerInput.includes('mobile')) {
        if (lowerInput.includes('feature') || lowerInput.includes('what can') || lowerInput.includes('functions')) {
            return REVOLT_RESPONSES.app_features;
        } else {
            return REVOLT_RESPONSES.app;
        }
    } else if (lowerInput.includes('remote start') || lowerInput.includes('start remotely')) {
        return REVOLT_RESPONSES.remote_start;
    } else if (lowerInput.includes('technology') || lowerInput.includes('tech') || lowerInput.includes('innovation')) {
        return REVOLT_RESPONSES.technology;
    } else if (lowerInput.includes('sound') || lowerInput.includes('exhaust') || lowerInput.includes('noise')) {
        return REVOLT_RESPONSES.sound;
    } else if (lowerInput.includes('gps') || lowerInput.includes('tracking') || lowerInput.includes('navigation')) {
        return REVOLT_RESPONSES.gps;
    } else if (lowerInput.includes('ota') || lowerInput.includes('update') || lowerInput.includes('software')) {
        return REVOLT_RESPONSES.ota;
    }
    
    // Performance & Range
    else if (lowerInput.includes('range') || lowerInput.includes('km') || lowerInput.includes('distance') || lowerInput.includes('mileage')) {
        return REVOLT_RESPONSES.range;
    } else if (lowerInput.includes('performance') || lowerInput.includes('power') || lowerInput.includes('torque')) {
        return REVOLT_RESPONSES.performance;
    } else if (lowerInput.includes('speed') || lowerInput.includes('fast') || lowerInput.includes('top speed')) {
        return REVOLT_RESPONSES.speed;
    } else if (lowerInput.includes('acceleration') || lowerInput.includes('quick') || lowerInput.includes('0 to')) {
        return REVOLT_RESPONSES.acceleration;
    }
    
    // Charging & Battery
    else if (lowerInput.includes('charg') || lowerInput.includes('battery') || lowerInput.includes('power')) {
        if (lowerInput.includes('time') || lowerInput.includes('how long') || lowerInput.includes('duration')) {
            return REVOLT_RESPONSES.charging_time;
        } else if (lowerInput.includes('home') || lowerInput.includes('house')) {
            return REVOLT_RESPONSES.home_charging;
        } else if (lowerInput.includes('swap') || lowerInput.includes('station') || lowerInput.includes('replace')) {
            return REVOLT_RESPONSES.swap_station;
        } else if (lowerInput.includes('life') || lowerInput.includes('last') || lowerInput.includes('durability')) {
            return REVOLT_RESPONSES.battery_life;
        } else {
            return REVOLT_RESPONSES.charging;
        }
    }
    
    // Pricing & Purchase
    else if (lowerInput.includes('price') || lowerInput.includes('cost') || lowerInput.includes('buy') || lowerInput.includes('purchase')) {
        return REVOLT_RESPONSES.price;
    } else if (lowerInput.includes('emi') || lowerInput.includes('loan') || lowerInput.includes('finance') || lowerInput.includes('installment')) {
        return REVOLT_RESPONSES.emi;
    } else if (lowerInput.includes('book') || lowerInput.includes('order') || lowerInput.includes('reserve')) {
        return REVOLT_RESPONSES.booking;
    } else if (lowerInput.includes('exchange') || lowerInput.includes('trade') || lowerInput.includes('old bike')) {
        return REVOLT_RESPONSES.exchange;
    }
    
    // Service & Maintenance
    else if (lowerInput.includes('service') || lowerInput.includes('servicing')) {
        return REVOLT_RESPONSES.service;
    } else if (lowerInput.includes('maintenance') || lowerInput.includes('repair') || lowerInput.includes('upkeep')) {
        return REVOLT_RESPONSES.maintenance;
    } else if (lowerInput.includes('warranty') || lowerInput.includes('guarantee')) {
        return REVOLT_RESPONSES.warranty;
    }
    
    // Environment & Sustainability
    else if (lowerInput.includes('environment') || lowerInput.includes('emission') || lowerInput.includes('pollution')) {
        return REVOLT_RESPONSES.environment;
    } else if (lowerInput.includes('eco') || lowerInput.includes('friendly') || lowerInput.includes('clean')) {
        return REVOLT_RESPONSES.eco_friendly;
    } else if (lowerInput.includes('green') || lowerInput.includes('sustainable')) {
        return REVOLT_RESPONSES.green;
    }
    
    // Availability & Locations
    else if (lowerInput.includes('cities') || lowerInput.includes('available') || lowerInput.includes('where') || lowerInput.includes('location')) {
        return REVOLT_RESPONSES.cities;
    } else if (lowerInput.includes('dealer') || lowerInput.includes('showroom') || lowerInput.includes('center')) {
        return REVOLT_RESPONSES.dealers;
    } else if (lowerInput.includes('test ride') || lowerInput.includes('trial') || lowerInput.includes('demo')) {
        return REVOLT_RESPONSES.test_ride;
    }
    
    // Comparison
    else if (lowerInput.includes('petrol') || lowerInput.includes('gasoline') || lowerInput.includes('vs') || lowerInput.includes('compare')) {
        return REVOLT_RESPONSES.vs_petrol;
    } else if (lowerInput.includes('saving') || lowerInput.includes('save') || lowerInput.includes('cheaper')) {
        return REVOLT_RESPONSES.savings;
    }
    
    // Safety & Features
    else if (lowerInput.includes('safety') || lowerInput.includes('secure') || lowerInput.includes('safe')) {
        return REVOLT_RESPONSES.safety;
    } else if (lowerInput.includes('theft') || lowerInput.includes('steal') || lowerInput.includes('security')) {
        return REVOLT_RESPONSES.anti_theft;
    }
    
    // Future & Innovation
    else if (lowerInput.includes('future') || lowerInput.includes('upcoming') || lowerInput.includes('new') || lowerInput.includes('next')) {
        return REVOLT_RESPONSES.future;
    }
    
    // General greetings and questions
    else if (lowerInput.includes('hello') || lowerInput.includes('hi') || lowerInput.includes('hey')) {
        return "Hello! I'm Rev, your Revolt Motors assistant. I'm excited to help you learn about our amazing electric motorcycles. What would you like to know?";
    } else if (lowerInput.includes('help') || lowerInput.includes('assist')) {
        return "I'm here to help you with everything about Revolt Motors! Ask me about our RV400, RV320, charging, pricing, features, or anything else about electric motorcycles.";
    }
    
    else {
        return REVOLT_RESPONSES.default;
    }
}

// Simulated TTS function (for demo purposes)
const simulateTextToSpeech = (text) => {
    const words = text.split(' ').length;
    const estimatedDuration = Math.max(2000, words * 350); // ~350ms per word
    return {
        text: text,
        audioAvailable: false,
        duration: estimatedDuration
    };
};

// Store active sessions
const activeSessions = new Map();

// WebSocket connection handler
wss.on('connection', async (ws) => {
    console.log('Client connected');
    
    activeSessions.set(ws, true);
    
    ws.send(JSON.stringify({
        type: 'session_started',
        message: 'Connected to Revolt Motors voice assistant (Simple Demo Mode)'
    }));
    
    // Handle messages from client
    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);
            
            if (data.type === 'audio_input') {
                // Simulate speech recognition - randomly pick a common question
                const commonQuestions = [
                    "Tell me about Revolt Motors",
                    "What is the range of RV400?",
                    "How does the My Revolt app work?",
                    "What are the charging options?",
                    "Tell me about RV400 features",
                    "What is the price of electric motorcycles?",
                    "How long does charging take?",
                    "What is the top speed?",
                    "Tell me about battery life",
                    "Where can I buy Revolt motorcycles?",
                    "What are the specifications of RV320?",
                    "How does remote start work?",
                    "What are the environmental benefits?",
                    "Tell me about service and maintenance",
                    "Can I charge at home?"
                ];
                
                // Pick a random question to simulate speech recognition
                const simulatedQuestion = commonQuestions[Math.floor(Math.random() * commonQuestions.length)];
                
                // Add a short delay to simulate processing
                setTimeout(() => {
                    // Send the simulated transcript
                    ws.send(JSON.stringify({
                        type: 'transcript',
                        text: simulatedQuestion
                    }));
                    
                    // Get response from our pre-built responses
                    const response = getRevoltResponse(simulatedQuestion);
                    
                    // Send text response
                    ws.send(JSON.stringify({
                        type: 'text_response',
                        text: response
                    }));
                    
                    // Simulate TTS
                    const ttsResult = simulateTextToSpeech(response);
                    
                    // Send audio simulation
                    ws.send(JSON.stringify({
                        type: 'audio_simulation',
                        text: ttsResult.text,
                        duration: ttsResult.duration
                    }));
                }, 1000); // 1 second delay for "processing"
                
            } else if (data.type === 'demo_text_input') {
                // Handle demo text input
                const userInput = data.text;
                
                // Send the transcript
                ws.send(JSON.stringify({
                    type: 'transcript',
                    text: userInput
                }));
                
                // Get response from our pre-built responses
                const response = getRevoltResponse(userInput);
                
                // Send text response
                ws.send(JSON.stringify({
                    type: 'text_response',
                    text: response
                }));
                
                // Simulate TTS
                const ttsResult = simulateTextToSpeech(response);
                
                // Send audio simulation
                ws.send(JSON.stringify({
                    type: 'audio_simulation',
                    text: ttsResult.text,
                    duration: ttsResult.duration
                }));
                
            } else if (data.type === 'text_input') {
                // Handle direct text input
                const userInput = data.text;
                const response = getRevoltResponse(userInput);
                
                ws.send(JSON.stringify({
                    type: 'text_response',
                    text: response
                }));
                
                // Simulate TTS for demo
                const ttsResult = simulateTextToSpeech(response);
                
                ws.send(JSON.stringify({
                    type: 'audio_simulation',
                    text: ttsResult.text,
                    duration: ttsResult.duration
                }));
                
            } else if (data.type === 'interrupt') {
                // Handle interruption
                ws.send(JSON.stringify({
                    type: 'interrupted',
                    message: 'Interrupted'
                }));
            }
            
        } catch (error) {
            console.error('Error processing message:', error);
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Error processing your request'
            }));
        }
    });
    
    // Handle client disconnect
    ws.on('close', () => {
        console.log('Client disconnected');
        activeSessions.delete(ws);
    });
    
    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        activeSessions.delete(ws);
    });
});

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'public', 'index.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy (simple demo mode)',
        activeSessions: activeSessions.size
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Revolt Voice Chat SIMPLE DEMO server running on port ${PORT}`);
    console.log(`📱 Visit http://localhost:${PORT} to test the interface`);
    console.log(`🎙️ Note: This is simple demo mode - no API required`);
    console.log(`⚡ Try asking about: RV400, RV320, My Revolt app, range, charging`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('Shutting down simple demo server...');
    wss.clients.forEach((ws) => {
        ws.terminate();
    });
    server.close();
});
