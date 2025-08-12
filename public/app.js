class VoiceChat {
    constructor() {
        this.ws = null;
        this.mediaRecorder = null;
        this.audioContext = null;
        this.isRecording = false;
        this.isConnected = false;
        this.audioQueue = [];
        this.isPlaying = false;
        
        this.initializeElements();
        this.setupEventListeners();
        this.connect();
    }

    initializeElements() {
        this.voiceBtn = document.getElementById('voiceBtn');
        this.interruptBtn = document.getElementById('interruptBtn');
        this.statusDot = document.getElementById('statusDot');
        this.statusText = document.getElementById('statusText');
        this.btnText = document.getElementById('btnText');
        this.transcript = document.getElementById('transcript');
        this.volumeIndicator = document.getElementById('volumeIndicator');
    }

    setupEventListeners() {
        this.voiceBtn.addEventListener('click', () => this.toggleRecording());
        this.interruptBtn.addEventListener('click', () => this.interrupt());
        
        // Handle space bar for push-to-talk
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !this.isRecording) {
                e.preventDefault();
                this.startRecording();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            if (e.code === 'Space' && this.isRecording) {
                e.preventDefault();
                this.stopRecording();
            }
        });
    }

    async connect() {
        try {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${protocol}//${window.location.host}`;
            
            this.ws = new WebSocket(wsUrl);
            
            this.ws.onopen = () => {
                console.log('Connected to server');
                this.isConnected = true;
                this.updateStatus('connected', 'Connected - Ready to chat');
                this.voiceBtn.disabled = false;
                this.voiceBtn.classList.remove('disabled');
            };
            
            this.ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleServerMessage(data);
            };
            
            this.ws.onclose = () => {
                console.log('Disconnected from server');
                this.isConnected = false;
                this.updateStatus('disconnected', 'Disconnected - Click to reconnect');
                this.voiceBtn.disabled = true;
                this.voiceBtn.classList.add('disabled');
                
                // Attempt to reconnect after 3 seconds
                setTimeout(() => this.connect(), 3000);
            };
            
            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.addTranscriptMessage('Connection error occurred', 'error');
            };
            
        } catch (error) {
            console.error('Failed to connect:', error);
            this.updateStatus('disconnected', 'Connection failed');
        }
    }

    async handleServerMessage(data) {
        switch (data.type) {
            case 'session_started':
                this.addTranscriptMessage(data.message, 'system');
                break;
                
            case 'audio_response':
                await this.playAudioResponse(data.data, data.mimeType);
                break;
                
            case 'text_response':
                this.addTranscriptMessage(data.text, 'assistant');
                break;
                
            case 'transcript':
                this.addTranscriptMessage(`You: ${data.text}`, 'user');
                break;
                
            case 'audio_simulation':
                this.simulateAudioPlayback(data.text, data.duration);
                break;
                
            case 'interrupted':
                this.addTranscriptMessage('[Interrupted]', 'system');
                break;
                
            case 'error':
                this.addTranscriptMessage(data.message, 'error');
                break;
                
            default:
                console.log('Unknown message type:', data.type);
        }
    }

    async playAudioResponse(audioData, mimeType = 'audio/pcm') {
        try {
            // Initialize audio context if needed
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            
            // Resume audio context if suspended (required by some browsers)
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            // Stop any currently playing audio
            if (this.currentAudioSource) {
                this.currentAudioSource.stop();
                this.currentAudioSource = null;
            }
            
            let audioBuffer;
            
            if (mimeType.includes('pcm')) {
                // Handle base64 encoded PCM data from Gemini
                const binaryData = typeof audioData === 'string' ? 
                    Uint8Array.from(atob(audioData), c => c.charCodeAt(0)) :
                    new Uint8Array(audioData);
                    
                // Convert PCM to AudioBuffer
                audioBuffer = await this.createAudioBufferFromPCM(binaryData);
            } else {
                // Handle other audio formats
                const audioBlob = new Blob([new Uint8Array(audioData)], { type: mimeType });
                const arrayBuffer = await audioBlob.arrayBuffer();
                audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            }
            
            if (audioBuffer) {
                // Create and configure audio source
                const source = this.audioContext.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(this.audioContext.destination);
                this.currentAudioSource = source;
                
                this.updateStatus('speaking', 'Rev is speaking...');
                this.interruptBtn.disabled = false;
                this.isPlaying = true;
                
                source.onended = () => {
                    this.updateStatus('connected', 'Ready to chat');
                    this.interruptBtn.disabled = true;
                    this.isPlaying = false;
                    this.currentAudioSource = null;
                };
                
                source.start(0);
            }
            
        } catch (error) {
            console.error('Error playing audio:', error);
            // Fallback: continue without audio playback
            this.updateStatus('connected', 'Ready to chat');
            this.interruptBtn.disabled = true;
            this.isPlaying = false;
            this.currentAudioSource = null;
        }
    }

    async toggleRecording() {
        if (!this.isConnected) {
            this.connect();
            return;
        }
        
        if (this.isRecording) {
            this.stopRecording();
        } else {
            this.startRecording();
        }
    }

    async startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    sampleRate: 16000,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true
                }
            });
            
            this.mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm'
            });
            
            const audioChunks = [];
            
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunks.push(event.data);
                }
            };
            
            this.mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                await this.sendAudioToServer(audioBlob);
                
                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            };
            
            this.mediaRecorder.start(100); // Collect data every 100ms
            this.isRecording = true;
            
            this.updateStatus('listening', 'Listening...');
            this.btnText.textContent = 'Stop Recording';
            this.voiceBtn.classList.add('listening');
            this.volumeIndicator.classList.add('active');
            
            // Add visual feedback for volume
            this.setupVolumeVisualization(stream);
            
        } catch (error) {
            console.error('Error starting recording:', error);
            this.addTranscriptMessage('Microphone access denied or not available', 'error');
        }
    }

    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
            
            this.updateStatus('connected', 'Processing...');
            this.btnText.textContent = 'Start Talking';
            this.voiceBtn.classList.remove('listening');
            this.volumeIndicator.classList.remove('active');
        }
    }

    async sendAudioToServer(audioBlob) {
        try {
            // Convert blob to PCM format for Gemini API
            const arrayBuffer = await audioBlob.arrayBuffer();
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            
            // Convert to 16-bit PCM at 16kHz
            const pcmData = this.convertToPCM16(audioBuffer);
            
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({
                    type: 'audio_input',
                    audio: Array.from(pcmData)
                }));
                
                this.addTranscriptMessage('[Audio sent to Rev - Processing voice...]', 'user');
                this.updateStatus('connected', 'Processing your voice...');
            }
            
        } catch (error) {
            console.error('Error sending audio:', error);
            this.addTranscriptMessage('Error sending audio', 'error');
        }
    }

    async createAudioBufferFromPCM(pcmData) {
        try {
            // Assume 16-bit PCM, 16kHz, mono
            const sampleRate = 16000;
            const channels = 1;
            const bytesPerSample = 2; // 16-bit = 2 bytes
            
            const numSamples = pcmData.length / bytesPerSample;
            const audioBuffer = this.audioContext.createBuffer(channels, numSamples, sampleRate);
            
            const channelData = audioBuffer.getChannelData(0);
            
            // Convert 16-bit PCM to float values
            for (let i = 0; i < numSamples; i++) {
                const sample = (pcmData[i * 2] | (pcmData[i * 2 + 1] << 8));
                // Convert from signed 16-bit to float (-1.0 to 1.0)
                channelData[i] = sample < 0x8000 ? sample / 0x8000 : (sample - 0x10000) / 0x8000;
            }
            
            return audioBuffer;
        } catch (error) {
            console.error('Error creating audio buffer from PCM:', error);
            return null;
        }
    }

    convertToPCM16(audioBuffer) {
        const inputData = audioBuffer.getChannelData(0);
        const targetSampleRate = 16000;
        const sourceSampleRate = audioBuffer.sampleRate;
        
        // Resample if necessary
        let resampledData;
        if (sourceSampleRate !== targetSampleRate) {
            const ratio = sourceSampleRate / targetSampleRate;
            const newLength = Math.round(inputData.length / ratio);
            resampledData = new Float32Array(newLength);
            
            for (let i = 0; i < newLength; i++) {
                const sourceIndex = Math.round(i * ratio);
                resampledData[i] = inputData[sourceIndex];
            }
        } else {
            resampledData = inputData;
        }
        
        // Convert to 16-bit PCM
        const pcmData = new Int16Array(resampledData.length);
        for (let i = 0; i < resampledData.length; i++) {
            const clampedValue = Math.max(-1, Math.min(1, resampledData[i]));
            pcmData[i] = Math.round(clampedValue * 32767);
        }
        
        return new Uint8Array(pcmData.buffer);
    }

    setupVolumeVisualization(stream) {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);
        
        source.connect(analyser);
        analyser.fftSize = 256;
        
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const volumeBars = document.querySelectorAll('.volume-bar');
        
        const updateVolume = () => {
            if (!this.isRecording) return;
            
            analyser.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
            
            volumeBars.forEach((bar, index) => {
                const height = Math.max(5, (average / 255) * 30 + Math.random() * 10);
                bar.style.height = `${height}px`;
            });
            
            requestAnimationFrame(updateVolume);
        };
        
        updateVolume();
    }

    showDemoTextInput(message) {
        // Create inline text input for demo mode (no popup)
        this.addTranscriptMessage(message, 'system');
        
        // Create input interface
        const inputContainer = document.createElement('div');
        inputContainer.className = 'demo-input-container';
        inputContainer.innerHTML = `
            <div class="demo-input-wrapper">
                <h3>🎙️ Voice Input Simulation</h3>
                <p>What would you like to ask about Revolt Motors?</p>
                <div class="demo-examples">
                    <small>Try: "Tell me about RV400" • "What is the charging time?" • "How does the app work?"</small>
                </div>
                <input type="text" id="demoTextInput" placeholder="Type your question here..." class="demo-text-input">
                <div class="demo-buttons">
                    <button id="demoSubmit" class="demo-submit-btn">Ask Rev</button>
                    <button id="demoCancel" class="demo-cancel-btn">Cancel</button>
                </div>
            </div>
        `;
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .demo-input-container {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
            }
            .demo-input-wrapper {
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
                padding: 30px;
                border-radius: 15px;
                border: 1px solid rgba(255, 255, 255, 0.2);
                max-width: 500px;
                width: 90%;
                text-align: center;
                color: white;
            }
            .demo-input-wrapper h3 {
                margin: 0 0 15px 0;
                color: #00d2ff;
                font-size: 1.3rem;
            }
            .demo-input-wrapper p {
                margin: 0 0 20px 0;
                color: #e0e6ed;
            }
            .demo-examples {
                background: rgba(255, 255, 255, 0.1);
                padding: 10px;
                border-radius: 8px;
                margin-bottom: 20px;
            }
            .demo-examples small {
                color: #a0a8b8;
                font-style: italic;
            }
            .demo-text-input {
                width: 100%;
                padding: 12px 15px;
                border: 2px solid rgba(255, 255, 255, 0.2);
                border-radius: 8px;
                background: rgba(255, 255, 255, 0.1);
                color: white;
                font-size: 1rem;
                margin-bottom: 20px;
                box-sizing: border-box;
            }
            .demo-text-input:focus {
                outline: none;
                border-color: #00d2ff;
                background: rgba(255, 255, 255, 0.15);
            }
            .demo-text-input::placeholder {
                color: #a0a8b8;
            }
            .demo-buttons {
                display: flex;
                gap: 15px;
                justify-content: center;
            }
            .demo-submit-btn, .demo-cancel-btn {
                padding: 10px 20px;
                border: none;
                border-radius: 8px;
                font-size: 1rem;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            .demo-submit-btn {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
            }
            .demo-submit-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
            }
            .demo-cancel-btn {
                background: #555;
                color: white;
            }
            .demo-cancel-btn:hover {
                background: #666;
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(inputContainer);
        
        const textInput = document.getElementById('demoTextInput');
        const submitBtn = document.getElementById('demoSubmit');
        const cancelBtn = document.getElementById('demoCancel');
        
        // Focus the input
        setTimeout(() => textInput.focus(), 100);
        
        // Handle submit
        const submitHandler = () => {
            const inputValue = textInput.value.trim();
            if (inputValue) {
                // Send the demo text input
                if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                    this.ws.send(JSON.stringify({
                        type: 'demo_text_input',
                        text: inputValue
                    }));
                }
                // Remove the input interface
                document.body.removeChild(inputContainer);
                document.head.removeChild(style);
            }
        };
        
        // Handle cancel
        const cancelHandler = () => {
            this.updateStatus('connected', 'Ready to chat');
            this.addTranscriptMessage('Demo cancelled - click "Start Talking" to try again', 'system');
            document.body.removeChild(inputContainer);
            document.head.removeChild(style);
        };
        
        // Event listeners
        submitBtn.addEventListener('click', submitHandler);
        cancelBtn.addEventListener('click', cancelHandler);
        textInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                submitHandler();
            }
        });
    }

    simulateAudioPlayback(text, duration) {
        // Simulate audio playback for demo mode
        this.updateStatus('speaking', 'Rev is speaking (Demo)...');
        this.interruptBtn.disabled = false;
        this.isPlaying = true;
        
        // Simulate speaking time
        setTimeout(() => {
            if (this.isPlaying) {
                this.updateStatus('connected', 'Ready to chat');
                this.interruptBtn.disabled = true;
                this.isPlaying = false;
            }
        }, duration);
    }

    interrupt() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN && this.isPlaying) {
            this.ws.send(JSON.stringify({
                type: 'interrupt'
            }));
            
            this.updateStatus('connected', 'Interrupted - Ready to chat');
            this.interruptBtn.disabled = true;
            this.isPlaying = false;
            
            this.addTranscriptMessage('[Interrupted Rev]', 'user');
        }
    }

    updateStatus(status, text) {
        this.statusDot.className = `status-dot ${status}`;
        this.statusText.textContent = text;
    }

    addTranscriptMessage(message, type = 'system') {
        const messageElement = document.createElement('div');
        messageElement.className = `transcript-message ${type}`;
        messageElement.textContent = message;
        
        this.transcript.appendChild(messageElement);
        this.transcript.scrollTop = this.transcript.scrollHeight;
        
        // Limit transcript to last 50 messages
        const messages = this.transcript.querySelectorAll('.transcript-message');
        if (messages.length > 50) {
            messages[0].remove();
        }
    }
}

// Initialize the voice chat when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new VoiceChat();
});
