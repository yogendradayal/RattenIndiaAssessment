# Revolt Voice Chat - Gemini Live API Implementation

A real-time, conversational voice interface built with the Gemini Live API, replicating the functionality of the Revolt Motors chatbot.

## Features

- **Real-time Voice Interaction**: Seamless voice conversations with AI assistant
- **Native Audio Support**: Uses Gemini's native audio dialog model for natural speech
- **Interruption Support**: Users can interrupt the AI mid-response (built-in with Gemini Live API)
- **Low Latency**: Optimized for quick response times (1-2 seconds benchmark)
- **Server-to-Server Architecture**: Secure backend implementation as required
- **Revolt Motors Context**: AI assistant focused exclusively on electric motorcycles and sustainable transportation
- **Modern UI**: Clean, responsive interface with visual feedback and volume indicators
- **Multi-language Support**: Inherits Gemini's multilingual capabilities
- **Push-to-Talk**: Support for both click and spacebar activation

## Technology Stack

- **Backend**: Node.js, Express.js, WebSocket
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **AI**: Google Gemini Live API
- **Audio**: Web Audio API, MediaRecorder API

## Setup Instructions

### Prerequisites

- Node.js (version 14 or higher)
- NPM or Yarn package manager
- Google AI Studio account
- Modern web browser with microphone access

### Installation

1. **Clone or download the project:**
   ```bash
   git clone <your-repo-url>
   cd revolt-voice-chat
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Get your Gemini API key:**
   - Go to [aistudio.google.com](https://aistudio.google.com)
   - Create or sign in to your account
   - Generate a new API key
   - **Important**: Make sure to enable the Gemini Live API in your project

4. **Configure your API key (choose one option):**
   
   **Option A: Use the setup script (recommended)**
   ```bash
   npm run setup
   ```
   Follow the prompts to enter your API key.
   
   **Option B: Manual configuration**
   - Edit the `.env` file and replace `your_api_key_here` with your actual API key:
   ```env
   GEMINI_API_KEY=AIzaSy...
   PORT=3000
   ```

5. **Start the server:**
   ```bash
   npm start
   ```
   
   This will start the Gemini Live API server. If you encounter issues, try the fallback server:
   ```bash
   npm run old-server
   ```

6. **Access the application:**
   - Open your browser and go to `http://localhost:3000`
   - Allow microphone permissions when prompted
   - Click "Start Talking" and speak about Revolt Motors!

## Usage

1. **Start Conversation**: Click "Start Talking" button or press spacebar
2. **Speak**: Talk naturally about Revolt Motors, electric vehicles, or related topics
3. **Listen**: Wait for Rev (the AI assistant) to respond with audio
4. **Interrupt**: Click "Interrupt" button if you need to stop the AI and speak
5. **Continue**: The conversation flows naturally with context awareness

## API Configuration

### Development vs Production Models

- **Development**: `gemini-2.0-flash-live-001` or `gemini-live-2.5-flash-preview` (fewer rate limits)
- **Production**: `gemini-2.5-flash-preview-native-audio-dialog` (better audio quality)

Change the model in `server.js`:
```javascript
const model = 'gemini-2.0-flash-live-001'; // Change this line
```

## System Instructions

The AI is configured with specific instructions to only discuss:
- Revolt Motors and their products
- Electric vehicles and motorcycles
- Sustainable transportation
- Related automotive technology

If asked about unrelated topics, the AI will politely redirect the conversation.

## Architecture

### Server-to-Server Implementation

- WebSocket connection between browser and Node.js server
- Server maintains persistent connection to Gemini Live API
- Audio data flows: Browser → Server → Gemini → Server → Browser
- Secure API key handling on backend only

### Audio Processing

- **Input**: Browser captures audio at 16kHz PCM
- **Processing**: Server converts and streams to Gemini API
- **Output**: Gemini returns audio data streamed back to browser
- **Playback**: Web Audio API for low-latency playback

## Troubleshooting

### Common Issues

1. **Microphone Access Denied**
   - Check browser permissions
   - Use HTTPS for production deployments

2. **API Rate Limits**
   - Switch to development model for testing
   - Check your Google AI Studio quota

3. **Audio Quality Issues**
   - Ensure stable internet connection
   - Check microphone quality and placement

4. **Connection Failures**
   - Verify API key is correct
   - Check firewall/network restrictions

### Browser Compatibility

- Chrome/Chromium: Full support
- Firefox: Full support
- Safari: Limited support (check Web Audio API compatibility)
- Edge: Full support

## Development

### File Structure

```
revolt-voice-chat/
├── server.js              # Main Express server with WebSocket
├── package.json           # Project dependencies and scripts
├── .env                   # Environment variables
├── README.md             # This file
└── public/
    ├── index.html        # Main HTML interface
    ├── styles.css        # CSS styles
    └── app.js            # Frontend JavaScript
```

### Key Components

- **VoiceChat Class**: Frontend audio handling and WebSocket communication
- **WebSocket Handler**: Server-side Gemini API integration
- **Audio Processing**: Real-time PCM conversion and streaming

## Performance Optimization

- Efficient audio buffering and streaming
- Minimal latency WebSocket implementation
- Optimized audio format conversion
- Smart connection management with auto-reconnection

## Security

- API keys stored securely on server-side
- No sensitive data transmitted to client
- CORS protection enabled
- WebSocket connection validation

## License

ISC License - see package.json for details

## Support

For issues and questions:
1. Check the troubleshooting section above
2. Review Gemini Live API documentation
3. Check browser console for error messages

---

**Demo**: Create a 30-60 second screen recording showing:
- Natural conversation flow
- Interruption functionality working
- Low latency responses
- Overall user experience
