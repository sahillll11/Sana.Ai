/**
 * J.A.R.V.I.S Mobile App - PWA Service Module
 * Handles Progressive Web App functionality
 */

class PWAService {
    constructor() {
        this.deferredPrompt = null;
        this.isInstalled = false;
        this.isStandalone = false;
        
        this.init();
    }

    init() {
        console.log('📱 Initializing PWA service...');
        
        this.checkInstallStatus();
        this.setupInstallPrompt();
        this.setupServiceWorker();
        this.setupPWAEvents();
    }

    checkInstallStatus() {
        // Check if app is running in standalone mode
        this.isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                           window.navigator.standalone ||
                           document.referrer.includes('android-app://');
        
        // Check if app is installed
        this.isInstalled = this.isStandalone;
        
        console.log(`📱 PWA Status - Installed: ${this.isInstalled}, Standalone: ${this.isStandalone}`);
        
        if (this.isInstalled) {
            this.showInstalledStatus();
        }
    }

    setupInstallPrompt() {
        // Listen for the beforeinstallprompt event
        window.addEventListener('beforeinstallprompt', (e) => {
            console.log('📱 Install prompt available');
            
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            
            // Save the event so it can be triggered later
            this.deferredPrompt = e;
            
            // Show install button
            this.showInstallButton();
        });

        // Listen for the appinstalled event
        window.addEventListener('appinstalled', () => {
            console.log('✅ PWA was installed');
            this.isInstalled = true;
            this.hideInstallButton();
            this.showInstalledStatus();
            
            // Clear the deferredPrompt
            this.deferredPrompt = null;
        });
    }

    setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                    .then((registration) => {
                        console.log('✅ Service Worker registered:', registration.scope);
                        
                        // Check for updates
                        registration.addEventListener('updatefound', () => {
                            console.log('🔄 Service Worker update found');
                            this.handleServiceWorkerUpdate(registration);
                        });
                    })
                    .catch((error) => {
                        console.error('❌ Service Worker registration failed:', error);
                    });
            });
        } else {
            console.warn('⚠️ Service Worker not supported');
        }
    }

    setupPWAEvents() {
        // Handle display mode changes
        window.matchMedia('(display-mode: standalone)').addEventListener('change', (e) => {
            this.isStandalone = e.matches;
            console.log(`📱 Display mode changed - Standalone: ${this.isStandalone}`);
        });

        // Handle online/offline status
        window.addEventListener('online', () => {
            console.log('🌐 App is online');
            this.showOnlineStatus();
        });

        window.addEventListener('offline', () => {
            console.log('📴 App is offline');
            this.showOfflineStatus();
        });
    }

    showInstallButton() {
        // Create install button if it doesn't exist
        let installButton = document.getElementById('installButton');
        
        if (!installButton) {
            installButton = document.createElement('button');
            installButton.id = 'installButton';
            installButton.className = 'install-button';
            installButton.innerHTML = '<i class="fas fa-download"></i> Install App';
            installButton.onclick = () => this.installApp();
            
            // Add to header or create install banner
            const header = document.querySelector('.app-header .header-controls');
            if (header) {
                header.appendChild(installButton);
            } else {
                this.createInstallBanner();
            }
        }
        
        installButton.style.display = 'block';
        console.log('📱 Install button shown');
    }

    hideInstallButton() {
        const installButton = document.getElementById('installButton');
        if (installButton) {
            installButton.style.display = 'none';
        }
        
        const installBanner = document.getElementById('installBanner');
        if (installBanner) {
            installBanner.remove();
        }
    }

    createInstallBanner() {
        const banner = document.createElement('div');
        banner.id = 'installBanner';
        banner.className = 'install-banner';
        banner.innerHTML = `
            <div class="banner-content">
                <div class="banner-text">
                    <i class="fas fa-mobile-alt"></i>
                    <span>Install J.A.R.V.I.S for the best experience!</span>
                </div>
                <div class="banner-actions">
                    <button onclick="window.pwaService.installApp()" class="install-btn">
                        <i class="fas fa-download"></i> Install
                    </button>
                    <button onclick="window.pwaService.dismissBanner()" class="dismiss-btn">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;
        
        document.body.insertBefore(banner, document.body.firstChild);
    }

    async installApp() {
        if (!this.deferredPrompt) {
            console.warn('⚠️ Install prompt not available');
            this.showManualInstallInstructions();
            return;
        }

        try {
            // Show the install prompt
            this.deferredPrompt.prompt();
            
            // Wait for the user to respond to the prompt
            const { outcome } = await this.deferredPrompt.userChoice;
            
            console.log(`📱 Install prompt outcome: ${outcome}`);
            
            if (outcome === 'accepted') {
                console.log('✅ User accepted the install prompt');
            } else {
                console.log('❌ User dismissed the install prompt');
            }
            
            // Clear the deferredPrompt
            this.deferredPrompt = null;
            this.hideInstallButton();
            
        } catch (error) {
            console.error('❌ Install error:', error);
            this.showManualInstallInstructions();
        }
    }

    showManualInstallInstructions() {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const isAndroid = /Android/.test(navigator.userAgent);
        
        let instructions = '';
        
        if (isIOS) {
            instructions = `
                <div class="install-instructions">
                    <h3>📱 Install on iOS</h3>
                    <ol>
                        <li>Tap the Share button <i class="fas fa-share"></i></li>
                        <li>Scroll down and tap "Add to Home Screen"</li>
                        <li>Tap "Add" to install J.A.R.V.I.S</li>
                    </ol>
                </div>
            `;
        } else if (isAndroid) {
            instructions = `
                <div class="install-instructions">
                    <h3>📱 Install on Android</h3>
                    <ol>
                        <li>Tap the menu button <i class="fas fa-ellipsis-v"></i></li>
                        <li>Select "Add to Home screen"</li>
                        <li>Tap "Add" to install J.A.R.V.I.S</li>
                    </ol>
                </div>
            `;
        } else {
            instructions = `
                <div class="install-instructions">
                    <h3>📱 Install Instructions</h3>
                    <p>Use your browser's menu to add this app to your home screen.</p>
                </div>
            `;
        }
        
        if (window.jarvisApp) {
            window.jarvisApp.showMessage(instructions, 'system');
        }
    }

    dismissBanner() {
        const banner = document.getElementById('installBanner');
        if (banner) {
            banner.remove();
        }
    }

    showInstalledStatus() {
        console.log('✅ App is installed and running');
        
        // Update UI to show installed status
        const statusIndicator = document.getElementById('statusIndicator');
        if (statusIndicator) {
            statusIndicator.innerHTML = '<i class="fas fa-circle"></i> Installed';
            statusIndicator.classList.add('installed');
        }
    }

    showOnlineStatus() {
        const statusIndicator = document.getElementById('statusIndicator');
        if (statusIndicator) {
            statusIndicator.innerHTML = '<i class="fas fa-circle"></i> Online';
            statusIndicator.classList.remove('offline');
            statusIndicator.classList.add('online');
        }
    }

    showOfflineStatus() {
        const statusIndicator = document.getElementById('statusIndicator');
        if (statusIndicator) {
            statusIndicator.innerHTML = '<i class="fas fa-circle"></i> Offline';
            statusIndicator.classList.remove('online');
            statusIndicator.classList.add('offline');
        }
        
        if (window.jarvisApp) {
            window.jarvisApp.showMessage('📴 You are offline. Some features may be limited.', 'system');
        }
    }

    handleServiceWorkerUpdate(registration) {
        const newWorker = registration.installing;
        
        newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content is available
                this.showUpdateAvailable();
            }
        });
    }

    showUpdateAvailable() {
        if (window.jarvisApp) {
            const updateMessage = `
                <div class="update-notification">
                    <h4>🔄 Update Available</h4>
                    <p>A new version of J.A.R.V.I.S is available!</p>
                    <button onclick="window.pwaService.applyUpdate()" class="action-btn">
                        <i class="fas fa-sync"></i> Update Now
                    </button>
                </div>
            `;
            
            window.jarvisApp.showMessage(updateMessage, 'system');
        }
    }

    applyUpdate() {
        // Tell the service worker to skip waiting
        if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
        }
        
        // Reload the page to get the new version
        window.location.reload();
    }

    // Utility methods
    isAppInstalled() {
        return this.isInstalled;
    }

    isRunningStandalone() {
        return this.isStandalone;
    }

    getInstallStatus() {
        return {
            installed: this.isInstalled,
            standalone: this.isStandalone,
            canInstall: !!this.deferredPrompt
        };
    }
}

// Initialize PWA service
window.pwaService = new PWAService();

// Make it available globally
window.PWAService = PWAService;

console.log('✅ PWA Service initialized');
