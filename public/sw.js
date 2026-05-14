// Dummy Service Worker for PWA "Add to Homescreen"
// It fulfills the browser requirement of having a fetch handler

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  return self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  // Pass through all requests
})
