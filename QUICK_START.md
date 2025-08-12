# 🚀 Revolt Voice Chat - Quick Start Guide

A real-time voice interface powered by Gemini Live API, designed to replicate the Revolt Motors chatbot experience.

## ⚡ Quick Setup (5 minutes)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Get API Key & Configure
```bash
npm run setup
```
This will guide you through:
1. Getting your API key from [aistudio.google.com](https://aistudio.google.com)
2. Automatically configuring your .env file

### Step 3: Test Connection (Optional but Recommended)
```bash
npm run test-connection
```
Verifies your API key works with Gemini Live API.

### Step 4: Start the Application
```bash
npm start
```

### Step 5: Open in Browser
Visit: `http://localhost:3000`

## 🎙️ How to Use

1. **Allow Microphone**: Browser will ask for microphone permission
2. **Start Talking**: Click the "Start Talking" button
3. **Speak Naturally**: Ask about Revolt Motors, electric bikes, etc.
4. **Listen**: Rev will respond with voice
5. **Interrupt**: Click "Interrupt" if needed during responses

## 🎯 Key Features Demonstrated

- ✅ **Real-time voice conversation**
- ✅ **Low latency responses** (1-2 seconds)
- ✅ **Interruption support** (stop AI mid-sentence)
- ✅ **Revolt Motors focused** (redirects off-topic questions)
- ✅ **Server-to-server architecture**
- ✅ **Visual feedback** (status indicators, volume bars)

## 📋 System Requirements

- Node.js 14+
- Modern browser (Chrome, Firefox, Edge recommended)
- Microphone access
- Stable internet connection
- Valid Gemini API key

## 🏍️ Example Conversations

Try asking Rev:
- "Tell me about Revolt Motors"
- "What electric bikes do you have?"
- "How much does the RV400 cost?"
- "Where can I buy a Revolt bike?"
- "What's special about your AI features?"

## 🛠️ Development Models

| Model | Use Case | Rate Limits |
|-------|----------|-------------|
| `gemini-2.0-flash-live-001` | Development/Testing | Higher limits |
| `gemini-live-2.5-flash-preview` | Development/Testing | Higher limits |
| `gemini-2.5-flash-preview-native-audio-dialog` | Production | Lower limits, better audio |

Change the model in `server-live.js` line 62.

## 🔧 Troubleshooting

### Connection Issues
```bash
npm run test-connection
```

### Audio Issues
- Check microphone permissions in browser
- Try different browser (Chrome recommended)
- Check system audio settings

### API Issues
- Verify API key format: starts with `AIzaSy`
- Check Google AI Studio project status
- Ensure Gemini Live API is enabled

### Rate Limits
- Switch to development model
- Wait and try again
- Check API quota in Google AI Studio

## 📁 Project Structure

```
revolt-voice-chat/
├── server-live.js         # Main server (Gemini Live API)
├── server.js              # Fallback server
├── setup.js               # Interactive API key setup
├── test-connection.js     # API connection tester
├── package.json           # Dependencies & scripts
├── .env                   # Environment variables
├── README.md              # Full documentation
├── QUICK_START.md         # This file
└── public/
    ├── index.html         # Frontend interface
    ├── styles.css         # Styling
    └── app.js             # Frontend logic
```

## 🎬 Demo Video Requirements

Your demo video should show:

1. **Opening the application** in browser
2. **Allowing microphone permissions**
3. **Starting voice conversation** with Rev
4. **Natural back-and-forth dialogue** about Revolt Motors
5. **Interruption functionality** (stop Rev mid-response)
6. **Low latency responses** (1-2 second response time)
7. **Redirect behavior** if asking non-Revolt topics

**Video specs**: 30-60 seconds, screen recording with audio

## 📞 Support Commands

```bash
npm run setup          # Configure API key
npm run test-connection # Test API connectivity  
npm start             # Run main application
npm run old-server    # Fallback server
```

---

**Built with** ❤️ **for the Revolt Motors voice assistant challenge**

Ready to chat with Rev? 🏍️⚡
