const CACHE_NAME = "devcanvas-v1";

const APP_FILES = [
  "./",
  "./index.html",
  "./workspace.html",
  "./settings.html",

  "./css/variables.css",
  "./css/base.css",
  "./css/layout.css",
  "./css/components.css",

  "./js/app.js",
  "./js/workspace.js",
  "./js/database.js",
  "./js/projects.js",
  "./js/settingsStore.js",
  "./js/settingsPage.js",
  "./js/files.js",
  "./js/export.js",
  "./js/ui.js",
  "./js/state.js",
  "./js/serviceWorker.js"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_FILES))
  );

  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }

          return null;
        })
      );
    })
  );

  self.clients.claim();
});

self.addEventListener("fetch", event => {
  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  const requestURL = new URL(request.url);

  if (requestURL.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then(response => {
        const responseClone = response.clone();

        caches.open(CACHE_NAME)
          .then(cache => {
            cache.put(request, responseClone);
          });

        return response;
      })
      .catch(() => {
        return caches.match(request);
      })
  );
});

