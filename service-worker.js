const CACHE_NAME = 'app-cache-v1.1';
const urlsToCache = [
  '/',
  '/index.html',
  '/home.html',
  '/search.html',
  '/setting.html',
  '/profile.html',
  '/thread.html',
  '/thread-room.html',
  '/chat.html',
  '/message.html',
  '/register.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/chat.js',
  '/firebase.js',
  '/home.js',
  '/message.js',
  '/profile.js',
  '/register.js',
  '/search.js',
  '/setting.js',
  '/thread.js',
  '/threadRoom.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // キャッシュにあればそれを返す。なければネットワークから取得
      return response || fetch(event.request);
    })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});