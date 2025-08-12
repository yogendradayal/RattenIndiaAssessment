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

If you don't know specific details about current models, pricing, or availability, recommend the customer visit revoltmotors.com or contact customer service for the most up-to-date information.`;

// Store active sessions
const activeSessions = new Map();

// WebSocket connection handler
wss.on('connection', async (ws) => {
    console.log('Client connected');
    
    let liveSession = null;
    
    try {
        // For development, use gemini-2.0-flash-live-001 or gemini-live-2.5-flash-preview
        // For production, use gemini-2.5-flash-preview-native-audio-dialog
        const MODEL_NAME = 'gemini-2.0-flash-live-001'; // Change this based on your needs
        
        const model = genAI.getGenerativeModel({ 
            model: MODEL_NAME,
            systemInstruction: REVOLT_SYSTEM_INSTRUCTION
        });
        
        // Start live session
        liveSession = await model.startChat().sendMessageStream({
            text: 'Hello! I\'m ready to help with Revolt Motors information. What would you like to know?'
        });
        
        activeSessions.set(ws, liveSession);
        
        ws.send(JSON.stringify({
            type: 'session_started',
            message: 'Connected to Revolt Motors voice assistant'
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
            
            if (data.type === 'audio_input' && liveSession) {
                // For now, we'll handle this differently since Live API is in preview
                // Convert audio to text first (simplified approach)
                ws.send(JSON.stringify({
                    type: 'text_response',
                    text: 'Hello! I\'m Rev from Revolt Motors. How can I help you with our electric motorcycles today?'
                }));
                
            } else if (data.type === 'text_input' && liveSession) {
                // Handle text input
                try {
                    const result = await liveSession.sendMessage(data.text);
                    const response = await result.response;
                    const text = response.text();
                    
                    ws.send(JSON.stringify({
                        type: 'text_response',
                        text: text
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
        status: 'healthy',
        activeSessions: activeSessions.size
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Revolt Voice Chat server running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT} to start chatting`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('Shutting down server...');
    wss.clients.forEach(async (ws) => {
        const session = activeSessions.get(ws);
        if (session) {
            try {
                await session.close();
            } catch (error) {
                console.error('Error closing session during shutdown:', error);
            }
        }
        ws.terminate();
    });
    server.close();
});
