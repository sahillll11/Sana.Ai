/**
 * J.A.R.V.I.S Mobile App - Image Generation Module
 * Handles image generation functionality for mobile devices
 */

class MobileImageGeneration {
    constructor(app) {
        this.app = app;
        this.isGenerating = false;
        this.apiEndpoint = '/api/image/generate';
        
        this.init();
    }

    init() {
        console.log('🎨 Initializing image generation module...');
        this.setupImageCommands();
    }

    setupImageCommands() {
        // Image generation patterns
        this.imagePatterns = [
            /generate image of (.+)/i,
            /create image of (.+)/i,
            /make image of (.+)/i,
            /draw image of (.+)/i,
            /generate picture of (.+)/i,
            /create picture of (.+)/i,
            /make picture of (.+)/i,
            /draw picture of (.+)/i,
            /text to image[:\s]+(.+)/i,
            /image of (.+)/i,
            /picture of (.+)/i
        ];
    }

    async generateImage(prompt) {
        if (this.isGenerating) {
            this.app.showMessage('Image generation already in progress. Please wait...', 'system');
            return;
        }

        console.log(`🎨 Generating image for: "${prompt}"`);
        this.isGenerating = true;
        
        try {
            // Show loading message
            const loadingMessage = this.app.showMessage('🎨 Creating your image... This may take a few seconds.', 'assistant');
            this.showImageLoadingInterface();
            
            // Make API request
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt: prompt })
            });

            const data = await response.json();
            
            // Remove loading message
            if (loadingMessage) {
                loadingMessage.remove();
            }
            this.hideImageLoadingInterface();

            if (data.success) {
                this.displayGeneratedImage(data, prompt);
                this.app.showMessage(`✅ Image generated successfully for "${prompt}"!`, 'assistant');
            } else {
                throw new Error(data.message || 'Image generation failed');
            }

        } catch (error) {
            console.error('❌ Image generation error:', error);
            this.hideImageLoadingInterface();
            this.app.showMessage(`❌ Failed to generate image: ${error.message}`, 'system');
        } finally {
            this.isGenerating = false;
        }
    }

    showImageLoadingInterface() {
        const chatContainer = document.getElementById('chatContainer');
        const imageContainer = document.getElementById('imageContainer');
        
        if (chatContainer && imageContainer) {
            chatContainer.style.display = 'none';
            imageContainer.style.display = 'block';
            
            // Show loading animation
            imageContainer.innerHTML = `
                <div class="image-loading">
                    <div class="loading-spinner">
                        <div class="spinner-ring"></div>
                        <div class="spinner-ring"></div>
                        <div class="spinner-ring"></div>
                    </div>
                    <h3>🎨 Creating Your Image</h3>
                    <p>Please wait while I generate your image...</p>
                    <div class="loading-progress">
                        <div class="progress-bar"></div>
                    </div>
                </div>
            `;
        }
    }

    hideImageLoadingInterface() {
        const chatContainer = document.getElementById('chatContainer');
        const imageContainer = document.getElementById('imageContainer');
        
        if (chatContainer && imageContainer) {
            imageContainer.style.display = 'none';
            chatContainer.style.display = 'block';
        }
    }

    displayGeneratedImage(data, prompt) {
        const imageContainer = document.getElementById('imageContainer');
        
        if (!imageContainer) {
            console.error('❌ Image container not found');
            return;
        }

        // Create image display HTML
        const imageHtml = `
            <div class="image-content animate-zoomIn">
                <div class="image-header">
                    <h3>🎨 Generated Image</h3>
                    <button class="close-image-btn" onclick="window.jarvisApp.closeImageView()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="image-display">
                    <img src="data:image/png;base64,${data.image_base64}" 
                         alt="Generated image: ${prompt}" 
                         class="generated-image">
                </div>
                <div class="image-info">
                    <p class="image-prompt">"${prompt}"</p>
                    <div class="image-actions">
                        <button class="action-btn" onclick="window.jarvisApp.saveImage('${data.image_base64}', '${prompt}')">
                            <i class="fas fa-download"></i> Save
                        </button>
                        <button class="action-btn" onclick="window.jarvisApp.shareImage('${data.image_base64}', '${prompt}')">
                            <i class="fas fa-share"></i> Share
                        </button>
                        <button class="action-btn" onclick="window.jarvisApp.generateSimilar('${prompt}')">
                            <i class="fas fa-redo"></i> Generate Similar
                        </button>
                    </div>
                </div>
            </div>
        `;

        imageContainer.innerHTML = imageHtml;
        imageContainer.style.display = 'block';
        
        // Auto-hide after 10 seconds
        setTimeout(() => {
            if (imageContainer.style.display === 'block') {
                this.hideImageLoadingInterface();
            }
        }, 10000);
    }

    processImageRequest(message) {
        for (const pattern of this.imagePatterns) {
            const match = message.match(pattern);
            if (match && match[1]) {
                const prompt = match[1].trim();
                if (prompt) {
                    this.generateImage(prompt);
                    return true;
                }
            }
        }
        return false;
    }

    saveImage(imageBase64, prompt) {
        try {
            // Create download link
            const link = document.createElement('a');
            link.href = `data:image/png;base64,${imageBase64}`;
            link.download = `jarvis_${prompt.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.png`;
            
            // Trigger download
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            this.app.showMessage('✅ Image saved to your downloads!', 'system');
            
        } catch (error) {
            console.error('❌ Error saving image:', error);
            this.app.showMessage('❌ Failed to save image. Please try again.', 'system');
        }
    }

    shareImage(imageBase64, prompt) {
        try {
            if (navigator.share) {
                // Use native sharing if available
                const blob = this.base64ToBlob(imageBase64, 'image/png');
                const file = new File([blob], `jarvis_${prompt}.png`, { type: 'image/png' });
                
                navigator.share({
                    title: 'J.A.R.V.I.S Generated Image',
                    text: `Image generated by J.A.R.V.I.S: "${prompt}"`,
                    files: [file]
                });
            } else {
                // Fallback: copy to clipboard
                this.copyImageToClipboard(imageBase64);
                this.app.showMessage('✅ Image copied to clipboard!', 'system');
            }
            
        } catch (error) {
            console.error('❌ Error sharing image:', error);
            this.app.showMessage('❌ Failed to share image. Please try again.', 'system');
        }
    }

    base64ToBlob(base64, mimeType) {
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        
        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], { type: mimeType });
    }

    async copyImageToClipboard(imageBase64) {
        try {
            const blob = this.base64ToBlob(imageBase64, 'image/png');
            const item = new ClipboardItem({ 'image/png': blob });
            await navigator.clipboard.write([item]);
        } catch (error) {
            console.error('❌ Error copying to clipboard:', error);
            throw error;
        }
    }

    generateSimilar(prompt) {
        const variations = [
            `${prompt} in a different style`,
            `${prompt} with different colors`,
            `${prompt} from another angle`,
            `artistic version of ${prompt}`,
            `${prompt} with more details`
        ];
        
        const randomVariation = variations[Math.floor(Math.random() * variations.length)];
        this.generateImage(randomVariation);
    }
}

// Make MobileImageGeneration available globally
window.MobileImageGeneration = MobileImageGeneration;

// Integrate with main app
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (window.jarvisApp) {
            console.log('🎨 Integrating image generation with main app...');
            
            // Initialize image generation
            window.jarvisApp.imageGenerator = new MobileImageGeneration(window.jarvisApp);
            
            // Add methods to main app
            window.jarvisApp.showImageGeneration = function() {
                const prompt = prompt('What image would you like me to generate?');
                if (prompt && prompt.trim()) {
                    this.imageGenerator.generateImage(prompt.trim());
                }
            };
            
            window.jarvisApp.closeImageView = function() {
                this.imageGenerator.hideImageLoadingInterface();
            };
            
            window.jarvisApp.saveImage = function(imageBase64, prompt) {
                this.imageGenerator.saveImage(imageBase64, prompt);
            };
            
            window.jarvisApp.shareImage = function(imageBase64, prompt) {
                this.imageGenerator.shareImage(imageBase64, prompt);
            };
            
            window.jarvisApp.generateSimilar = function(prompt) {
                this.imageGenerator.generateSimilar(prompt);
            };
            
            // Override processMessage to handle image requests
            const originalProcessMessage = window.jarvisApp.processMessage;
            window.jarvisApp.processMessage = function(message) {
                // Check if it's an image generation request
                if (this.imageGenerator && this.imageGenerator.processImageRequest(message)) {
                    return; // Image request handled
                }
                
                // Otherwise, use original processing
                if (originalProcessMessage) {
                    originalProcessMessage.call(this, message);
                }
            };
            
            console.log('✅ Image generation integrated successfully');
        }
    }, 1000);
});
