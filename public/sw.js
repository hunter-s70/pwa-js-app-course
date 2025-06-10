var CACHE_STATIC = 'static-v5';
var CACHE_DYNAMIC = 'dynamic-v3';

self.addEventListener('install', function(event) {
  console.log('[Service worker] Installing SW...', event);
  event.waitUntil(
    caches.open(CACHE_STATIC)
      .then((cache) => {
        cache.addAll([
          '/',
          '/index.html',
          '/offline.html',
          '/src/css/app.css',
          '/src/css/feed.css',
          '/src/js/app.js',
          '/src/js/feed.js',
          '/src/js/fetch.js',
          '/src/js/promise.js',
          '/src/js/material.min.js',
          '/src/images/main-image.jpg',
          'https://fonts.googleapis.com/css?family=Roboto:400,700',
          'https://fonts.googleapis.com/icon?family=Material+Icons',
          'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css',
        ])
      })
  );
  return self.clients.claim();
});

self.addEventListener('activate', function(event) {
  console.log('[Service worker] Activating SW...', event);
  event.waitUntil(
    caches.keys()
      .then((cacheKeys) => {
        return Promise.all(cacheKeys.map((key) => {
          if (key !== CACHE_STATIC && key !== CACHE_DYNAMIC) {
            console.log('[Service worker] Removing old cache...', key);
            return caches.delete(key);
          }
        }));
      })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', function(event) {
  var url = 'https://httpbin.org/get';

  if (event.request.url.indexOf(url) > -1) {
    // Strategy: Save into cache each request and take from cache if exists, but also make a request anyway
    event.respondWith(
      caches.open(CACHE_DYNAMIC)
        .then((cache) => {
          return fetch(event.request).then((res) => {
            cache.put(event.request, res.clone());
            return res;
          })
        })
    );
  } else {
    // Strategy: Old caching strategy. Take from cache.
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          if (response) {
            return response;
          } else {
            return fetch(event.request)
              .then((res) => {
                caches.open(CACHE_DYNAMIC)
                  .then((cache) => {
                    cache.put(event.request, res.clone());
                    return res;
                  })
              })
              .catch((err) => {
                console.log('fetch error: ', err);
                return caches.open(CACHE_STATIC).then(() => {
                  return caches.match('/offline.html');
                })
              });
          }
        })
    );
  }
});
