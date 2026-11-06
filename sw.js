/* Chạy offline cho khung trang: trang, CSS, JS, ảnh cùng nguồn.
   Mở lần nào cũng dùng bản đã lưu trước rồi cập nhật ngầm cho lần sau.
   Dữ liệu (API) không lưu ở đây: trang Văn thư tự giữ bản sổ gần nhất trong IndexedDB. */
var PHIEN_BAN = 'crck-v2';
var KHUNG = ['./', 'index.html', 'vanthu.html', 'tracuu2.html', 'lich.html', 'crck.css', 'crck.js', 'lich.css', 'lich.js', 'img/logo-vrg.png', 'img/base-service.png', 'img/base-office.png', 'img/icon-192.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(PHIEN_BAN).then(function (c) { return Promise.all(KHUNG.map(function (u) { return c.add(u).catch(function () {}); })); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== PHIEN_BAN; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(caches.open(PHIEN_BAN).then(function (c) {
    // Trang: ưu tiên mạng (luôn mới), mất mạng thì dùng bản đã lưu. Tệp tĩnh: dùng bản đã lưu, cập nhật ngầm.
    var trang = r.mode === 'navigate' || /\.html$/.test(u.pathname);
    var mang = fetch(r).then(function (res) { if (res && res.ok) c.put(r, res.clone()); return res; });
    if (trang) return mang.catch(function () { return c.match(r, { ignoreSearch: true }).then(function (x) { return x || c.match('vanthu.html'); }); });
    return c.match(r).then(function (x) {
      if (x) { mang.catch(function () {}); return x; }
      return mang.catch(function () { return c.match(r, { ignoreSearch: true }); });   // mất mạng, chưa có đúng phiên bản: dùng bản gần nhất
    });
  }));
});
