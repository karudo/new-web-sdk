self.addEventListener('install', (event) => {
  this.logger.info('onInstall', event);
  event.waitUntil(self.skipWaiting());
});
self.addEventListener('activate', function(event) {
  this.logger.info('onActivate', event);
  event.waitUntil(caches.keys().then(cacheNames => {
    return Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
  }).then(() => self.clients.claim()));
});
