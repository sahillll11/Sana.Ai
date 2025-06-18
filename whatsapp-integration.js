/**
 * J.A.R.V.I.S Mobile App - WhatsApp Integration Module
 * Handles WhatsApp functionality for mobile devices
 */

class MobileWhatsAppIntegration {
    constructor(app) {
        this.app = app;
        this.apiEndpoint = '/api/whatsapp/send';
        
        this.init();
    }

    init() {
        console.log('📱 Initializing WhatsApp integration module...');
        this.setupWhatsAppCommands();
    }

    setupWhatsAppCommands() {
        // WhatsApp command patterns
        this.whatsappPatterns = [
            /send message to (.+)/i,
            /message (.+)/i,
            /text (.+)/i,
            /whatsapp (.+)/i,
            /call (.+)/i,
            /phone (.+)/i,
            /video call (.+)/i
        ];
    }

    showWhatsAppOptions() {
        console.log('📱 Showing WhatsApp options...');
        
        const options = `
            <div class="whatsapp-options">
                <h3>📱 WhatsApp Features</h3>
                <p>WhatsApp integration is optimized for desktop use.</p>
                
                <div class="feature-list">
                    <div class="feature-item">
                        <i class="fas fa-desktop"></i>
                        <div>
                            <strong>Desktop Version</strong>
                            <p>Full WhatsApp automation with messaging and calling</p>
                        </div>
                    </div>
                    
                    <div class="feature-item">
                        <i class="fas fa-mobile-alt"></i>
                        <div>
                            <strong>Mobile Version</strong>
                            <p>Voice commands to open WhatsApp web</p>
                        </div>
                    </div>
                </div>
                
                <div class="whatsapp-actions">
                    <button class="action-btn" onclick="window.jarvisApp.openWhatsAppWeb()">
                        <i class="fab fa-whatsapp"></i> Open WhatsApp Web
                    </button>
                    <button class="action-btn" onclick="window.jarvisApp.showWhatsAppHelp()">
                        <i class="fas fa-question-circle"></i> Help
                    </button>
                </div>
            </div>
        `;
        
        this.app.showMessage(options, 'system');
    }

    processWhatsAppRequest(message) {
        for (const pattern of this.whatsappPatterns) {
            const match = message.match(pattern);
            if (match && match[1]) {
                const contact = match[1].trim();
                if (contact) {
                    this.handleWhatsAppCommand(contact, message);
                    return true;
                }
            }
        }
        return false;
    }

    handleWhatsAppCommand(contact, originalMessage) {
        console.log(`📱 WhatsApp command for: ${contact}`);
        
        if (originalMessage.toLowerCase().includes('call') || originalMessage.toLowerCase().includes('phone')) {
            this.initiateCall(contact);
        } else {
            this.initiateMessage(contact);
        }
    }

    initiateMessage(contact) {
        const message = `
            <div class="whatsapp-action">
                <h4>📱 WhatsApp Message</h4>
                <p>Opening WhatsApp to message <strong>${contact}</strong></p>
                
                <div class="action-buttons">
                    <button class="action-btn primary" onclick="window.jarvisApp.openWhatsAppForContact('${contact}')">
                        <i class="fab fa-whatsapp"></i> Open WhatsApp
                    </button>
                </div>
                
                <div class="help-text">
                    <small>💡 Tip: For full automation, use the desktop version of J.A.R.V.I.S</small>
                </div>
            </div>
        `;
        
        this.app.showMessage(message, 'assistant');
        
        // Auto-open WhatsApp after a delay
        setTimeout(() => {
            this.openWhatsAppForContact(contact);
        }, 2000);
    }

    initiateCall(contact) {
        const message = `
            <div class="whatsapp-action">
                <h4>📞 WhatsApp Call</h4>
                <p>Opening WhatsApp to call <strong>${contact}</strong></p>
                
                <div class="action-buttons">
                    <button class="action-btn primary" onclick="window.jarvisApp.openWhatsAppForContact('${contact}')">
                        <i class="fas fa-phone"></i> Open WhatsApp
                    </button>
                </div>
                
                <div class="help-text">
                    <small>💡 Tip: For automatic calling, use the desktop version</small>
                </div>
            </div>
        `;
        
        this.app.showMessage(message, 'assistant');
        
        // Auto-open WhatsApp after a delay
        setTimeout(() => {
            this.openWhatsAppForContact(contact);
        }, 2000);
    }

    openWhatsAppWeb() {
        console.log('📱 Opening WhatsApp Web...');
        
        try {
            // Open WhatsApp Web
            window.open('https://web.whatsapp.com', '_blank');
            
            this.app.showMessage('✅ WhatsApp Web opened in a new tab!', 'system');
            
        } catch (error) {
            console.error('❌ Error opening WhatsApp Web:', error);
            this.app.showMessage('❌ Failed to open WhatsApp Web. Please try manually.', 'system');
        }
    }

    openWhatsAppForContact(contact) {
        console.log(`📱 Opening WhatsApp for contact: ${contact}`);
        
        try {
            // Try to open WhatsApp with contact
            const whatsappUrl = `https://wa.me/?text=Hello ${contact}`;
            window.open(whatsappUrl, '_blank');
            
            this.app.showMessage(`✅ WhatsApp opened for ${contact}!`, 'system');
            
        } catch (error) {
            console.error('❌ Error opening WhatsApp for contact:', error);
            this.openWhatsAppWeb();
        }
    }

    showWhatsAppHelp() {
        const helpText = `
            <div class="whatsapp-help">
                <h3>📱 WhatsApp Integration Help</h3>
                
                <div class="help-section">
                    <h4>🎤 Voice Commands:</h4>
                    <ul>
                        <li>"Send message to John"</li>
                        <li>"Call Sarah"</li>
                        <li>"WhatsApp Mike"</li>
                        <li>"Phone Mom"</li>
                    </ul>
                </div>
                
                <div class="help-section">
                    <h4>📱 Mobile Features:</h4>
                    <ul>
                        <li>Opens WhatsApp Web automatically</li>
                        <li>Voice command recognition</li>
                        <li>Quick contact access</li>
                    </ul>
                </div>
                
                <div class="help-section">
                    <h4>🖥️ Desktop Features:</h4>
                    <ul>
                        <li>Full automation</li>
                        <li>Automatic messaging</li>
                        <li>Direct calling</li>
                        <li>Contact management</li>
                    </ul>
                </div>
                
                <div class="help-note">
                    <p><strong>Note:</strong> For full WhatsApp automation, use the desktop version of J.A.R.V.I.S which can directly control WhatsApp Desktop.</p>
                </div>
            </div>
        `;
        
        this.app.showMessage(helpText, 'system');
    }

    async sendWhatsAppMessage(contact, message) {
        try {
            console.log(`📱 Sending WhatsApp message to ${contact}: ${message}`);
            
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contact: contact,
                    message: message
                })
            });

            const data = await response.json();
            
            if (data.success) {
                this.app.showMessage(`✅ Message sent to ${contact}!`, 'system');
            } else {
                throw new Error(data.message || 'Failed to send message');
            }

        } catch (error) {
            console.error('❌ WhatsApp message error:', error);
            this.app.showMessage(`❌ Failed to send message: ${error.message}`, 'system');
            
            // Fallback to opening WhatsApp
            this.openWhatsAppForContact(contact);
        }
    }
}

// Make MobileWhatsAppIntegration available globally
window.MobileWhatsAppIntegration = MobileWhatsAppIntegration;

// Integrate with main app
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (window.jarvisApp) {
            console.log('📱 Integrating WhatsApp with main app...');
            
            // Initialize WhatsApp integration
            window.jarvisApp.whatsappIntegration = new MobileWhatsAppIntegration(window.jarvisApp);
            
            // Add methods to main app
            window.jarvisApp.showWhatsAppOptions = function() {
                this.whatsappIntegration.showWhatsAppOptions();
            };
            
            window.jarvisApp.openWhatsAppWeb = function() {
                this.whatsappIntegration.openWhatsAppWeb();
            };
            
            window.jarvisApp.openWhatsAppForContact = function(contact) {
                this.whatsappIntegration.openWhatsAppForContact(contact);
            };
            
            window.jarvisApp.showWhatsAppHelp = function() {
                this.whatsappIntegration.showWhatsAppHelp();
            };
            
            // Override processMessage to handle WhatsApp requests
            const originalProcessMessage = window.jarvisApp.processMessage;
            window.jarvisApp.processMessage = function(message) {
                // Check if it's a WhatsApp request
                if (this.whatsappIntegration && this.whatsappIntegration.processWhatsAppRequest(message)) {
                    return; // WhatsApp request handled
                }
                
                // Otherwise, use original processing
                if (originalProcessMessage) {
                    originalProcessMessage.call(this, message);
                }
            };
            
            console.log('✅ WhatsApp integration completed successfully');
        }
    }, 1500);
});
