/* Khung chung của các trang: thanh trên và menu phân hệ. Trang gọi CRCK.chon(phân hệ, mục), CRCK.vet([...]), CRCK.thuGon(true/false). */
(function () {
  'use strict';
  var nv = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
  var HINH = {
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    tim: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    mui: '<path d="m6 9 6 6 6-6"/>',
    toi: '<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/>',
    thu: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    kho: '<rect x="3" y="4" width="18" height="5" rx="1"/><path d="M5 9v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9M10 13h4"/>',
    ai: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/>',
    bo: '<path d="M3 7h6l2 2h10v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><path d="M3 7V5a1 1 0 0 1 1-1h5l2 3"/>',
    tq: '<path d="M4 20h16"/><path d="M7 16v-5M12 16V6M17 16v-8"/>',
    qt: '<rect x="3" y="4" width="6" height="6" rx="1"/><rect x="15" y="14" width="6" height="6" rx="1"/><path d="M9 7h5a2 2 0 0 1 2 2v5"/>',
    so: '<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11"/>',
    ds: '<path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/>',
    lich: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    moi: '<path d="M4 7h16v4H4zM5 11v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8M10 15h4"/>'
  };
  function svg(t) { return '<svg ' + nv + '>' + (HINH[t] || '') + '</svg>'; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function pvDau() {
    var v = null;
    try { v = localStorage.getItem('tclt_pv'); } catch (e) {}
    if (v === null) v = 'crck2.tchc';
    return encodeURIComponent(v || 'tat-ca');
  }
  function linkTra(t, q) { return 'index.html#/' + pvDau() + '/' + t + (q ? '?q=' + encodeURIComponent(q) : ''); }
  var MENU = [
    { id: 'tracuu', ten: 'Tra cứu lưu trữ', hinh: 'kho', muc: [
      { id: 'tim', ten: 'Tìm kiếm', hinh: 'tim', link: function () { return linkTra('tim'); } },
      { id: 'bo', ten: 'Bộ hồ sơ', hinh: 'bo', link: function () { return linkTra('bo'); } },
      { id: 'tong', ten: 'Tổng quan kho', hinh: 'tq', link: function () { return linkTra('tong'); } },
      { id: 'tc2', ten: 'Tra cứu 2.0', hinh: 'ds', nhan: 'thử', link: function () { return 'tracuu2.html'; } }] },
    { id: 'vanthu', ten: 'Văn thư', hinh: 'thu', muc: [
      { id: 'tong', ten: 'Tổng quan', hinh: 'tq', link: function () { return 'vanthu.html#/'; } },
      { id: 'qt', ten: 'Quy trình', hinh: 'qt', link: function () { return 'vanthu.html#/quytrinh'; } },
      { id: 'so', ten: 'Sổ văn thư', hinh: 'so', link: function () { return 'vanthu.html#/so'; } },
      { id: 'phieu', ten: 'Danh sách phiếu', hinh: 'ds', link: function () { return 'vanthu.html#/phieu'; } }] },
    { id: 'lich', ten: 'Lịch', hinh: 'lich', muc: [
      { id: 'lich', ten: 'Lịch làm việc', hinh: 'lich', link: function () { return 'lich.html'; } }] },
    { id: 'ai', ten: 'Chạy AI', hinh: 'ai', muc: [
      { id: 'ai', ten: 'Theo dõi, điều khiển', hinh: 'ai', link: function () { return 'index.html#/ai'; } }] }
  ];
  var S = { ph: '', muc: '', moNhom: '' };
  var top = document.getElementById('ckTop'), ben = document.getElementById('ckBen');

  function veBen() {
    ben.setAttribute('aria-label', 'Menu phân hệ');
    ben.innerHTML = '<div class="ck-nhan">Phân hệ</div>' + MENU.map(function (p) {
      var mo = S.moNhom === p.id;
      return '<button type="button" class="ck-ph-he" data-ckph="' + p.id + '" aria-expanded="' + mo + '">' + svg(p.hinh) + '<span>' + esc(p.ten) + '</span><svg class="ck-mui" ' + nv + '>' + HINH.mui + '</svg></button>' +
        '<div class="ck-nhom"' + (mo ? '' : ' hidden') + '>' + p.muc.map(function (m) {
          var chon = S.ph === p.id && S.muc === m.id;
          return '<a class="ck-muc' + (chon ? ' chon' : '') + '"' + (chon ? ' aria-current="page"' : '') + ' href="' + esc(m.link()) + '" data-ckmuc="' + p.id + ':' + m.id + '"><i>' + svg(m.hinh) + '</i><span>' + esc(m.ten) + '</span>' + (m.nhan ? '<small>' + esc(m.nhan) + '</small>' : '') + '</a>';
        }).join('') + '</div>';
    }).join('') + '<div class="ck-ben-duoi"><span>Tài liệu số hoá</span><button type="button" class="ck-nut-tron" id="nutTheme" title="Đổi giao diện sáng, tối" aria-label="Đổi giao diện sáng, tối">' + svg('toi') + '</button></div>';
    ganTheme();
  }
  function ganTheme() {
    var n = document.getElementById('nutTheme');
    if (n) n.onclick = function () {
      var r = document.documentElement, toi = r.getAttribute('data-theme') === 'dark';
      r.setAttribute('data-theme', toi ? 'light' : 'dark');
      try { localStorage.setItem('tclt_theme', toi ? 'light' : 'dark'); } catch (e) {}
    };
  }
  top.innerHTML = '<button type="button" class="ck-burger" id="ckBurger" aria-label="Mở menu" title="Mở menu">' + svg('menu') + '</button>' +
    '<a class="ck-hieu" href="index.html" title="Về trang tra cứu"><img src="img/logo-vrg.png" alt="VRG Rubber"><b>CRCK Lưu trữ</b></a>' +
    '<nav class="ck-vet" id="ckVet" aria-label="Đường dẫn"></nav>' +
    '<form class="ck-tim" id="ckTim" role="search">' + svg('tim') + '<input type="search" id="ckTimO" placeholder="Tìm văn bản lưu trữ" aria-label="Tìm văn bản lưu trữ" autocomplete="off"></form>';
  var man = document.createElement('div');
  man.className = 'ck-man'; man.id = 'ckMan';
  document.body.appendChild(man);

  function dongNgan() { document.body.classList.remove('ck-mo'); }
  document.getElementById('ckBurger').onclick = function () { document.body.classList.toggle('ck-mo'); };
  man.onclick = dongNgan;
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') dongNgan(); });
  ben.addEventListener('click', function (e) {
    var p = e.target.closest('[data-ckph]');
    if (p) { S.moNhom = S.moNhom === p.dataset.ckph ? '' : p.dataset.ckph; veBen(); return; }
    var m = e.target.closest('[data-ckmuc]');
    if (!m) return;
    dongNgan();
    var x = m.dataset.ckmuc.split(':');
    // Trang có cách chuyển riêng (không tải lại, giữ phạm vi đang xem) thì để trang xử lý
    if (CRCK.khiBam && CRCK.khiBam(x[0], x[1])) e.preventDefault();
  });
  document.getElementById('ckTim').onsubmit = function (e) {
    e.preventDefault();
    var q = document.getElementById('ckTimO').value.trim();
    if (!q) return;
    if (CRCK.khiTim && CRCK.khiTim(q)) return;
    location.href = linkTra('tim', q);
  };

  var CRCK = window.CRCK = {
    hinh: svg,
    chon: function (ph, muc) { S.ph = ph; S.muc = muc; S.moNhom = ph; veBen(); },
    vet: function (ds) {
      document.getElementById('ckVet').innerHTML = ds.map(function (x) {
        return (Array.isArray(x) ? '<a href="' + esc(x[1]) + '">' + esc(x[0]) + '</a>' : '<span>' + esc(x) + '</span>');
      }).join('<i aria-hidden="true">›</i>');
    },
    thuGon: function () { dongNgan(); }
  };
  veBen();
})();
