importScripts('/src/js/idb.js');
importScripts('/src/js/dbUtils.js');

var CACHE_STATIC = 'static-v9';
var CACHE_DYNAMIC = 'dynamic-v5';

function trimCaches(cacheName, maxItems) {
  caches.open(cacheName).then((cache) => {
    return cache.keys().then((keys) => {
      if (keys.length > maxItems) {
        cache.delete(keys[0]).then(trimCaches(cacheName, maxItems));
      }
    });
  })
}

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
          '/src/js/idb.js',
          '/src/js/dbUtils.js',
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
  var url = 'https://pwagram-be351-default-rtdb.europe-west1.firebasedatabase.app/posts.json';

  if (event.request.url.indexOf(url) > -1) {
    // Strategy: Save into cache each request and take from cache if exists, but also make a request anyway
    event.respondWith(
      fetch(event.request).then((res) => {
        var clonedRes = res.clone();

        // Clear all storage. Some items can be deleted on the server
        clearAllData(POSTS_STORE).then(() => {
          return clonedRes.json();
        }).then((data) => {
          Object.keys(data).forEach((card) => {
            // Open IndexedDB store and put data
            writeData(POSTS_STORE, data[card]);
          })
        })

        return res;
      })
    );
  } else {
    // Strategy: Old caching strategy. Take from cache.
    event.respondWith(
      caches.match(event.request)
        .then((cachedData) => {
          if (cachedData) {
            return cachedData;
          } else {
            return fetch(event.request)
              .then((res) => {
                caches.open(CACHE_DYNAMIC)
                  .then((cache) => {
                    cache.put(event.request.url, res.clone());
                    return res;
                  })
              })
              .catch((err) => {
                console.log('[Service worker] Fetch error: ', err);
                return caches.open(CACHE_STATIC).then(() => {
                  if (event.request.headers.get('accept').includes('text/html')) {
                    return caches.match('/offline.html');
                  }
                })
              });
          }
        })
    );
  }
});

self.addEventListener('sync', function(event) {
  var url = 'https://pwagram-be351-default-rtdb.europe-west1.firebasedatabase.app/posts.json';

  console.log('[Service worker] Background syncing: ', event);

  if (event.tag === 'sync-new-posts') {
    console.log('[Service worker] Syncing new Posts.');

    event.waitUntil(
      readAllData(SYNC_POSTS_STORE).then((data) => {
        for (var post of data) {

          // Make sure that ".write": true inside the Firebase Realtime Database
          fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify({
              id: post.id,
              title: post.title,
              location: post.location,
              image: 'https://ogletree.com/app/uploads/Locations/Images/WashingtonDC_GettyImages-922906670-scaled.jpg',
            }),
          }).then((res) => {
            if (res.ok) {
              deleteItem(SYNC_POSTS_STORE, post.id);
            }
          }).catch((err) => {
            console.log('Error while sending data', err);
          });
        }
      })
    );
  }
});
