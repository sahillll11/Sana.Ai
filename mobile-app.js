/**
 * Sana Mobile App - Main Application
 * Handles core mobile functionality and UI interactions
 */

class SanaMobileApp {
    constructor() {
        this.isVoiceActive = false;
        this.isContinuousMode = false;
        this.currentView = 'chat';
        this.apiBaseUrl = this.detectApiUrl();
        this.settings = this.loadSettings();
        this.currentAvatarType = 'girl';
        
        this.init();
    }

    detectApiUrl() {
        // Use current origin for API calls
        return window.location.origin;
    }

    init() {
        this.showLoadingScreen();
        this.setupEventListeners();
        this.initializeComponents();
        this.checkSystemCapabilities();
        
        // Hide loading screen after initialization
        setTimeout(() => {
            this.hideLoadingScreen();
        }, 3000);
    }

    showLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        const app = document.getElementById('app');
        
        loadingScreen.style.display = 'flex';
        app.style.display = 'none';
        
        // Animate loading text
        const loadingTexts = [
            'Initializing systems...',
            'Loading AI modules...',
            'Connecting to services...',
            'Preparing interface...',
            'Ready to assist!'
        ];
        
        let textIndex = 0;
        const loadingTextElement = document.querySelector('.loading-text');
        
        const textInterval = setInterval(() => {
            if (textIndex < loadingTexts.length) {
                loadingTextElement.textContent = loadingTexts[textIndex];
                textIndex++;
            } else {
                clearInterval(textInterval);
            }
        }, 600);
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        const app = document.getElementById('app');
        
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
            app.style.display = 'flex';
            app.classList.add('animate-fadeInUp');
        }, 500);
    }

    setupEventListeners() {
        // Voice button
        document.getElementById('voiceBtn').addEventListener('click', () => {
            this.toggleVoiceMode();
        });

        // Send button
        document.getElementById('sendBtn').addEventListener('click', () => {
            this.sendMessage();
        });

        // Message input
        const messageInput = document.getElementById('messageInput');
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });

        // Action buttons
        document.getElementById('imageBtn').addEventListener('click', () => {
            this.showImageGeneration();
        });

        document.getElementById('whatsappBtn').addEventListener('click', () => {
            this.showWhatsAppOptions();
        });

        document.getElementById('appsBtn').addEventListener('click', () => {
            this.showAppControl();
        });

        // Menu controls
        document.getElementById('menuBtn').addEventListener('click', () => {
            this.toggleSideMenu();
        });

        document.getElementById('closeMenuBtn').addEventListener('click', () => {
            this.closeSideMenu();
        });

        // Settings
        document.getElementById('settingsBtn').addEventListener('click', () => {
            this.showSettings();
        });

        document.getElementById('closeSettingsBtn').addEventListener('click', () => {
            this.closeSettings();
        });

        // Overlay
        document.getElementById('overlay').addEventListener('click', () => {
            this.closeAllModals();
        });

        // Menu items
        document.querySelectorAll('.menu-list a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const action = e.target.closest('a').dataset.action;
                this.handleMenuAction(action);
            });
        });

        // Settings toggles
        document.getElementById('voiceToggle').addEventListener('change', (e) => {
            this.settings.voiceEnabled = e.target.checked;
            this.saveSettings();
        });

        document.getElementById('continuousToggle').addEventListener('change', (e) => {
            this.settings.continuousMode = e.target.checked;
            this.saveSettings();
        });

        document.getElementById('soundToggle').addEventListener('change', (e) => {
            this.settings.soundEffects = e.target.checked;
            this.saveSettings();
        });

        document.getElementById('themeSelect').addEventListener('change', (e) => {
            this.settings.theme = e.target.value;
            this.saveSettings();
            this.applyTheme();
        });

        // Avatar selection
        this.setupAvatarSelection();

        // Voice upload and management
        this.setupVoiceManagement();

        // Touch gestures
        this.setupTouchGestures();
    }

    setupTouchGestures() {
        let startY = 0;
        let startX = 0;

        document.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
            startX = e.touches[0].clientX;
        });

        document.addEventListener('touchend', (e) => {
            const endY = e.changedTouches[0].clientY;
            const endX = e.changedTouches[0].clientX;
            const diffY = startY - endY;
            const diffX = startX - endX;

            // Swipe gestures
            if (Math.abs(diffX) > Math.abs(diffY)) {
                if (diffX > 50) {
                    // Swipe left - open menu
                    this.openSideMenu();
                } else if (diffX < -50) {
                    // Swipe right - close menu
                    this.closeSideMenu();
                }
            }
        });
    }

    initializeComponents() {
        console.log('🔧 Initializing components...');

        // Wait for all scripts to load before initializing voice
        this.waitForScriptsAndInitialize();

        // Apply saved theme
        this.applyTheme();

        // Update UI with settings
        this.updateSettingsUI();
    }

    waitForScriptsAndInitialize() {
        // Check if voice recognition script is loaded
        let attempts = 0;
        const maxAttempts = 10;

        const checkAndInit = () => {
            attempts++;
            console.log(`🔍 Checking for voice recognition (attempt ${attempts}/${maxAttempts})`);

            if (window.MobileVoiceRecognition) {
                console.log('✅ MobileVoiceRecognition class found');
                if (this.settings.voiceEnabled) {
                    this.initVoiceRecognition();
                }
                return;
            }

            if (attempts < maxAttempts) {
                console.log('⏳ Voice recognition not ready, retrying...');
                setTimeout(checkAndInit, 500);
            } else {
                console.error('❌ Voice recognition failed to load after maximum attempts');
                this.showMessage('Voice recognition failed to load. Please refresh the page.', 'system');
            }
        };

        checkAndInit();
    }

    setupAvatarSelection() {
        // Load current avatar type
        this.loadCurrentAvatarType();

        // Setup avatar option click handlers
        document.querySelectorAll('.avatar-option').forEach(option => {
            option.addEventListener('click', () => {
                const avatarType = option.dataset.type;
                this.selectAvatar(avatarType);
            });
        });

        // Setup radio button handlers
        document.querySelectorAll('input[name="avatarType"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.selectAvatar(e.target.value);
                }
            });
        });
    }

    async loadCurrentAvatarType() {
        try {
            const response = await fetch('/api/sana/avatar-type');
            if (response.ok) {
                const data = await response.json();
                this.currentAvatarType = data.avatar_type || 'girl';
                this.updateAvatarUI();
            }
        } catch (error) {
            console.error('Error loading avatar type:', error);
            this.currentAvatarType = 'girl';
        }
    }

    async selectAvatar(avatarType) {
        try {
            console.log(`🎭 Selecting avatar: ${avatarType}`);

            // Update server
            const response = await fetch('/api/sana/avatar-type', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    avatar_type: avatarType
                })
            });

            if (response.ok) {
                this.currentAvatarType = avatarType;
                this.updateAvatarUI();
                this.updateAllAvatars();

                // Show confirmation message
                this.showMessage(`Avatar changed to ${avatarType}! 🎭`, 'system');
            } else {
                throw new Error('Failed to update avatar');
            }
        } catch (error) {
            console.error('Error selecting avatar:', error);
            this.showMessage('Failed to change avatar. Please try again.', 'system');
        }
    }

    updateAvatarUI() {
        // Update radio buttons
        document.querySelectorAll('input[name="avatarType"]').forEach(radio => {
            radio.checked = radio.value === this.currentAvatarType;
        });

        // Update avatar option selection
        document.querySelectorAll('.avatar-option').forEach(option => {
            if (option.dataset.type === this.currentAvatarType) {
                option.classList.add('selected');
            } else {
                option.classList.remove('selected');
            }
        });
    }

    updateAllAvatars() {
        // Update all Sana avatars in the interface
        const avatarUrl = `/api/sana/avatar/${this.currentAvatarType}`;

        // Update header avatar
        const headerAvatar = document.querySelector('.header-sana-avatar');
        if (headerAvatar) {
            headerAvatar.src = avatarUrl;
        }

        // Update welcome message avatar
        const welcomeAvatar = document.querySelector('.welcome-message .sana-avatar-img');
        if (welcomeAvatar) {
            welcomeAvatar.src = avatarUrl;
        }

        // Update any existing message avatars
        document.querySelectorAll('.message.assistant .sana-avatar-img').forEach(img => {
            img.src = avatarUrl;
        });
    }

    setupVoiceManagement() {
        // Load available voices
        this.loadAvailableVoices();

        // Voice selector change
        document.getElementById('voiceSelect').addEventListener('change', (e) => {
            this.setActiveVoice(e.target.value);
        });

        // Test voice button
        document.getElementById('testVoiceBtn').addEventListener('click', () => {
            this.testCurrentVoice();
        });

        // Upload voice button
        document.getElementById('uploadVoiceBtn').addEventListener('click', () => {
            document.getElementById('voiceFileInput').click();
        });

        // File input change
        document.getElementById('voiceFileInput').addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.uploadVoiceFile(e.target.files[0]);
            }
        });
    }

    async loadAvailableVoices() {
        try {
            const response = await fetch('/api/voice/list');
            if (response.ok) {
                const data = await response.json();
                this.updateVoiceSelector(data.voices);
            }
        } catch (error) {
            console.error('Error loading voices:', error);
        }
    }

    updateVoiceSelector(voices) {
        const voiceSelect = document.getElementById('voiceSelect');
        const currentVoice = document.getElementById('currentVoice');

        // Clear existing options except built-in ones
        const builtInOptions = voiceSelect.querySelectorAll('option[data-type="built-in"]');
        voiceSelect.innerHTML = '';

        // Add built-in voices
        voices.built_in.forEach(voice => {
            const option = document.createElement('option');
            option.value = voice.id;
            option.textContent = voice.name;
            option.setAttribute('data-type', 'built-in');
            voiceSelect.appendChild(option);
        });

        // Add custom voices
        if (voices.custom && voices.custom.length > 0) {
            const separator = document.createElement('option');
            separator.textContent = '--- Custom Voices ---';
            separator.disabled = true;
            voiceSelect.appendChild(separator);

            voices.custom.forEach(voice => {
                const option = document.createElement('option');
                option.value = voice.id;
                option.textContent = voice.name;
                option.setAttribute('data-type', 'custom');
                voiceSelect.appendChild(option);
            });
        }

        // Set current selection
        const currentVoiceId = this.settings.selected_voice || 'sana_default';
        voiceSelect.value = currentVoiceId;

        // Update current voice display
        const selectedOption = voiceSelect.options[voiceSelect.selectedIndex];
        currentVoice.textContent = selectedOption ? selectedOption.textContent : 'Sana Default';
    }

    async setActiveVoice(voiceId) {
        try {
            const response = await fetch('/api/voice/set', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    voice_id: voiceId
                })
            });

            if (response.ok) {
                const data = await response.json();
                this.settings.selected_voice = voiceId;
                this.saveSettings();

                // Update display
                const voiceSelect = document.getElementById('voiceSelect');
                const currentVoice = document.getElementById('currentVoice');
                const selectedOption = voiceSelect.options[voiceSelect.selectedIndex];
                currentVoice.textContent = selectedOption.textContent;

                this.showMessage(`Voice changed to ${selectedOption.textContent}! 🔊`, 'system');
            }
        } catch (error) {
            console.error('Error setting voice:', error);
            this.showMessage('Failed to change voice. Please try again.', 'system');
        }
    }

    async testCurrentVoice() {
        try {
            const voiceId = this.settings.selected_voice || 'sana_default';
            const testText = "Hello! This is how I sound with this voice.";

            const response = await fetch('/api/voice/speak', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: testText,
                    voice_id: voiceId
                })
            });

            if (response.ok) {
                const data = await response.json();
                this.showMessage(`🔊 Testing voice: "${testText}"`, 'system');
                // In a real implementation, you would play the audio data
                console.log('Voice test audio data:', data.audio_data);
            }
        } catch (error) {
            console.error('Error testing voice:', error);
            this.showMessage('Failed to test voice. Please try again.', 'system');
        }
    }

    async uploadVoiceFile(file) {
        try {
            // Validate file size (10MB limit)
            if (file.size > 10 * 1024 * 1024) {
                this.showMessage('File too large. Please choose a file under 10MB.', 'system');
                return;
            }

            // Show upload progress
            this.showUploadProgress(0);

            const formData = new FormData();
            formData.append('voice_file', file);
            formData.append('voice_name', file.name.split('.')[0]);

            const response = await fetch('/api/voice/upload', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                this.showMessage(`Voice "${data.voice_info.name}" uploaded successfully! 🎉`, 'system');
                this.loadAvailableVoices(); // Refresh voice list
                this.hideUploadProgress();
            } else {
                const error = await response.json();
                this.showMessage(`Upload failed: ${error.error}`, 'system');
                this.hideUploadProgress();
            }
        } catch (error) {
            console.error('Error uploading voice:', error);
            this.showMessage('Failed to upload voice. Please try again.', 'system');
            this.hideUploadProgress();
        }
    }

    showUploadProgress(percent) {
        // Create progress bar if it doesn't exist
        let progressContainer = document.querySelector('.upload-progress');
        if (!progressContainer) {
            progressContainer = document.createElement('div');
            progressContainer.className = 'upload-progress';
            progressContainer.innerHTML = '<div class="upload-progress-bar"></div>';
            document.querySelector('.upload-voice').appendChild(progressContainer);
        }

        const progressBar = progressContainer.querySelector('.upload-progress-bar');
        progressBar.style.width = `${percent}%`;
        progressContainer.style.display = 'block';
    }

    hideUploadProgress() {
        const progressContainer = document.querySelector('.upload-progress');
        if (progressContainer) {
            progressContainer.style.display = 'none';
        }
    }

    updateSettingsUI() {
        try {
            const voiceToggle = document.getElementById('voiceToggle');
            const continuousToggle = document.getElementById('continuousToggle');
            const soundToggle = document.getElementById('soundToggle');
            const themeSelect = document.getElementById('themeSelect');

            if (voiceToggle) voiceToggle.checked = this.settings.voiceEnabled;
            if (continuousToggle) continuousToggle.checked = this.settings.continuousMode;
            if (soundToggle) soundToggle.checked = this.settings.soundEffects;
            if (themeSelect) themeSelect.value = this.settings.theme;

            console.log('✅ Settings UI updated');
        } catch (error) {
            console.error('❌ Error updating settings UI:', error);
        }
    }

    checkSystemCapabilities() {
        // Check microphone access
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(() => {
                    console.log('Microphone access granted');
                    this.updateStatus('online');
                })
                .catch(() => {
                    console.log('Microphone access denied');
                    this.updateStatus('limited');
                });
        }

        // Check network connectivity
        this.checkNetworkStatus();
        window.addEventListener('online', () => this.updateStatus('online'));
        window.addEventListener('offline', () => this.updateStatus('offline'));
    }

    checkNetworkStatus() {
        if (navigator.onLine) {
            // Test API connectivity
            fetch(this.apiBaseUrl + '/health', { method: 'HEAD' })
                .then(() => this.updateStatus('online'))
                .catch(() => this.updateStatus('limited'));
        } else {
            this.updateStatus('offline');
        }
    }

    updateStatus(status) {
        const statusIndicator = document.getElementById('statusIndicator');
        const statusText = statusIndicator.querySelector('span') || statusIndicator;
        
        switch (status) {
            case 'online':
                statusIndicator.className = 'status-indicator online';
                statusText.innerHTML = '<i class="fas fa-circle"></i> Online';
                break;
            case 'offline':
                statusIndicator.className = 'status-indicator offline';
                statusText.innerHTML = '<i class="fas fa-circle"></i> Offline';
                break;
            case 'limited':
                statusIndicator.className = 'status-indicator limited';
                statusText.innerHTML = '<i class="fas fa-circle"></i> Limited';
                break;
        }
    }

    toggleVoiceMode() {
        console.log('🎤 Toggle voice mode called');

        if (!this.settings.voiceEnabled) {
            this.showMessage('Voice recognition is disabled. Enable it in settings.', 'system');
            return;
        }

        // Initialize voice recognition if not already done
        if (!this.voiceRecognition) {
            console.log('🔧 Initializing voice recognition...');
            this.initVoiceRecognition();
        }

        if (this.isVoiceActive) {
            console.log('🛑 Stopping voice recognition...');
            this.stopVoiceRecognition();
        } else {
            console.log('🎤 Starting voice recognition...');
            this.startVoiceRecognition();
        }
    }

    sendMessage() {
        const messageInput = document.getElementById('messageInput');
        const message = messageInput.value.trim();
        
        if (!message) return;

        // Show user message
        this.showMessage(message, 'user');
        messageInput.value = '';

        // Process message
        this.processMessage(message);
    }

    showMessage(message, type = 'assistant', options = {}) {
        const chatMessages = document.getElementById('chatMessages');
        const messageElement = document.createElement('div');
        messageElement.className = `message ${type} animate-slideInUp`;

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';

        if (type === 'user') {
            avatar.innerHTML = '<i class="fas fa-user"></i>';
            avatar.style.background = 'linear-gradient(45deg, #0066cc, #00aaff)';
        } else if (type === 'system') {
            avatar.innerHTML = '<i class="fas fa-cog"></i>';
            avatar.style.background = 'linear-gradient(45deg, #ffaa00, #ff6600)';
        } else {
            // Use Sana avatar for assistant messages
            avatar.className = 'message-avatar sana-avatar';
            const avatarUrl = `/api/sana/avatar/${this.currentAvatarType}`;
            avatar.innerHTML = `
                <img src="${avatarUrl}" alt="Sana" class="sana-avatar-img"
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                <i class="fas fa-robot avatar-fallback" style="display: none;"></i>
            `;

            // Add speaking animation when Sana responds
            if (type === 'assistant' && !options.isTyping) {
                setTimeout(() => {
                    const avatarImg = avatar.querySelector('.sana-avatar-img');
                    if (avatarImg) {
                        avatarImg.style.animation = 'sana-speaking 2s ease-in-out';
                        setTimeout(() => {
                            avatarImg.style.animation = 'gentle-glow 4s ease-in-out infinite';
                        }, 2000);
                    }
                }, 100);
            }
        }

        const content = document.createElement('div');
        content.className = 'message-content';
        content.innerHTML = `<p>${message}</p>`;

        messageElement.appendChild(avatar);
        messageElement.appendChild(content);
        chatMessages.appendChild(messageElement);

        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // Play sound effect
        if (this.settings.soundEffects && type === 'assistant') {
            this.playNotificationSound();
        }

        return messageElement;
    }

    async processMessage(message) {
        try {
            // Show typing indicator with Sana avatar
            const typingElement = this.showMessage('Thinking...', 'assistant', { isTyping: true });
            typingElement.classList.add('animate-typing');

            // Send to API
            const response = await this.sendToAPI(message);

            // Remove typing indicator
            typingElement.remove();

            // Show response with Sana speaking animation
            this.showMessage(response, 'assistant');

        } catch (error) {
            console.error('Error processing message:', error);
            this.showMessage('Sorry, I encountered an error. Please try again.', 'system');
        }
    }

    async sendToAPI(message) {
        try {
            console.log(`🤖 Sending message to API: "${message}"`);

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('✅ API response received:', data);

            if (data.response) {
                return data.response;
            } else {
                throw new Error(data.error || 'No response from AI');
            }

        } catch (error) {
            console.error('❌ API error:', error);
            // Fallback to mock response if API fails
            return this.generateMockResponse(message);
        }
    }

    generateMockResponse(message) {
        const lowerMessage = message.toLowerCase();
        
        if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
            return 'Hello! How can I assist you today?';
        } else if (lowerMessage.includes('image') || lowerMessage.includes('picture')) {
            return 'I can generate images for you! What would you like me to create?';
        } else if (lowerMessage.includes('whatsapp') || lowerMessage.includes('message')) {
            return 'I can help you send WhatsApp messages. Who would you like to message?';
        } else if (lowerMessage.includes('time')) {
            return `The current time is ${new Date().toLocaleTimeString()}.`;
        } else if (lowerMessage.includes('date')) {
            return `Today's date is ${new Date().toLocaleDateString()}.`;
        } else {
            return 'I understand you\'re asking about something. How can I help you with that?';
        }
    }

    loadSettings() {
        const defaultSettings = {
            voiceEnabled: true,
            continuousMode: false,
            soundEffects: true,
            theme: 'dark'
        };

        try {
            const saved = localStorage.getItem('sana-mobile-settings');
            return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
        } catch {
            return defaultSettings;
        }
    }

    saveSettings() {
        localStorage.setItem('sana-mobile-settings', JSON.stringify(this.settings));
    }

    applyTheme() {
        document.body.className = `theme-${this.settings.theme}`;
    }

    playNotificationSound() {
        if (!this.settings.soundEffects) return;
        
        // Create a simple beep sound
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    }

    // Voice recognition methods with comprehensive error handling
    initVoiceRecognition() {
        console.log('🔧 Initializing voice recognition...');

        try {
            if (!window.MobileVoiceRecognition) {
                throw new Error('MobileVoiceRecognition class not available');
            }

            // Check browser support
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition) {
                throw new Error('Speech recognition not supported in this browser');
            }

            // Initialize voice recognition
            this.voiceRecognition = new window.MobileVoiceRecognition(this);
            console.log('✅ Voice recognition initialized successfully');

            // Update status indicator
            this.updateVoiceStatus('ready');

        } catch (error) {
            console.error('❌ Voice recognition initialization failed:', error);
            this.showMessage(`Voice recognition error: ${error.message}`, 'system');
            this.updateVoiceStatus('error');

            // Disable voice button
            this.disableVoiceButton();
        }
    }

    startVoiceRecognition() {
        console.log('🎤 Starting voice recognition...');

        try {
            if (!this.voiceRecognition) {
                console.log('🔧 Voice recognition not initialized, initializing now...');
                this.initVoiceRecognition();

                // Wait a moment for initialization
                setTimeout(() => {
                    if (this.voiceRecognition) {
                        this.startVoiceRecognition();
                    }
                }, 500);
                return;
            }

            if (!this.voiceRecognition.startRecognition) {
                throw new Error('Voice recognition start method not available');
            }

            this.isVoiceActive = true;
            this.voiceRecognition.startRecognition();
            this.updateVoiceStatus('listening');

        } catch (error) {
            console.error('❌ Error starting voice recognition:', error);
            this.showMessage(`Voice start error: ${error.message}`, 'system');
            this.isVoiceActive = false;
            this.updateVoiceStatus('error');
        }
    }

    stopVoiceRecognition() {
        console.log('🛑 Stopping voice recognition...');

        try {
            if (this.voiceRecognition && this.voiceRecognition.stopRecognition) {
                this.voiceRecognition.stopRecognition();
            }

            this.isVoiceActive = false;
            this.updateVoiceStatus('ready');

        } catch (error) {
            console.error('❌ Error stopping voice recognition:', error);
            this.isVoiceActive = false;
            this.updateVoiceStatus('error');
        }
    }

    updateVoiceStatus(status) {
        try {
            const voiceBtn = document.getElementById('voiceBtn');
            const statusIndicator = document.getElementById('statusIndicator');

            switch (status) {
                case 'ready':
                    if (voiceBtn) {
                        voiceBtn.classList.remove('active', 'error');
                        voiceBtn.innerHTML = '<i class="fas fa-microphone"></i><span>Voice</span>';
                        voiceBtn.disabled = false;
                    }
                    break;

                case 'listening':
                    if (voiceBtn) {
                        voiceBtn.classList.add('active');
                        voiceBtn.classList.remove('error');
                        voiceBtn.innerHTML = '<i class="fas fa-stop"></i><span>Stop</span>';
                    }
                    break;

                case 'error':
                    if (voiceBtn) {
                        voiceBtn.classList.add('error');
                        voiceBtn.classList.remove('active');
                        voiceBtn.innerHTML = '<i class="fas fa-microphone-slash"></i><span>Error</span>';
                    }
                    break;
            }

        } catch (error) {
            console.error('❌ Error updating voice status:', error);
        }
    }

    disableVoiceButton() {
        try {
            const voiceBtn = document.getElementById('voiceBtn');
            if (voiceBtn) {
                voiceBtn.disabled = true;
                voiceBtn.classList.add('error');
                voiceBtn.innerHTML = '<i class="fas fa-microphone-slash"></i><span>Disabled</span>';
            }
        } catch (error) {
            console.error('❌ Error disabling voice button:', error);
        }
    }

    showImageGeneration() {
        // Implemented in image-generation.js
    }

    showWhatsAppOptions() {
        // Implemented in whatsapp-integration.js
    }

    showAppControl() {
        this.showMessage('App control features are available on desktop version.', 'system');
    }

    toggleSideMenu() {
        const sideMenu = document.getElementById('sideMenu');
        const overlay = document.getElementById('overlay');
        
        if (sideMenu.classList.contains('open')) {
            this.closeSideMenu();
        } else {
            this.openSideMenu();
        }
    }

    openSideMenu() {
        const sideMenu = document.getElementById('sideMenu');
        const overlay = document.getElementById('overlay');
        
        sideMenu.classList.add('open');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeSideMenu() {
        const sideMenu = document.getElementById('sideMenu');
        const overlay = document.getElementById('overlay');
        
        sideMenu.classList.remove('open');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    showSettings() {
        const settingsModal = document.getElementById('settingsModal');
        const overlay = document.getElementById('overlay');
        
        settingsModal.classList.add('active');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeSettings() {
        const settingsModal = document.getElementById('settingsModal');
        const overlay = document.getElementById('overlay');
        
        settingsModal.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    closeAllModals() {
        this.closeSideMenu();
        this.closeSettings();
    }

    handleMenuAction(action) {
        switch (action) {
            case 'voice':
                this.toggleVoiceMode();
                break;
            case 'image':
                this.showImageGeneration();
                break;
            case 'whatsapp':
                this.showWhatsAppOptions();
                break;
            case 'apps':
                this.showAppControl();
                break;
            case 'settings':
                this.showSettings();
                break;
            case 'history':
                this.showChatHistory();
                break;
            case 'help':
                this.showHelp();
                break;
            case 'about':
                this.showAbout();
                break;
        }
        this.closeSideMenu();
    }

    showChatHistory() {
        this.showMessage('Chat history feature coming soon!', 'system');
    }

    showHelp() {
        const helpText = `
            <strong>J.A.R.V.I.S Mobile Help</strong><br><br>
            <strong>Voice Commands:</strong><br>
            • Tap microphone and speak<br>
            • Say "generate image of [description]"<br>
            • Say "send message to [contact]"<br><br>
            <strong>Text Commands:</strong><br>
            • Type in the message box<br>
            • Use natural language<br><br>
            <strong>Gestures:</strong><br>
            • Swipe left to open menu<br>
            • Swipe right to close menu
        `;
        this.showMessage(helpText, 'system');
    }

    showAbout() {
        const aboutText = `
            <strong>Sana AI Assistant</strong><br>
            Version 1.0.0<br><br>
            A comprehensive AI assistant with:<br>
            • Voice recognition<br>
            • Image generation<br>
            • WhatsApp integration<br>
            • Smart conversations<br><br>
            Made with ❤️ for mobile devices
        `;
        this.showMessage(aboutText, 'system');
    }
    // API Communication Methods
    async sendApiRequest(endpoint, data = {}) {
        try {
            const response = await fetch(`${this.apiBaseUrl}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            this.showMessage('Connection error. Please check your network.', 'error');
            return null;
        }
    }

    async sendChatMessage(message) {
        try {
            const response = await this.sendApiRequest('/api/chat', {
                message: message,
                conversation_id: this.conversationId || null
            });

            if (response && response.response) {
                this.showMessage(response.response, 'assistant');
                if (response.conversation_id) {
                    this.conversationId = response.conversation_id;
                }
            }
        } catch (error) {
            console.error('Chat message failed:', error);
            this.showMessage('Sorry, I encountered an error processing your message.', 'error');
        }
    }

    async generateImage(prompt) {
        try {
            this.showMessage('Generating image...', 'system');

            const response = await this.sendApiRequest('/api/generate-image', {
                prompt: prompt
            });

            if (response && response.image_url) {
                this.displayGeneratedImage(response.image_url, prompt);
            }
        } catch (error) {
            console.error('Image generation failed:', error);
            this.showMessage('Sorry, I could not generate the image.', 'error');
        }
    }

    displayGeneratedImage(imageUrl, prompt) {
        const chatMessages = document.getElementById('chatMessages');
        const imageElement = document.createElement('div');
        imageElement.className = 'message assistant image-message';
        imageElement.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                <div class="generated-image">
                    <img src="${imageUrl}" alt="Generated: ${prompt}" onclick="this.requestFullscreen()">
                    <div class="image-caption">
                        <p><strong>Generated Image:</strong> ${prompt}</p>
                        <div class="image-actions">
                            <button onclick="window.open('${imageUrl}', '_blank')" class="btn-small">
                                <i class="fas fa-external-link-alt"></i> View Full
                            </button>
                            <button onclick="navigator.share({files: [new File([fetch('${imageUrl}').then(r => r.blob())], 'sana-image.png', {type: 'image/png'})]}).catch(() => {})" class="btn-small">
                                <i class="fas fa-share"></i> Share
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        chatMessages.appendChild(imageElement);
        this.scrollToBottom();
    }

    // Mobile-specific optimizations
    optimizeForMobile() {
        // Prevent zoom on input focus
        const inputs = document.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            input.addEventListener('focus', () => {
                document.querySelector('meta[name=viewport]').setAttribute(
                    'content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0'
                );
            });

            input.addEventListener('blur', () => {
                document.querySelector('meta[name=viewport]').setAttribute(
                    'content', 'width=device-width, initial-scale=1.0, user-scalable=yes'
                );
            });
        });

        // Handle orientation changes
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.scrollToBottom();
                this.adjustLayoutForOrientation();
            }, 100);
        });

        // Optimize touch interactions
        document.addEventListener('touchstart', () => {}, { passive: true });
        document.addEventListener('touchmove', () => {}, { passive: true });
    }

    adjustLayoutForOrientation() {
        const isLandscape = window.innerWidth > window.innerHeight;
        document.body.classList.toggle('landscape', isLandscape);

        if (isLandscape) {
            // Adjust for landscape mode
            document.querySelector('.chat-container').style.height = 'calc(100vh - 120px)';
        } else {
            // Adjust for portrait mode
            document.querySelector('.chat-container').style.height = 'calc(100vh - 160px)';
        }
    }

    // PWA Installation
    initializePWA() {
        let deferredPrompt;

        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            this.showInstallPrompt();
        });

        window.addEventListener('appinstalled', () => {
            console.log('PWA was installed');
            this.hideInstallPrompt();
        });
    }

    showInstallPrompt() {
        const installBanner = document.createElement('div');
        installBanner.className = 'install-banner';
        installBanner.innerHTML = `
            <div class="install-content">
                <i class="fas fa-mobile-alt"></i>
                <span>Install Sana as an app for better experience</span>
                <button id="installBtn" class="install-btn">Install</button>
                <button id="dismissBtn" class="dismiss-btn">×</button>
            </div>
        `;

        document.body.appendChild(installBanner);

        document.getElementById('installBtn').addEventListener('click', () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                deferredPrompt.userChoice.then((choiceResult) => {
                    deferredPrompt = null;
                    this.hideInstallPrompt();
                });
            }
        });

        document.getElementById('dismissBtn').addEventListener('click', () => {
            this.hideInstallPrompt();
        });
    }

    hideInstallPrompt() {
        const installBanner = document.querySelector('.install-banner');
        if (installBanner) {
            installBanner.remove();
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.sanaApp = new SanaMobileApp();
});
