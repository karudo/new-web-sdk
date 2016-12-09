self.addEventListener('install', (event) => {
  console.info('onInstall', event);
  event.waitUntil(self.skipWaiting());
});
self.addEventListener('activate', function(event) {
  console.info('onActivate', event);
  event.waitUntil(caches.keys().then(cacheNames => {
    return Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
  }).then(() => self.clients.claim()));
});
self.addEventListener('push', (event) => {
  console.log(event);
});
