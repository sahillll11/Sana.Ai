/**
 * Sana Mobile App - Voice Recognition Module
 * Handles voice recognition and speech synthesis for mobile devices
 */

class MobileVoiceRecognition {
    constructor(app) {
        this.app = app;
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        this.isListening = false;
        this.isContinuous = false;
        this.voices = [];
        
        this.init();
    }

    init() {
        this.setupSpeechRecognition();
        this.setupSpeechSynthesis();
        this.setupVoiceCommands();
    }

    setupSpeechRecognition() {
        // Check browser and security requirements
        if (!this.checkBrowserCompatibility()) {
            return;
        }

        // Check for speech recognition support
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            console.warn('Speech recognition not supported');
            this.showBrowserCompatibilityMessage();
            return;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';
        this.recognition.maxAlternatives = 1;

        // Event listeners
        this.recognition.onstart = () => {
            console.log('Voice recognition started');
            this.isListening = true;
            this.showVoiceInterface();
            this.updateVoiceStatus('Listening...');
            this.animateVoiceWaves(true);
            this.showListeningAvatar(); // Show listening state avatar
        };

        this.recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }

            // Update UI with interim results
            if (interimTranscript) {
                this.updateVoiceCommand(interimTranscript);
            }

            // Process final result
            if (finalTranscript) {
                this.updateVoiceCommand(finalTranscript);
                this.processVoiceCommand(finalTranscript.trim());
            }
        };

        this.recognition.onerror = (event) => {
            console.error('Voice recognition error:', event.error);
            this.handleVoiceError(event.error);
        };

        this.recognition.onend = () => {
            console.log('Voice recognition ended');
            this.isListening = false;
            this.animateVoiceWaves(false);
            this.hideListeningAvatar(); // Hide listening state avatar

            if (this.isContinuous && this.app.settings.continuousMode) {
                // Restart recognition in continuous mode
                setTimeout(() => {
                    if (this.isContinuous) {
                        this.startRecognition();
                    }
                }, 1000);
            } else {
                this.hideVoiceInterface();
            }
        };
    }

    setupSpeechSynthesis() {
        // Load available voices
        this.loadVoices();
        
        // Update voices when they change
        if (this.synthesis.onvoiceschanged !== undefined) {
            this.synthesis.onvoiceschanged = () => {
                this.loadVoices();
            };
        }
    }

    loadVoices() {
        this.voices = this.synthesis.getVoices();
        console.log('Available voices:', this.voices.length);
        
        // Prefer English voices
        this.selectedVoice = this.voices.find(voice => 
            voice.lang.startsWith('en') && voice.name.includes('Female')
        ) || this.voices.find(voice => 
            voice.lang.startsWith('en')
        ) || this.voices[0];
    }

    setupVoiceCommands() {
        this.voiceCommands = {
            // Image generation
            image: {
                patterns: [
                    /generate image of (.+)/i,
                    /create picture of (.+)/i,
                    /make image of (.+)/i,
                    /draw (.+)/i
                ],
                action: (match) => this.handleImageCommand(match[1])
            },
            
            // WhatsApp
            whatsapp: {
                patterns: [
                    /send message to (.+)/i,
                    /message (.+)/i,
                    /call (.+)/i,
                    /phone (.+)/i
                ],
                action: (match) => this.handleWhatsAppCommand(match[1])
            },
            
            // System commands
            system: {
                patterns: [
                    /stop listening/i,
                    /stop sana/i,
                    /exit/i,
                    /close/i
                ],
                action: () => this.stopRecognition()
            },
            
            // Time and date
            time: {
                patterns: [
                    /what time is it/i,
                    /current time/i,
                    /time/i
                ],
                action: () => this.handleTimeCommand()
            },
            
            date: {
                patterns: [
                    /what date is it/i,
                    /current date/i,
                    /today's date/i
                ],
                action: () => this.handleDateCommand()
            }
        };
    }

    startRecognition() {
        console.log('🎤 Starting voice recognition...');

        if (!this.recognition) {
            console.error('❌ Speech recognition not supported');
            this.app.showMessage('Voice recognition is not supported on this device. Please use a modern browser like Chrome or Safari.', 'system');
            return;
        }

        if (this.isListening) {
            console.log('🛑 Already listening, stopping...');
            this.stopRecognition();
            return;
        }

        // Check for microphone access with multiple fallbacks
        this.requestMicrophoneAccess()
            .then(() => {
                console.log('✅ Microphone permission granted');
                try {
                    this.recognition.start();
                    console.log('🎤 Voice recognition started');
                    this.updateVoiceButton(true);
                } catch (error) {
                    console.error('❌ Error starting recognition:', error);
                    this.app.showMessage('Error starting voice recognition. Please try again.', 'system');
                }
            })
            .catch((error) => {
                console.error('❌ Microphone access failed:', error);
                this.handleMicrophoneError(error);
            });
    }

    async requestMicrophoneAccess() {
        console.log('🎤 Requesting microphone access...');

        // Check if getUserMedia is available
        if (!this.isGetUserMediaSupported()) {
            throw new Error('getUserMedia not supported');
        }

        try {
            // Try modern API first
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                console.log('📱 Using modern getUserMedia API');
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                // Stop the stream immediately as we just needed permission
                stream.getTracks().forEach(track => track.stop());
                return true;
            }

            // Fallback to older API
            if (navigator.getUserMedia) {
                console.log('📱 Using legacy getUserMedia API');
                return new Promise((resolve, reject) => {
                    navigator.getUserMedia(
                        { audio: true },
                        (stream) => {
                            // Stop the stream immediately
                            stream.getTracks().forEach(track => track.stop());
                            resolve(true);
                        },
                        (error) => reject(error)
                    );
                });
            }

            throw new Error('No getUserMedia API available');

        } catch (error) {
            console.error('❌ getUserMedia error:', error);
            throw error;
        }
    }

    isGetUserMediaSupported() {
        // Check for modern API
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            return true;
        }

        // Check for legacy APIs
        navigator.getUserMedia = navigator.getUserMedia ||
                                 navigator.webkitGetUserMedia ||
                                 navigator.mozGetUserMedia ||
                                 navigator.msGetUserMedia;

        return !!navigator.getUserMedia;
    }

    handleMicrophoneError(error) {
        let message = 'Microphone access failed. ';
        let suggestion = '';

        if (error.name === 'NotAllowedError' || error.message.includes('Permission denied')) {
            message = 'Microphone permission denied. ';
            suggestion = 'Please allow microphone access in your browser settings and try again.';
        } else if (error.name === 'NotFoundError') {
            message = 'No microphone found. ';
            suggestion = 'Please check that your device has a microphone.';
        } else if (error.name === 'NotSupportedError' || error.message.includes('not supported')) {
            message = 'Voice recognition not supported. ';
            suggestion = 'Please use Chrome or Safari browser for voice features.';
        } else if (error.message.includes('getUserMedia')) {
            message = 'Browser compatibility issue. ';
            suggestion = 'Please try using Chrome or Safari browser, or try the text input instead.';
        } else {
            message = 'Voice recognition error occurred. ';
            suggestion = 'Please try again or use text input.';
        }

        this.app.showMessage(message + suggestion, 'system');

        // Show alternative input method
        this.showAlternativeInput();
    }

    showAlternativeInput() {
        const alternativeMessage = `
            <div class="alternative-input">
                <h4>🎤 Voice Recognition Unavailable</h4>
                <p>You can still use Sana with text input!</p>
                <div class="input-suggestion">
                    <p>💬 Try typing: "Hello Sana" or "Generate image of a cat"</p>
                </div>
            </div>
        `;

        setTimeout(() => {
            this.app.showMessage(alternativeMessage, 'system');
        }, 2000);
    }

    checkBrowserCompatibility() {
        console.log('🔍 Checking browser compatibility...');

        // Get detailed browser info
        const userAgent = navigator.userAgent.toLowerCase();
        const browserInfo = this.getBrowserInfo();

        console.log(`🌐 Browser: ${browserInfo.name} ${browserInfo.version}`);
        console.log(`📱 Platform: ${browserInfo.platform}`);
        console.log(`🔒 Secure Context: ${window.isSecureContext}`);
        console.log(`🌐 Protocol: ${location.protocol}`);

        // Check if we're in a secure context (HTTPS or localhost)
        const isSecureContext = window.isSecureContext ||
                               location.protocol === 'https:' ||
                               location.hostname === 'localhost' ||
                               location.hostname === '127.0.0.1' ||
                               location.hostname.includes('192.168.') ||
                               location.hostname.includes('10.0.') ||
                               location.hostname.includes('172.16.');

        // For mobile Chrome, try even without HTTPS
        const isMobileChrome = browserInfo.name === 'Chrome' && browserInfo.isMobile;
        const isDesktopChrome = browserInfo.name === 'Chrome' && !browserInfo.isMobile;

        if (!isSecureContext && !isMobileChrome) {
            console.warn('⚠️ Not in secure context');
            this.showSecurityWarning();
            // Still try to continue for testing
        }

        // Check browser support with more detailed detection
        if (browserInfo.name === 'Chrome' || browserInfo.name === 'Edge') {
            console.log('✅ Excellent browser support for voice recognition');
            return true;
        } else if (browserInfo.name === 'Safari') {
            console.log('✅ Good browser support for voice recognition');
            return true;
        } else if (browserInfo.name === 'Firefox') {
            console.warn('⚠️ Limited browser support for voice recognition');
            this.showBrowserWarning();
            return true; // Still try
        } else {
            console.warn('⚠️ Unknown browser, attempting voice recognition anyway');
            this.showBrowserWarning();
            return true; // Still try
        }
    }

    getBrowserInfo() {
        const userAgent = navigator.userAgent.toLowerCase();
        const platform = navigator.platform.toLowerCase();

        let name = 'Unknown';
        let version = 'Unknown';
        let isMobile = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);

        if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
            name = 'Chrome';
            const match = userAgent.match(/chrome\/(\d+)/);
            version = match ? match[1] : 'Unknown';
        } else if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
            name = 'Safari';
            const match = userAgent.match(/version\/(\d+)/);
            version = match ? match[1] : 'Unknown';
        } else if (userAgent.includes('edg')) {
            name = 'Edge';
            const match = userAgent.match(/edg\/(\d+)/);
            version = match ? match[1] : 'Unknown';
        } else if (userAgent.includes('firefox')) {
            name = 'Firefox';
            const match = userAgent.match(/firefox\/(\d+)/);
            version = match ? match[1] : 'Unknown';
        }

        return {
            name,
            version,
            isMobile,
            platform: platform.includes('win') ? 'Windows' :
                     platform.includes('mac') ? 'macOS' :
                     platform.includes('linux') ? 'Linux' :
                     isMobile ? 'Mobile' : 'Unknown'
        };
    }

    getBrowserName() {
        const userAgent = navigator.userAgent.toLowerCase();
        if (userAgent.includes('chrome') && !userAgent.includes('edg')) return 'Chrome';
        if (userAgent.includes('safari') && !userAgent.includes('chrome')) return 'Safari';
        if (userAgent.includes('edg')) return 'Edge';
        if (userAgent.includes('firefox')) return 'Firefox';
        if (userAgent.includes('opera')) return 'Opera';
        return 'Unknown';
    }

    showSecurityWarning() {
        const securityMessage = `
            <div class="security-warning">
                <h4>🔒 Security Requirements</h4>
                <p>Voice recognition requires a secure connection (HTTPS).</p>
                <div class="security-info">
                    <p><strong>Current:</strong> ${location.protocol}//${location.host}</p>
                    <p><strong>Required:</strong> HTTPS connection</p>
                </div>
                <div class="security-solutions">
                    <h5>Solutions:</h5>
                    <ul>
                        <li>Use HTTPS version of this site</li>
                        <li>Access via localhost for testing</li>
                        <li>Use text input instead</li>
                    </ul>
                </div>
            </div>
        `;

        this.app.showMessage(securityMessage, 'system');
    }

    showBrowserWarning() {
        const browserMessage = `
            <div class="browser-warning">
                <h4>🌐 Browser Compatibility</h4>
                <p>Voice recognition works best in Chrome or Safari.</p>
                <div class="browser-info">
                    <p><strong>Current:</strong> ${this.getBrowserName()}</p>
                    <p><strong>Recommended:</strong> Chrome, Safari, or Edge</p>
                </div>
                <div class="browser-note">
                    <p>Voice features may be limited in your current browser.</p>
                </div>
            </div>
        `;

        this.app.showMessage(browserMessage, 'system');
    }

    showBrowserCompatibilityMessage() {
        const compatMessage = `
            <div class="compatibility-message">
                <h4>🎤 Voice Recognition Unavailable</h4>
                <p>Your browser doesn't support voice recognition.</p>
                <div class="compatibility-info">
                    <h5>Supported Browsers:</h5>
                    <ul>
                        <li>✅ Chrome (Android/Desktop)</li>
                        <li>✅ Safari (iOS/macOS)</li>
                        <li>✅ Edge (Desktop)</li>
                        <li>❌ Firefox (Limited support)</li>
                    </ul>
                </div>
                <div class="alternative-options">
                    <p>💬 You can still use text input to chat with Sana!</p>
                </div>
            </div>
        `;

        this.app.showMessage(compatMessage, 'system');
    }

    stopRecognition() {
        if (this.recognition && this.isListening) {
            this.isContinuous = false;
            this.recognition.stop();
            this.updateVoiceButton(false);
            this.hideVoiceInterface();
        }
    }

    toggleContinuousMode() {
        this.isContinuous = !this.isContinuous;
        
        if (this.isContinuous) {
            this.startRecognition();
            this.app.showMessage('Continuous voice mode activated. Say "stop listening" to exit.', 'system');
        } else {
            this.stopRecognition();
            this.app.showMessage('Continuous voice mode deactivated.', 'system');
        }
    }

    processVoiceCommand(command) {
        console.log('🎤 Processing voice command:', command);

        // Show what user said
        this.app.showMessage(`You said: "${command}"`, 'user');

        // Check for specific voice commands first
        for (const [category, config] of Object.entries(this.voiceCommands)) {
            for (const pattern of config.patterns) {
                const match = command.match(pattern);
                if (match) {
                    console.log(`✅ Matched ${category} command`);
                    config.action(match);
                    return;
                }
            }
        }

        // If no specific command matched, send to AI for processing
        console.log('🤖 Sending to AI for processing...');
        this.sendToAI(command);
    }

    async sendToAI(command) {
        try {
            console.log(`🤖 Sending voice command to AI: "${command}"`);

            // Show processing message
            this.app.showMessage('🤖 Processing your request...', 'assistant');

            // Send to chat API
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: command
                })
            });

            const data = await response.json();

            if (data.response) {
                // Show AI response
                this.app.showMessage(data.response, 'assistant');

                // Speak the response
                this.speak(data.response);

                console.log('✅ AI response received and displayed');
            } else {
                throw new Error(data.error || 'No response from AI');
            }

        } catch (error) {
            console.error('❌ Error sending to AI:', error);
            const errorMessage = `Sorry, I couldn't process that. ${error.message}`;
            this.app.showMessage(errorMessage, 'system');
            this.speak(errorMessage);
        }
    }

    handleImageCommand(description) {
        this.speak(`Generating image of ${description}`);
        this.app.showMessage(`Voice command: Generate image of ${description}`, 'user');
        // Trigger image generation
        if (this.app.imageGenerator) {
            this.app.imageGenerator.generateImage(description);
        }
    }

    handleWhatsAppCommand(contact) {
        this.speak(`Opening WhatsApp for ${contact}`);
        this.app.showMessage(`Voice command: Message ${contact}`, 'user');
        // Trigger WhatsApp integration
        if (this.app.whatsappIntegration) {
            this.app.whatsappIntegration.openChat(contact);
        }
    }

    handleTimeCommand() {
        const time = new Date().toLocaleTimeString();
        const message = `The current time is ${time}`;
        this.speak(message);
        this.app.showMessage(message, 'assistant');
    }

    handleDateCommand() {
        const date = new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const message = `Today is ${date}`;
        this.speak(message);
        this.app.showMessage(message, 'assistant');
    }

    speak(text) {
        console.log('🔊 Speaking:', text);

        // Always speak, regardless of settings for voice responses
        if (!text || text.trim() === '') {
            console.warn('⚠️ Empty text provided to speak function');
            return;
        }

        // Cancel any ongoing speech
        this.synthesis.cancel();

        // Clean text for better speech
        const cleanText = text.replace(/[🤖💬✅❌⚠️🎤🔊]/g, '').trim();

        const utterance = new SpeechSynthesisUtterance(cleanText);

        // Use selected voice or find a good default
        if (this.selectedVoice) {
            utterance.voice = this.selectedVoice;
        } else {
            // Find a good English voice
            const voices = this.synthesis.getVoices();
            const englishVoice = voices.find(voice =>
                voice.lang.startsWith('en') &&
                (voice.name.includes('Female') || voice.name.includes('Google'))
            ) || voices.find(voice => voice.lang.startsWith('en')) || voices[0];

            if (englishVoice) {
                utterance.voice = englishVoice;
                this.selectedVoice = englishVoice;
            }
        }

        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.volume = 0.9;

        utterance.onstart = () => {
            console.log('🔊 Speech started:', cleanText.substring(0, 50) + '...');
        };

        utterance.onend = () => {
            console.log('✅ Speech ended');
        };

        utterance.onerror = (error) => {
            console.error('❌ Speech error:', error);
        };

        // Ensure speech synthesis is ready
        if (this.synthesis.speaking) {
            this.synthesis.cancel();
            setTimeout(() => {
                this.synthesis.speak(utterance);
            }, 100);
        } else {
            this.synthesis.speak(utterance);
        }

        console.log('🔊 Speech utterance queued');
    }

    showVoiceInterface() {
        const chatContainer = document.getElementById('chatContainer');
        const voiceContainer = document.getElementById('voiceContainer');
        
        chatContainer.style.display = 'none';
        voiceContainer.style.display = 'flex';
        voiceContainer.classList.add('animate-fadeInUp');
    }

    hideVoiceInterface() {
        const chatContainer = document.getElementById('chatContainer');
        const voiceContainer = document.getElementById('voiceContainer');

        voiceContainer.style.display = 'none';
        chatContainer.style.display = 'block';
        chatContainer.classList.add('animate-fadeInUp');
        this.hideListeningAvatar(); // Ensure listening avatar is hidden
    }

    showListeningAvatar() {
        try {
            // Get current avatar type from settings
            const avatarType = this.app.settings.avatarType || 'girl';

            // Find the main avatar image
            const mainAvatar = document.querySelector('.sana-avatar img');
            if (mainAvatar) {
                // Store original avatar source
                if (!mainAvatar.dataset.originalSrc) {
                    mainAvatar.dataset.originalSrc = mainAvatar.src;
                }

                // Switch to listening avatar
                mainAvatar.src = `/api/sana/avatar/listening/${avatarType}`;
                mainAvatar.classList.add('listening-mode');

                console.log(`🎤 Switched to listening avatar: ${avatarType}`);
            }

            // Add listening effects to the avatar container
            const avatarContainer = document.querySelector('.sana-avatar');
            if (avatarContainer) {
                avatarContainer.classList.add('listening-active');
            }

        } catch (error) {
            console.error('Error showing listening avatar:', error);
        }
    }

    hideListeningAvatar() {
        try {
            // Find the main avatar image
            const mainAvatar = document.querySelector('.sana-avatar img');
            if (mainAvatar && mainAvatar.dataset.originalSrc) {
                // Restore original avatar
                mainAvatar.src = mainAvatar.dataset.originalSrc;
                mainAvatar.classList.remove('listening-mode');

                console.log('🔇 Restored normal avatar');
            }

            // Remove listening effects from the avatar container
            const avatarContainer = document.querySelector('.sana-avatar');
            if (avatarContainer) {
                avatarContainer.classList.remove('listening-active');
            }

        } catch (error) {
            console.error('Error hiding listening avatar:', error);
        }
    }

    updateVoiceStatus(status) {
        const voiceStatus = document.getElementById('voiceStatus');
        if (voiceStatus) {
            voiceStatus.textContent = status;
        }
    }

    updateVoiceCommand(command) {
        const voiceCommand = document.getElementById('voiceCommand');
        if (voiceCommand) {
            voiceCommand.textContent = command;
        }
    }

    updateVoiceButton(active) {
        const voiceBtn = document.getElementById('voiceBtn');
        if (voiceBtn) {
            if (active) {
                voiceBtn.classList.add('active');
                voiceBtn.innerHTML = '<i class="fas fa-stop"></i><span>Stop</span>';
            } else {
                voiceBtn.classList.remove('active');
                voiceBtn.innerHTML = '<i class="fas fa-microphone"></i><span>Voice</span>';
            }
        }
    }

    animateVoiceWaves(active) {
        const waves = document.querySelectorAll('.voice-wave');
        waves.forEach(wave => {
            if (active) {
                wave.style.animationPlayState = 'running';
            } else {
                wave.style.animationPlayState = 'paused';
            }
        });
    }

    handleVoiceError(error) {
        let message = 'Voice recognition error occurred.';
        
        switch (error) {
            case 'no-speech':
                message = 'No speech detected. Please try again.';
                break;
            case 'audio-capture':
                message = 'Microphone not accessible. Please check permissions.';
                break;
            case 'not-allowed':
                message = 'Microphone access denied. Please enable microphone permissions.';
                break;
            case 'network':
                message = 'Network error. Please check your internet connection.';
                break;
            case 'aborted':
                message = 'Voice recognition was stopped.';
                break;
        }
        
        this.app.showMessage(message, 'system');
        this.updateVoiceStatus('Error occurred');
        this.hideVoiceInterface();
    }
}

// Make MobileVoiceRecognition available globally immediately
window.MobileVoiceRecognition = MobileVoiceRecognition;
console.log('✅ MobileVoiceRecognition class exposed globally');

// Initialize voice recognition integration
(function initVoiceIntegration() {
    console.log('🔧 Initializing voice recognition integration...');

    // Function to check and integrate with main app
    function integrateWithApp() {
        if (window.sanaApp) {
            console.log('✅ Found sanaApp, integrating voice recognition...');

            // Store original methods as fallbacks
            const originalInit = window.sanaApp.initVoiceRecognition;
            const originalStart = window.sanaApp.startVoiceRecognition;
            const originalStop = window.sanaApp.stopVoiceRecognition;

            // Enhanced initialization method
            window.sanaApp.initVoiceRecognition = function() {
                console.log('🎤 Enhanced voice recognition initialization...');
                try {
                    if (!window.MobileVoiceRecognition) {
                        throw new Error('MobileVoiceRecognition class not available');
                    }

                    this.voiceRecognition = new MobileVoiceRecognition(this);
                    console.log('✅ Voice recognition initialized with enhanced features');

                    // Test basic functionality
                    if (this.voiceRecognition.recognition) {
                        console.log('✅ Speech recognition engine ready');
                    } else {
                        console.warn('⚠️ Speech recognition engine not available');
                    }

                } catch (error) {
                    console.error('❌ Enhanced voice initialization failed:', error);
                    // Fallback to original method if available
                    if (originalInit && typeof originalInit === 'function') {
                        originalInit.call(this);
                    }
                    throw error;
                }
            };

            // Enhanced start method
            window.sanaApp.startVoiceRecognition = function() {
                console.log('🎤 Enhanced voice recognition start...');
                try {
                    if (!this.voiceRecognition) {
                        console.log('🔧 Voice recognition not ready, initializing...');
                        this.initVoiceRecognition();

                        // Retry after initialization
                        setTimeout(() => {
                            if (this.voiceRecognition) {
                                this.startVoiceRecognition();
                            }
                        }, 100);
                        return;
                    }

                    this.isVoiceActive = true;
                    this.voiceRecognition.startRecognition();

                } catch (error) {
                    console.error('❌ Enhanced voice start failed:', error);
                    this.isVoiceActive = false;

                    // Fallback to original method if available
                    if (originalStart && typeof originalStart === 'function') {
                        originalStart.call(this);
                    } else {
                        this.showMessage('Voice recognition failed to start. Please try again.', 'system');
                    }
                }
            };

            // Enhanced stop method
            window.sanaApp.stopVoiceRecognition = function() {
                console.log('🛑 Enhanced voice recognition stop...');
                try {
                    if (this.voiceRecognition && this.voiceRecognition.stopRecognition) {
                        this.voiceRecognition.stopRecognition();
                    }
                    this.isVoiceActive = false;

                } catch (error) {
                    console.error('❌ Enhanced voice stop failed:', error);
                    this.isVoiceActive = false;

                    // Fallback to original method if available
                    if (originalStop && typeof originalStop === 'function') {
                        originalStop.call(this);
                    }
                }
            };

            console.log('✅ Enhanced voice recognition methods integrated');
            return true;
        }
        return false;
    }

    // Try immediate integration
    if (integrateWithApp()) {
        return;
    }

    // Wait for DOM and app to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => integrateWithApp(), 100);
        });
    } else {
        // DOM already loaded, try multiple times
        let attempts = 0;
        const maxAttempts = 20;

        const tryIntegration = () => {
            attempts++;
            console.log(`🔍 Attempting voice integration (${attempts}/${maxAttempts})`);

            if (integrateWithApp()) {
                console.log('✅ Voice integration successful');
                return;
            }

            if (attempts < maxAttempts) {
                setTimeout(tryIntegration, 250);
            } else {
                console.error('❌ Voice integration failed after maximum attempts');
            }
        };

        tryIntegration();
    }
})();
