/* =====================================================================
   Văn thư › Chức năng › "Tất cả": một ô tìm, một danh sách kết quả gộp từ cả hai nguồn.
   - Sổ văn thư: lọc ngay trên dữ liệu sổ trang đã tải (DS, các hàm tìm của vanthu.html).
   - Số hóa: tìm trong toàn kho lưu trữ trên máy chủ (GET /api/exec?action=timKiem).
   Khung nằm ngoài #man nên vẽ lại trang không làm mất từ khoá, con trỏ và trang đang xem.
   ===================================================================== */
(function () {
  'use strict';
  var API = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) && location.port === '8080' ? location.origin + '/api/exec'
    : 'https://document-search-api-319700450833.us-central1.run.app/api/exec';
  var CO = 20, CO_MAY = 200, NAM_DAU = 1979;
  var CTY_KHO = { CRCK2: 'crck2', BHCK: 'bhck' };          // kho số hóa chỉ có hai công ty này
  var TRUONG = [['tat', 'Tất cả trường'], ['so', 'Số ký hiệu'], ['trich', 'Trích yếu'], ['cq', 'Cơ quan ban hành'], ['doiTac', 'Đối tác / nơi nhận']];
  var COT_THEO_TRUONG = { so: ['so', 'soGoc'], trich: ['trich'], cq: ['coQuan'], doiTac: ['donViNhan'] };
  var KHOP_AN = [['tomTat', 'Tóm tắt'], ['nguoiKy', 'Người ký'], ['nguoiSoan', 'Người soạn'], ['dvThucHien', 'Đơn vị thực hiện'], ['chuTri', 'Chủ trì'], ['nguoiTheoDoi', 'Người theo dõi'], ['phanLoai', 'Phân loại']];
  var T = { q: '', truong: 'tat', ct: 'tat', nam: '', sx: '', trang: 1 };
  var KHO = trong(''), NHO = {};                          // kết quả bên số hóa của điều kiện đang tìm: tải dần từng 200 dòng
  var SO = [], khung = null, hen = null, huy = null, XEM = null;
  var $k = function (s) { return khung.querySelector(s); };

  function hinh(d) { return '<svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>'; }
  var IC_XEM = hinh('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'), IC_TAI = hinh('<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>');
  var linkXem = function (id, kieu) { return 'https://drive.google.com/file/d/' + encodeURIComponent(id) + '/' + (kieu || 'view'); };
  var linkTai = function (id) { return 'https://drive.google.com/uc?export=download&id=' + encodeURIComponent(id); };
  var so = function (n) { return Number(n).toLocaleString('vi-VN'); };

  function trong(khoa) { return { khoa: khoa, ds: [], tai: 0, tong: null, moRong: false, dang: false, loi: '' }; }
  function tuTo() { var P = phanTichTim(T.q); return P.tu.concat(P.cum); }
  function to(chu, cot) { return hlTim(chu, T.truong === 'tat' || T.truong === cot ? tuTo() : []); }

  /* ---------- sổ văn thư ---------- */
  function diemTruong(p, P) {
    var txt = COT_THEO_TRUONG[T.truong].map(function (i) { return chuCot(p, i); }).join(' | ');
    if (P.tu.some(function (t) { return !coTuSo(txt, t); }) || P.cum.some(function (c) { return txt.indexOf(c) < 0; }) || P.tru.some(function (t) { return coTuSo(txt, t); })) return -1;
    return txt.indexOf(P.tu.concat(P.cum).join(' ')) >= 0 ? 10 : 0;
  }
  function ngaySo(p) { return p.ngayVb || p.ngay || 0; }
  function locSo() {
    var P = phanTichTim(T.q), kq = [];
    DS.forEach(function (p) {
      if (T.ct !== 'tat' && p.dv !== T.ct) return;
      if (T.nam && (!ngaySo(p) || layNam(ngaySo(p)) !== Number(T.nam))) return;
      var d = 0;
      if (!P.rong) { d = T.truong === 'tat' ? diemTim(p, P, 'tat') : diemTruong(p, P); if (d < 0) return; }
      kq.push({ p: p, d: d });
    });
    var theo = T.sx || (P.rong ? 'moi' : 'lq');
    kq.sort(function (a, b) {
      if (theo === 'cu') return (ngaySo(a.p) || 9e15) - (ngaySo(b.p) || 9e15);
      return (theo === 'lq' ? b.d - a.d : 0) || ngaySo(b.p) - ngaySo(a.p);
    });
    SO = kq.map(function (x) { return x.p; });
  }
  /** Từ khoá chỉ khớp ở trường không hiện trên dòng thì ghi rõ khớp ở đâu. */
  function khopAn(p) {
    var tus = tuTo(); if (T.truong !== 'tat' || !tus.length) return '';
    var hien = ['so', 'soGoc', 'trich', 'coQuan', 'donViNhan'].map(function (i) { return chuCot(p, i); }).join(' | ');
    var thieu = tus.filter(function (t) { return !coTuSo(hien, t); }); if (!thieu.length) return '';
    for (var i = 0; i < KHOP_AN.length; i++) {
      var chu = String(p[KHOP_AN[i][0]] || ''), b = boDau(chu), vt = -1;
      thieu.some(function (t) { vt = b.indexOf(t); return vt >= 0; });
      if (vt >= 0) { var dau = Math.max(0, vt - 50); return '<span class="tc-phu"><b>' + KHOP_AN[i][1] + ':</b> ' + (dau ? '…' : '') + hlTim(chu.slice(dau, vt + 90), tus) + (chu.length > vt + 90 ? '…' : '') + '</span>'; }
    }
    return '';
  }
  function dongSo(p) {
    return '<tr data-tcp="' + esc(p.id) + '"><td class="tc-c1">' + chipChieu(p.chieu) + (p.loai && p.loai[1] ? ' <span class="tc-loai" title="' + esc(p.loai[1]) + '">' + esc(p.loai[1]) + '</span>' : '') +
      '<span class="tc-so">' + to(maHien(p), 'so') + '</span>' + (p.chieu === 'den' && p.soGoc ? '<span class="tc-phu">Số gốc: ' + to(p.soGoc, 'so') + '</span>' : '') + '</td>' +
      '<td class="tc-c2"><a href="#/phieu/' + esc(p.id) + '">' + to(p.trich || tenPhieu(p), 'trich') + '</a><span class="tc-tt">' + chipPhieu(p) + '</span>' + khopAn(p) + '</td>' +
      '<td data-nhan="Cơ quan">' + (to(p.coQuan || '', 'cq') || '—') + (p.chieu === 'di' && p.donViNhan ? '<span class="tc-phu">→ ' + to(p.donViNhan, 'doiTac') + '</span>' : '') + '<span class="tc-cty">' + esc(p.dv) + '</span></td>' +
      '<td data-nhan="Ngày" class="tc-ngay">' + (ngaySo(p) ? ngay(ngaySo(p)) : '—') + '</td><td data-nhan="Trang">' + esc(p.soTrang || '—') + '</td><td class="tc-nut">' + nutLienKet(p) + '</td></tr>';
  }

  /* ---------- số hóa (máy chủ) ---------- */
  function urlKho(trang) {
    var p = new URLSearchParams({ action: 'timKiem', trang: trang, co: CO_MAY });
    var q = T.q.split(/\s+/).filter(function (t) { return !(t.length > 1 && t[0] === '-'); }).join(' ').trim();   // máy chủ không hiểu "-từ"
    if (q) { p.set('q', q); if (T.truong !== 'tat') p.set('truong', T.truong); }
    if (CTY_KHO[T.ct]) p.set('phamVi', CTY_KHO[T.ct]);
    if (T.nam) { p.set('tu', T.nam + '-01-01'); p.set('den', T.nam + '-12-31'); }
    if (T.sx && T.sx !== 'lq') p.set('sx', T.sx === 'moi' ? 'ngay_giam' : 'ngay_tang');
    return API + '?' + p.toString();
  }
  /** Chọn công ty không có trong kho thì không lấy bên số hóa, kẻo danh sách lẫn công ty khác. */
  function coKho() { return T.ct === 'tat' || !!CTY_KHO[T.ct]; }
  function goiMay(url, lan) {
    huy = new AbortController();
    var c = huy, qua = setTimeout(function () { c.quaGio = true; c.abort(); }, 25000);
    return fetch(url, { signal: c.signal }).then(function (r) { return r.json(); }).then(function (j) {
      clearTimeout(qua); if (!j.ok) throw new Error(j.loi || 'API lỗi'); return j.data;
    }).catch(function (e) {
      clearTimeout(qua);
      if (c !== huy) throw { bo: true };                       // đã có lần tìm mới hơn
      if (lan < 1) return goiMay(url, lan + 1);                // máy chủ treo / lỗi lẻ: tự thử lại 1 lần
      throw c.quaGio ? new Error('máy chủ không trả lời sau 25 giây') : e;
    });
  }
  function boDangTai() { if (huy) { var cu = huy; huy = null; cu.abort(); } }
  function timKho(lamLai) {
    if (!coKho()) { boDangTai(); KHO = trong(''); KHO.tong = 0; ve(); return; }
    var khoa = urlKho(1);
    if (khoa !== KHO.khoa) { boDangTai(); KHO = NHO[khoa] || trong(khoa); }
    if (KHO.dang) { ve(); return; }
    if (lamLai) KHO.loi = '';
    // trang n của danh sách gộp cần tối đa n × 20 dòng đầu của bên số hóa
    if (KHO.loi || (KHO.tong !== null && KHO.ds.length >= Math.min(T.trang * CO, KHO.tong))) { ve(); return; }
    var K = KHO; K.dang = true; ve();
    goiMay(urlKho(K.tai + 1), 0).then(function (d) {
      K.dang = false; K.ds = K.ds.concat(d.ketQua); K.tai++; K.tong = d.ketQua.length ? d.tong : K.ds.length; K.moRong = d.moRong; NHO[K.khoa] = K;
      if (K === KHO) timKho();
    }).catch(function (e) { K.dang = false; if (e.bo || K !== KHO) return; K.loi = e.message; ve(); });
  }
  function ngayKho(d) { var m = /^(\d{4})-(\d\d)-(\d\d)/.exec(d.ngayIso || ''); return m ? m[3] + '/' + m[2] + '/' + m[1] : (d.ngay || (d.nam ? String(d.nam) : '—')); }
  function nutKho(d) {
    return d.driveId ? '<button type="button" class="tc-ic" data-tcxem="' + esc(d.id) + '" title="Xem nhanh" aria-label="Xem nhanh">' + IC_XEM + '</button>' +
      '<a class="tc-ic" href="' + linkTai(d.driveId) + '" target="_blank" rel="noopener" title="Tải xuống" aria-label="Tải ' + esc(d.tenFile) + '">' + IC_TAI + '</a>' : '';
  }
  function dongKho(d) {
    var ghi = [d.tenHoSo ? 'Hồ sơ: ' + d.tenHoSo : '', d.thung ? 'Thùng ' + d.thung : '', d.phong].filter(Boolean).join(' · ');
    return '<tr data-tcxem="' + esc(d.id) + '"><td class="tc-c1"><span class="chip tc-nguon">Số hóa</span> ' + (d.loai ? '<span class="tc-loai" title="' + esc(d.loai) + '">' + esc(d.loai) + '</span>' : '') +
      '<span class="tc-so">' + (d.soKyHieu ? to(d.soKyHieu, 'so') : 'Không có số') + '</span></td>' +
      '<td class="tc-c2"><b>' + to(d.trichYeu || d.tenFile || 'Chưa có dữ liệu', 'trich') + '</b>' + (ghi ? '<span class="tc-phu">' + esc(ghi) + '</span>' : '') + '</td>' +
      '<td data-nhan="Cơ quan">' + (to(d.coQuan || '', 'cq') || '—') + (d.doiTacB ? '<span class="tc-phu">→ ' + to(d.doiTacB, 'doiTac') + '</span>' : '') + '<span class="tc-cty">' + esc(d.congTy) + '</span></td>' +
      '<td data-nhan="Ngày" class="tc-ngay">' + esc(ngayKho(d)) + '</td><td data-nhan="Trang">' + esc(d.soTrang || '—') + '</td><td class="tc-nut">' + nutKho(d) + '</td></tr>';
  }

  /* ---------- vẽ ---------- */
  function bang(dong) {
    return '<div class="the tc-khung"><table class="tc-bang"><colgroup><col style="width:190px"><col><col style="width:230px"><col style="width:104px"><col style="width:62px"><col style="width:96px"></colgroup>' +
      '<thead><tr><th>Loại · Số ký hiệu</th><th>Trích yếu</th><th>Cơ quan / Đối tác</th><th>Ngày</th><th>Trang</th><th><span class="tc-an">Thao tác</span></th></tr></thead><tbody>' + dong + '</tbody></table></div>';
  }
  function phan(trang, tong, soTrang) {
    return '<div class="tc-trang"><span>' + so((trang - 1) * CO + 1) + '–' + so(Math.min(tong, trang * CO)) + ' / ' + so(tong) + ' văn bản</span>' +
      (soTrang > 1 ? '<span><button type="button" class="nut" data-tct="' + (trang - 1) + '"' + (trang <= 1 ? ' disabled' : '') + '>‹ Trước</button> <span class="so">Trang ' + so(trang) + ' / ' + so(soTrang) + '</span> <button type="button" class="nut" data-tct="' + (trang + 1) + '"' + (trang >= soTrang ? ' disabled' : '') + '>Sau ›</button></span>' : '') + '</div>';
  }
  function cachSap() { return T.sx || (phanTichTim(T.q).rong ? 'moi' : 'lq'); }
  /** can dòng đầu của danh sách gộp. Theo ngày: trộn theo ngày (không có ngày xuống cuối). Theo liên quan: điểm hai bên không so được nên xen kẽ. */
  function gop(can) {
    var a = SO, b = KHO.ds, i = 0, j = 0, ra = [], theo = cachSap();
    while (ra.length < can && (i < a.length || j < b.length)) {
      var laySo;
      if (j >= b.length) laySo = true;
      else if (i >= a.length) laySo = false;
      else if (theo === 'lq') laySo = i <= j;
      else {
        var x = ngaySo(a[i]) ? new Date(ngaySo(a[i]) + 7 * GIO).toISOString().slice(0, 10) : '', y = String(b[j].ngayIso || b[j].nam || '').slice(0, 10);   // máy chủ xếp văn bản chỉ rõ năm vào đúng năm đó
        laySo = !y ? true : !x ? false : theo === 'cu' ? x <= y : x >= y;
      }
      ra.push(laySo ? dongSo(a[i++]) : dongKho(b[j++]));
    }
    return ra;
  }
  function ve() {
    if (!khung || khung.hidden) return;
    var P = phanTichTim(T.q), choDau = KHO.dang && KHO.tong === null, tongKho = KHO.tong || 0, tong = SO.length + tongKho;
    $k('#tcSx').querySelector('[value="lq"]').disabled = P.rong;
    $k('#tcSx').value = cachSap();
    $k('#tcDem').innerHTML = '<b>' + so(tong) + (choDau ? '+' : '') + ' văn bản</b> · sổ văn thư ' + so(SO.length) + ' · số hóa ' + (choDau ? 'đang tìm…' : KHO.loi && KHO.tong === null ? 'lỗi' : so(tongKho));
    var ghi = [];
    if (!coKho()) ghi.push('Kho số hóa chỉ có CRCK2 và BHCK nên với ' + esc(T.ct) + ' chỉ hiện kết quả trong sổ');
    if (KHO.moRong && !P.rong) ghi.push('Bên số hóa không có văn bản khớp đủ từ khoá, đang gồm cả kết quả gần đúng');
    if (KHO.loi) ghi.push('Không tìm được bên số hóa: ' + esc(KHO.loi) + ' <button type="button" class="nut" data-tcthu="1">Thử lại</button>');
    $k('#tcGhi').innerHTML = ghi.join(' · ');
    var el = $k('#tcKq');
    el.classList.toggle('tc-cho', KHO.dang && !choDau);
    if (KHO.dang && !choDau) return;                       // đang tải thêm để sang trang: giữ trang đang xem
    var soTrang = Math.max(1, Math.ceil(tong / CO));
    if (!KHO.dang && !KHO.loi) T.trang = Math.min(T.trang, soTrang);
    var dong = gop(T.trang * CO).slice((T.trang - 1) * CO);
    el.innerHTML = dong.length ? bang(dong.join('')) + (choDau ? '' : phan(T.trang, tong, soTrang))
      : choDau || KHO.loi ? '<div class="the rong">' + (choDau ? 'Đang tìm…' : 'Chưa có kết quả') + '</div>'
      : '<div class="the rong">Không có văn bản nào khớp. Thử bớt từ khoá, đổi "Tìm trong" về Tất cả trường hoặc chọn Mọi năm.</div>';
  }
  /** Đổi điều kiện tìm: về trang 1. */
  function timLai() { T.trang = 1; locSo(); timKho(); }

  /* ---------- xem nhanh văn bản số hóa ---------- */
  function veXem() {
    var h = $k('#tcXem');
    if (!XEM) { h.innerHTML = ''; document.body.style.overflow = ''; return; }
    var d = XEM, ten = [d.loai, d.soKyHieu].filter(Boolean).join(' ') || d.tenFile;
    var tt = [['Trích yếu', d.trichYeu], ['Ngày', ngayKho(d)], ['Cơ quan ban hành', d.coQuan], ['Đối tác', d.doiTacB], ['Giá trị', d.giaTri], ['Tên hồ sơ', d.tenHoSo], ['Thùng', d.thung], ['Công ty · Phòng', [d.congTy, d.phong].filter(Boolean).join(' · ')], ['Số trang', d.soTrang], ['File', d.tenFile]]
      .filter(function (x) { return x[1]; }).map(function (x) { return '<dt>' + x[0] + '</dt><dd>' + esc(x[1]) + '</dd>'; }).join('');
    h.innerHTML = '<div class="tc-nen" data-tcdong="1"><div class="tc-hop" role="dialog" aria-modal="true" aria-label="' + esc(ten) + '"><div class="tc-hop-dau"><h2>' + esc(ten) + '</h2><button type="button" class="tc-dong" data-tcdong="1" aria-label="Đóng">×</button></div>' +
      '<div class="tc-hop-than"><iframe src="' + linkXem(d.driveId, 'preview') + '" title="Xem file ' + esc(d.tenFile) + '" allow="autoplay"></iframe><div class="tc-hop-ben"><dl>' + tt + '</dl>' +
      '<a class="nut chinh" href="index.html#/tat-ca/tim?vb=' + encodeURIComponent(d.id) + '" target="_blank" rel="noopener">Chi tiết trong kho</a><a class="nut" href="' + linkXem(d.driveId) + '" target="_blank" rel="noopener">Mở trên Drive</a><a class="nut" href="' + linkTai(d.driveId) + '" target="_blank" rel="noopener">Tải xuống</a>' +
      '<small>Xem và tải qua Google Drive: cần đăng nhập tài khoản có quyền xem thư mục lưu trữ.</small></div></div></div></div>';
    document.body.style.overflow = 'hidden';
    h.querySelector('.tc-dong').focus();
  }

  function dung() {
    var nam = []; for (var n = new Date().getFullYear(); n >= NAM_DAU; n--) nam.push(n);
    var chon = function (ds, v) { return ds.map(function (x) { return '<option value="' + esc(x[0]) + '"' + (x[0] === v ? ' selected' : '') + '>' + esc(x[1]) + '</option>'; }).join(''); };
    khung = document.createElement('div'); khung.id = 'khungTimChung'; khung.className = 'tc';
    khung.innerHTML = '<section class="the tc-tim"><div class="tc-hang">' +
      '<label class="tc-nhan">Công ty<select class="o" id="tcCt">' + chon([['tat', 'Tất cả']].concat(DV.map(function (x) { return [x, x]; })), T.ct) + '</select></label>' +
      '<label class="tc-nhan">Năm<select class="o" id="tcNam">' + chon([['', 'Mọi năm']].concat(nam.map(function (x) { return [String(x), String(x)]; })), T.nam) + '</select></label>' +
      '<div class="tc-nhan tc-lon"><label for="tcQ">Tìm văn bản</label><div class="tc-o"><select id="tcTruong" aria-label="Tìm trong trường">' + chon(TRUONG, T.truong) + '</select>' +
      '<input id="tcQ" type="search" autocomplete="off" placeholder="Số ký hiệu, trích yếu, cơ quan, đối tác…"></div></div></div>' +
      '<div class="tc-goi">Tìm cùng lúc trong sổ văn thư và kho số hóa. Gõ không dấu cũng được; đặt "cụm từ" trong ngoặc kép để khớp nguyên cụm.</div></section>' +
      '<div class="tc-thanh"><span class="tc-dem" id="tcDem" role="status"></span><span class="tc-ghi" id="tcGhi" role="status"></span><select class="o" id="tcSx" aria-label="Sắp xếp"><option value="lq">Liên quan nhất</option><option value="moi">Mới nhất</option><option value="cu">Cũ nhất</option></select></div>' +
      '<div id="tcKq"></div><div id="tcXem"></div>';
    document.getElementById('man').parentNode.appendChild(khung);

    khung.addEventListener('input', function (e) {
      if (e.target.id !== 'tcQ') return;
      clearTimeout(hen); hen = setTimeout(function () { var v = $k('#tcQ').value.trim(); if (v === T.q) return; T.q = v; T.sx = ''; timLai(); }, 400);
    });
    khung.addEventListener('keydown', function (e) {
      if (e.target.id === 'tcQ' && e.key === 'Enter') { clearTimeout(hen); var v = e.target.value.trim(); if (v !== T.q) { T.q = v; T.sx = ''; timLai(); } }
    });
    khung.addEventListener('change', function (e) {
      var t = e.target;
      if (t.id === 'tcCt') T.ct = t.value; else if (t.id === 'tcNam') T.nam = t.value; else if (t.id === 'tcTruong') T.truong = t.value; else if (t.id === 'tcSx') T.sx = t.value; else return;
      timLai();
    });
    khung.addEventListener('click', function (e) {
      var t = e.target, dong = t.closest('[data-tcdong]');
      if (dong && (t === dong || dong.tagName === 'BUTTON')) { XEM = null; veXem(); return; }
      if (t.closest('.tc-hop')) return;
      var tr = t.closest('[data-tct]');
      if (tr) {
        T.trang = Number(tr.dataset.tct); timKho();
        $k('.tc-thanh').scrollIntoView({ block: 'start' }); return;
      }
      if (t.closest('[data-tcthu]')) { timKho(true); return; }
      if (t.closest('a')) return;                                // link phiếu, nút Base, tải file: để trình duyệt tự xử lý
      var x = t.closest('[data-tcxem]');
      if (x) { XEM = KHO.ds.filter(function (d) { return d.id === x.dataset.tcxem; })[0] || null; if (XEM && XEM.driveId) veXem(); return; }
      var p = t.closest('[data-tcp]');
      if (p) location.hash = '#/phieu/' + p.dataset.tcp;
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && XEM) { XEM = null; veXem(); } });
  }

  window.TIMCHUNG = {
    /** Hiện / ẩn khung. Gọi lại mỗi lần trang vẽ lại để số liệu sổ theo dữ liệu mới nhất. */
    hien: function (co) {
      if (!co) { if (khung) { khung.hidden = true; if (XEM) { XEM = null; veXem(); } } return; }
      if (!khung) dung();
      khung.hidden = false;
      clearTimeout(window._tgCao); document.getElementById('man').style.minHeight = '';
      locSo(); timKho();
    }
  };
})();
