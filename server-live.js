import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import WebSocket from 'ws';
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

// System instruction for Revolt Motors
const REVOLT_SYSTEM_INSTRUCTION = {
  "system_instruction": {
    "parts": [
      {
        "text": `You are Rev, the AI assistant for Revolt Motors, India's leading electric motorcycle company. 

Your role is to help customers with information about Revolt Motors and their electric motorcycles. You should:

1. Only discuss topics related to Revolt Motors, electric vehicles, motorcycles, and sustainable transportation
2. Provide accurate information about Revolt Motors' products, services, and company
3. Be enthusiastic about electric vehicles and sustainability
4. If asked about unrelated topics, politely redirect the conversation back to Revolt Motors
5. Maintain a friendly, professional, and knowledgeable tone
6. Speak naturally and conversationally in a warm, engaging manner

Key information about Revolt Motors:
- India's first AI-enabled electric motorcycle company
- Founded with a mission to democratize clean commuting
- Offers smart electric motorcycles with connected features
- Focus on performance, technology, and sustainability
- Available across multiple cities in India
- Known for the RV400 and RV320 models
- Features like My Revolt app for connectivity

If you don't know specific details about current models, pricing, or availability, recommend the customer visit revoltmotors.com or contact customer service for the most up-to-date information.

Keep responses conversational, brief, and engaging as this is a voice interface.`
      }
    ]
  }
};

// Store active sessions
const activeSessions = new Map();

// WebSocket connection handler
wss.on('connection', async (ws) => {
  console.log('Client connected');
  
  let geminiWs = null;
  let isConnectedToGemini = false;
  
  const connectToGemini = async () => {
    try {
      // For development, use gemini-2.0-flash-live-001 
      // For production, use gemini-2.5-flash-preview-native-audio-dialog
      // For final submission, use gemini-2.5-flash-preview-native-audio-dialog
      const MODEL_NAME = process.env.NODE_ENV === 'production' ? 
        'gemini-2.5-flash-preview-native-audio-dialog' : 
        'gemini-2.0-flash-live-001';
      
      const url = `wss://generativelanguage.googleapis.com/ws/v1beta/models/${MODEL_NAME}:streamGenerateContent?key=${process.env.GEMINI_API_KEY}`;
      
      geminiWs = new WebSocket(url);
      
      geminiWs.on('open', () => {
        console.log('Connected to Gemini Live API');
        isConnectedToGemini = true;
        
        // Send initial configuration
        const initialConfig = {
          "setup": {
            "model": `models/${MODEL_NAME}`,
            ...REVOLT_SYSTEM_INSTRUCTION,
            "generation_config": {
              "response_modalities": ["AUDIO"],
              "speech_config": {
                "voice_config": {
                  "prebuilt_voice_config": {
                    "voice_name": "Aoede"
                  }
                }
              }
            }
          }
        };
        
        geminiWs.send(JSON.stringify(initialConfig));
        
        ws.send(JSON.stringify({
          type: 'session_started',
          message: 'Connected to Revolt Motors voice assistant'
        }));
      });
      
      geminiWs.on('message', (data) => {
        try {
          const response = JSON.parse(data);
          
          if (response.serverContent) {
            // Handle different types of responses
            if (response.serverContent.modelTurn) {
              const parts = response.serverContent.modelTurn.parts;
              
              for (const part of parts) {
                if (part.text) {
                  ws.send(JSON.stringify({
                    type: 'text_response',
                    text: part.text
                  }));
                }
                
                if (part.inlineData && part.inlineData.mimeType.startsWith('audio/')) {
                  // Send audio data to client
                  ws.send(JSON.stringify({
                    type: 'audio_response',
                    data: part.inlineData.data,
                    mimeType: part.inlineData.mimeType
                  }));
                }
              }
            }
          }
          
          if (response.setupComplete) {
            console.log('Gemini setup complete');
          }
          
        } catch (error) {
          console.error('Error parsing Gemini response:', error);
        }
      });
      
      geminiWs.on('error', (error) => {
        console.error('Gemini WebSocket error:', error);
        isConnectedToGemini = false;
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Connection to voice assistant lost'
        }));
      });
      
      geminiWs.on('close', () => {
        console.log('Gemini WebSocket closed');
        isConnectedToGemini = false;
      });
      
    } catch (error) {
      console.error('Error connecting to Gemini:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Failed to initialize voice assistant. Please check your API key.'
      }));
    }
  };
  
  // Connect to Gemini
  await connectToGemini();
  activeSessions.set(ws, geminiWs);
  
  // Handle messages from client
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      
      if (!isConnectedToGemini || !geminiWs) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Not connected to voice assistant'
        }));
        return;
      }
      
      if (data.type === 'audio_input') {
        // Send audio data to Gemini
        const audioMessage = {
          "realtimeInput": {
            "mediaChunks": [
              {
                "mimeType": "audio/pcm;rate=16000",
                "data": data.audio
              }
            ]
          }
        };
        
        geminiWs.send(JSON.stringify(audioMessage));
        
      } else if (data.type === 'text_input') {
        // Send text message to Gemini
        const textMessage = {
          "realtimeInput": {
            "userInput": {
              "parts": [
                {
                  "text": data.text
                }
              ]
            }
          }
        };
        
        geminiWs.send(JSON.stringify(textMessage));
        
      } else if (data.type === 'interrupt') {
        // Handle interruption
        const interruptMessage = {
          "realtimeInput": {
            "interrupt": true
          }
        };
        
        geminiWs.send(JSON.stringify(interruptMessage));
      }
      
    } catch (error) {
      console.error('Error processing client message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Error processing your request'
      }));
    }
  });
  
  // Handle client disconnect
  ws.on('close', () => {
    console.log('Client disconnected');
    if (geminiWs) {
      geminiWs.close();
    }
    activeSessions.delete(ws);
  });
  
  ws.on('error', (error) => {
    console.error('Client WebSocket error:', error);
    if (geminiWs) {
      geminiWs.close();
    }
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
  
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_api_key_here') {
    console.log('⚠️  Please set your GEMINI_API_KEY in the .env file');
    console.log('   Get your API key from: https://aistudio.google.com');
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down server...');
  wss.clients.forEach((ws) => {
    const geminiWs = activeSessions.get(ws);
    if (geminiWs) {
      geminiWs.close();
    }
    ws.terminate();
  });
  server.close();
});
