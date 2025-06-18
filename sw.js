/**
 * J.A.R.V.I.S Mobile App - Service Worker
 * Provides offline functionality and caching
 */

const CACHE_NAME = 'jarvis-mobile-v1.0.0';
const STATIC_CACHE = 'jarvis-static-v1.0.0';
const DYNAMIC_CACHE = 'jarvis-dynamic-v1.0.0';

// Files to cache for offline use
const STATIC_FILES = [
    '/',
    '/index.html',
    '/css/mobile.css',
    '/css/animations.css',
    '/js/mobile-app.js',
    '/js/voice-recognition.js',
    '/js/image-generation.js',
    '/js/whatsapp-integration.js',
    '/js/pwa-service.js',
    '/manifest.json',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
    '/icons/apple-touch-icon.png',
    'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Roboto:wght@300;400;500&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
];

// API endpoints that should be cached
const API_CACHE_PATTERNS = [
    /\/api\/chat/,
    /\/api\/status/,
    /\/api\/health/
];

// Install event - cache static files
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('Service Worker: Caching static files');
                return cache.addAll(STATIC_FILES);
            })
            .then(() => {
                console.log('Service Worker: Static files cached');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('Service Worker: Error caching static files', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                            console.log('Service Worker: Deleting old cache', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('Service Worker: Activated');
                return self.clients.claim();
            })
    );
});

// Fetch event - serve cached files or fetch from network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Handle different types of requests
    if (request.method === 'GET') {
        if (isStaticFile(request.url)) {
            // Static files - cache first strategy
            event.respondWith(cacheFirst(request));
        } else if (isAPIRequest(request.url)) {
            // API requests - network first strategy
            event.respondWith(networkFirst(request));
        } else if (isImageRequest(request.url)) {
            // Images - cache first strategy
            event.respondWith(cacheFirst(request));
        } else {
            // Other requests - network first strategy
            event.respondWith(networkFirst(request));
        }
    }
});

// Cache first strategy - good for static files
async function cacheFirst(request) {
    try {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
        
    } catch (error) {
        console.error('Cache first strategy failed:', error);
        return getOfflineFallback(request);
    }
}

// Network first strategy - good for API calls
async function networkFirst(request) {
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
        
    } catch (error) {
        console.log('Network failed, trying cache:', error);
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        return getOfflineFallback(request);
    }
}

// Check if request is for static file
function isStaticFile(url) {
    return STATIC_FILES.some(file => url.includes(file)) ||
           url.includes('.css') ||
           url.includes('.js') ||
           url.includes('.png') ||
           url.includes('.jpg') ||
           url.includes('.ico') ||
           url.includes('fonts.googleapis.com') ||
           url.includes('cdnjs.cloudflare.com');
}

// Check if request is for API
function isAPIRequest(url) {
    return API_CACHE_PATTERNS.some(pattern => pattern.test(url)) ||
           url.includes('/api/');
}

// Check if request is for image
function isImageRequest(url) {
    return url.includes('.png') ||
           url.includes('.jpg') ||
           url.includes('.jpeg') ||
           url.includes('.gif') ||
           url.includes('.webp') ||
           url.includes('.svg');
}

// Get offline fallback response
function getOfflineFallback(request) {
    const url = new URL(request.url);
    
    if (request.destination === 'document') {
        // Return cached index.html for navigation requests
        return caches.match('/index.html');
    }
    
    if (isImageRequest(request.url)) {
        // Return placeholder image for failed image requests
        return new Response(
            '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#333"/><text x="100" y="100" text-anchor="middle" fill="#fff" font-family="Arial" font-size="14">Image Unavailable</text></svg>',
            { headers: { 'Content-Type': 'image/svg+xml' } }
        );
    }
    
    if (isAPIRequest(request.url)) {
        // Return offline message for API requests
        return new Response(
            JSON.stringify({
                error: 'Offline',
                message: 'This feature requires an internet connection'
            }),
            {
                headers: { 'Content-Type': 'application/json' },
                status: 503
            }
        );
    }
    
    // Default offline response
    return new Response('Offline', { status: 503 });
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
    console.log('Service Worker: Background sync triggered', event.tag);
    
    if (event.tag === 'send-message') {
        event.waitUntil(syncMessages());
    } else if (event.tag === 'generate-image') {
        event.waitUntil(syncImageGeneration());
    }
});

// Sync offline messages when back online
async function syncMessages() {
    try {
        const messages = await getStoredMessages();
        for (const message of messages) {
            await sendMessage(message);
            await removeStoredMessage(message.id);
        }
        console.log('Service Worker: Messages synced');
    } catch (error) {
        console.error('Service Worker: Error syncing messages', error);
    }
}

// Sync offline image generation requests
async function syncImageGeneration() {
    try {
        const requests = await getStoredImageRequests();
        for (const request of requests) {
            await generateImage(request);
            await removeStoredImageRequest(request.id);
        }
        console.log('Service Worker: Image requests synced');
    } catch (error) {
        console.error('Service Worker: Error syncing image requests', error);
    }
}

// Push notification handling
self.addEventListener('push', (event) => {
    console.log('Service Worker: Push notification received');
    
    const options = {
        body: event.data ? event.data.text() : 'New message from J.A.R.V.I.S',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        vibrate: [200, 100, 200],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'open',
                title: 'Open J.A.R.V.I.S',
                icon: '/icons/icon-72x72.png'
            },
            {
                action: 'close',
                title: 'Close',
                icon: '/icons/icon-72x72.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('J.A.R.V.I.S AI Assistant', options)
    );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
    console.log('Service Worker: Notification clicked');
    
    event.notification.close();
    
    if (event.action === 'open') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Message handling from main thread
self.addEventListener('message', (event) => {
    console.log('Service Worker: Message received', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// Utility functions for IndexedDB operations
async function getStoredMessages() {
    // Implementation for getting stored messages from IndexedDB
    return [];
}

async function removeStoredMessage(id) {
    // Implementation for removing stored message from IndexedDB
}

async function getStoredImageRequests() {
    // Implementation for getting stored image requests from IndexedDB
    return [];
}

async function removeStoredImageRequest(id) {
    // Implementation for removing stored image request from IndexedDB
}

async function sendMessage(message) {
    // Implementation for sending message to API
}

async function generateImage(request) {
    // Implementation for generating image via API
}

console.log('Service Worker: Loaded successfully');
