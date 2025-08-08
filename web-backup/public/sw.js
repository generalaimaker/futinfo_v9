// Service Worker for Offline Support

const CACHE_NAME = 'futinfo-news-v1'
const API_CACHE_NAME = 'futinfo-api-v1'

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/favicon.ico',
  '/manifest.json',
  '/static/css/main.css',
  '/static/js/main.js'
]

// API endpoints to cache
const API_ROUTES = [
  '/api/news',
  '/api/news/categories'
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...')
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...')
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name => name !== CACHE_NAME && name !== API_CACHE_NAME)
            .map(name => caches.delete(name))
        )
      })
      .then(() => self.clients.claim())
  )
})

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleAPIRequest(request))
    return
  }
  
  // Handle static assets
  event.respondWith(handleStaticRequest(request))
})

// API request handler with Network First strategy
async function handleAPIRequest(request) {
  const cache = await caches.open(API_CACHE_NAME)
  
  try {
    // Try network first
    const networkResponse = await fetch(request.clone())
    
    // Cache successful responses
    if (networkResponse.ok) {
      // Clone the response before caching
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.log('Network request failed, trying cache...', error)
    
    // Fall back to cache
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      // Add a header to indicate this is from cache
      const headers = new Headers(cachedResponse.headers)
      headers.set('X-From-Cache', 'true')
      
      return new Response(cachedResponse.body, {
        status: cachedResponse.status,
        statusText: cachedResponse.statusText,
        headers: headers
      })
    }
    
    // Return offline response
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'No internet connection and no cached data available'
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

// Static asset handler with Cache First strategy
async function handleStaticRequest(request) {
  const cache = await caches.open(CACHE_NAME)
  
  // Try cache first
  const cachedResponse = await cache.match(request)
  if (cachedResponse) {
    return cachedResponse
  }
  
  try {
    // Fall back to network
    const networkResponse = await fetch(request)
    
    // Cache successful responses for static assets
    if (networkResponse.ok && request.method === 'GET') {
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const offlineResponse = await cache.match('/offline.html')
      if (offlineResponse) {
        return offlineResponse
      }
    }
    
    // Return 404 for other requests
    return new Response('Not found', { status: 404 })
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-news') {
    event.waitUntil(syncNews())
  }
})

async function syncNews() {
  try {
    // Fetch latest news when back online
    const response = await fetch('/api/news?category=all&limit=50')
    const data = await response.json()
    
    // Update cache
    const cache = await caches.open(API_CACHE_NAME)
    await cache.put(
      new Request('/api/news?category=all'),
      new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json' }
      })
    )
    
    // Notify clients
    const clients = await self.clients.matchAll()
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETE',
        data: { newsCount: data.data.length }
      })
    })
  } catch (error) {
    console.error('Background sync failed:', error)
  }
}

// Push notifications for new news
self.addEventListener('push', (event) => {
  if (!event.data) return
  
  const data = event.data.json()
  const { title, body, icon, badge, tag } = data
  
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: icon || '/icon-192.png',
      badge: badge || '/badge-72.png',
      tag: tag || 'news-update',
      data: data
    })
  )
})

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  const { data } = event.notification
  const url = data.url || '/'
  
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then(clientList => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus()
          }
        }
        
        // Open new window if needed
        if (clients.openWindow) {
          return clients.openWindow(url)
        }
      })
  )
})

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-news') {
    event.waitUntil(updateNewsInBackground())
  }
})

async function updateNewsInBackground() {
  try {
    // Fetch latest news
    const response = await fetch('/api/news?category=all&limit=20')
    const data = await response.json()
    
    // Check for new articles
    const cache = await caches.open(API_CACHE_NAME)
    const cachedResponse = await cache.match('/api/news?category=all')
    
    if (cachedResponse) {
      const cachedData = await cachedResponse.json()
      const newArticles = data.data.filter(article => 
        !cachedData.data.some(cached => cached.id === article.id)
      )
      
      if (newArticles.length > 0) {
        // Show notification for new articles
        self.registration.showNotification('New Football News!', {
          body: `${newArticles.length} new articles available`,
          icon: '/icon-192.png',
          badge: '/badge-72.png',
          tag: 'news-update',
          data: { url: '/' }
        })
      }
    }
    
    // Update cache
    cache.put(
      new Request('/api/news?category=all'),
      new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json' }
      })
    )
  } catch (error) {
    console.error('Background update failed:', error)
  }
}