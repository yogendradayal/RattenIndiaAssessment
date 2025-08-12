import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { GoogleGenerativeAI } from '@google/generative-ai';
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

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// System instruction for Revolt Motors
const REVOLT_SYSTEM_INSTRUCTION = `You are Rev, the AI assistant for Revolt Motors, India's leading electric motorcycle company. 

Your role is to help customers with information about Revolt Motors and their electric motorcycles. You should:

1. Only discuss topics related to Revolt Motors, electric vehicles, motorcycles, and sustainable transportation
2. Provide accurate information about Revolt Motors' products, services, and company
3. Be enthusiastic about electric vehicles and sustainability
4. If asked about unrelated topics, politely redirect the conversation back to Revolt Motors
5. Maintain a friendly, professional, and knowledgeable tone
6. Speak naturally and conversationally

Key information about Revolt Motors:
- India's first AI-enabled electric motorcycle company
- Founded with a mission to democratize clean commuting
- Offers smart electric motorcycles with connected features
- Focus on performance, technology, and sustainability
- Available across multiple cities in India
- Known for the RV400 and RV320 models
- Features like My Revolt app for connectivity

Keep responses brief, conversational, and engaging. Aim for 2-3 sentences maximum for voice interaction.

If you don't know specific details about current models, pricing, or availability, recommend the customer visit revoltmotors.com or contact customer service for the most up-to-date information.`;

// Store active sessions
const activeSessions = new Map();

// Simulated TTS function (for demo purposes)
const simulateTextToSpeech = (text) => {
    // In a real implementation, this would call a TTS service
    // For demo, we'll just return the text and simulate audio
    const words = text.split(' ').length;
    const estimatedDuration = Math.max(2000, words * 300); // ~300ms per word
    return {
        text: text,
        audioAvailable: false,
        duration: estimatedDuration
    };
};

// WebSocket connection handler
wss.on('connection', async (ws) => {
    console.log('Client connected');
    
    let chatSession = null;
    
    try {
        const model = genAI.getGenerativeModel({ 
            model: 'gemini-1.5-flash',
            systemInstruction: REVOLT_SYSTEM_INSTRUCTION
        });
        
        chatSession = model.startChat({
            history: [],
            generationConfig: {
                maxOutputTokens: 150, // Keep responses short for voice
                temperature: 0.7,
            },
        });
        
        activeSessions.set(ws, chatSession);
        
        ws.send(JSON.stringify({
            type: 'session_started',
            message: 'Connected to Revolt Motors voice assistant (Demo Mode)'
        }));
        
    } catch (error) {
        console.error('Error creating Gemini session:', error);
        ws.send(JSON.stringify({
            type: 'error',
            message: 'Failed to initialize voice assistant. Please check your API key and try again.'
        }));
    }
    
    // Handle messages from client
    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);
            
            if (data.type === 'audio_input' && chatSession) {
                // For demo, we'll ask the user to type their question
                ws.send(JSON.stringify({
                    type: 'request_text_input',
                    message: 'Demo Mode: Please type your question below (audio processing simulation)'
                }));
                
            } else if (data.type === 'demo_text_input' && chatSession) {
                // Handle demo text input that represents what user would have spoken
                const userInput = data.text;
                
                // Send the transcript
                ws.send(JSON.stringify({
                    type: 'transcript',
                    text: userInput
                }));
                
                // Get AI response
                try {
                    const result = await chatSession.sendMessage(userInput);
                    const response = result.response;
                    const text = response.text();
                    
                    // Send text response
                    ws.send(JSON.stringify({
                        type: 'text_response',
                        text: text
                    }));
                    
                    // Simulate TTS
                    const ttsResult = simulateTextToSpeech(text);
                    
                    // Send audio simulation
                    ws.send(JSON.stringify({
                        type: 'audio_simulation',
                        text: ttsResult.text,
                        duration: ttsResult.duration
                    }));
                    
                } catch (error) {
                    console.error('Error getting AI response:', error);
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: 'Error processing your request'
                    }));
                }
                
            } else if (data.type === 'text_input' && chatSession) {
                // Handle text input
                try {
                    const result = await chatSession.sendMessage(data.text);
                    const response = result.response;
                    const text = response.text();
                    
                    ws.send(JSON.stringify({
                        type: 'text_response',
                        text: text
                    }));
                    
                    // Simulate TTS for demo
                    const ttsResult = simulateTextToSpeech(text);
                    
                    ws.send(JSON.stringify({
                        type: 'audio_simulation',
                        text: ttsResult.text,
                        duration: ttsResult.duration
                    }));
                    
                } catch (error) {
                    console.error('Error getting response:', error);
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: 'Error processing your request'
                    }));
                }
                
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
        status: 'healthy (demo mode)',
        activeSessions: activeSessions.size
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Revolt Voice Chat DEMO server running on port ${PORT}`);
    console.log(`📱 Visit http://localhost:${PORT} to test the interface`);
    console.log(`🎙️ Note: This is demo mode - Live API not required`);
    console.log(`⚡ Shows UI functionality and conversation flow`);
    
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_api_key_here') {
        console.log('⚠️  Please set your GEMINI_API_KEY in the .env file');
        console.log('   Get your API key from: https://aistudio.google.com');
    }
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('Shutting down demo server...');
    wss.clients.forEach((ws) => {
        ws.terminate();
    });
    server.close();
});
