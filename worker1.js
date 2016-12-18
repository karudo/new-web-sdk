console.log('sw version x');
Pushwoosh = [];
self.addEventListener('install', (event) => {
  console.info('onInstall', event);
  event.waitUntil(self.skipWaiting());
});
self.addEventListener('activate', function(event) {
  console.info('onActivate!', event);
  console.info(111, self.registration.active);
  event.waitUntil(caches.keys().then(cacheNames => {
    return Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
  }).then(() => self.clients.claim()));
});
self.addEventListener('push', (event) => {
  console.log(event, self.registration.active);
  if (event.data) {
    console.log(event.data.text());
  }
  event.waitUntil(self.registration.showNotification('title', {body: 'hello!'}));
});
