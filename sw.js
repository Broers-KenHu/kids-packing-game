// 小小打包台：离线缓存。
// 第一次打开时把游戏的几个文件存到平板上，以后没网也能玩；有网时在后台顺便更新。
// 只缓存本站自己的文件，不碰任何别的网站。
var CACHE = "kids-pack-v4";
var FILES = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/maskable-512.png",
  "./icons/apple-touch-icon.png"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE)
      .then(function (cache) { return cache.addAll(FILES); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.filter(function (key) { return key !== CACHE; }).map(function (key) { return caches.delete(key); }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (event) {
  var request = event.request;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;
  var key = request.mode === "navigate" ? "./index.html" : request;
  var network = fetch(request).then(function (response) {
    if (response && response.ok && response.type === "basic") {
      var copy = response.clone();
      caches.open(CACHE).then(function (cache) { cache.put(key, copy); });
    }
    return response;
  });
  event.waitUntil(network.catch(function () { /* 没网 */ }));
  event.respondWith(
    caches.match(key, { ignoreSearch: true }).then(function (hit) {
      return hit || network.catch(function () { return Response.error(); });
    })
  );
});
