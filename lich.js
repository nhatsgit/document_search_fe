/* Lịch làm việc: tab của trang Văn thư (vanthu.html). Gọi LICH.gan(phần tử). */
(function () {
'use strict';
var API = 'https://document-search-api-319700450833.us-central1.run.app/api/lich';
var LOAI = [['congtac', 'Lịch công tác', '#10b981'], ['hop', 'Cuộc họp', '#0ea5e9'], ['phong', 'Đặt phòng họp', '#8b5cf6'], ['xe', 'Đặt xe', '#f59e0b'], ['viec', 'Việc đến hạn', '#ec4899'], ['giayto', 'Hạn giấy tờ', '#ef4444'], ['khac', 'Công tác, nghỉ phép, việc giao', '#64748b']];
var MAU = {}, TEN_LOAI = {}; LOAI.forEach(function (l) { TEN_LOAI[l[0]] = l[1]; MAU[l[0]] = l[2]; });
var XEM = [['ngay', 'Ngày'], ['3ngay', '3 ngày'], ['tuan', 'Tuần'], ['t26', 'T2–T6'], ['thang', 'Tháng'], ['nam', 'Năm'], ['trinh', 'Lịch trình']];
var THU = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
var PX = 52, MAC_LO = 7 * 60, MAC_HI = 18 * 60;

var $ = function (s) { return document.querySelector(s); };
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function doc(k, d) { try { var v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } }
function ghi(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
function dienThoai() { return window.matchMedia('(max-width: 767px)').matches; }

var hai = function (n) { return ('0' + n).slice(-2); };
var ymd = function (d) { return d.getFullYear() + '-' + hai(d.getMonth() + 1) + '-' + hai(d.getDate()); };
var cong = function (d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; };
var thuHai = function (d) { return cong(d, -((d.getDay() + 6) % 7)); };
var homNay = function () { var n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); };
var phanNgay = function (s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); };
var phut = function (s) { var p = s.slice(11).split(':'); return +p[0] * 60 + +p[1]; };
var dongHo = function (m) { return hai(Math.floor(m / 60)) + ':' + hai(m % 60); };
var nhanNgay = function (d) { return THU[(d.getDay() + 6) % 7] + ' ' + d.getDate() + '/' + (d.getMonth() + 1); };
var vnNgay = function (s) { var p = s.slice(0, 10).split('-'); return p[2] + '/' + p[1] + '/' + p[0]; };

var S = { xem: doc('lich_xem', dienThoai() ? 'ngay' : 'tuan'), moc: homNay(), an: {}, ds: [] };
try { S.an = JSON.parse(doc('lich_an', '{}')) || {}; } catch (e) {}
if (!XEM.some(function (x) { return x[0] === S.xem; })) S.xem = 'tuan';

function khoang() {
  var a = S.moc;
  if (S.xem === 'ngay') return [a, a];
  if (S.xem === '3ngay') return [a, cong(a, 2)];
  if (S.xem === 'tuan') return [thuHai(a), cong(thuHai(a), 6)];
  if (S.xem === 't26') return [thuHai(a), cong(thuHai(a), 4)];
  if (S.xem === 'trinh') return [a, cong(a, 29)];
  if (S.xem === 'nam') return [new Date(a.getFullYear(), 0, 1), new Date(a.getFullYear(), 11, 31)];
  var dau = new Date(a.getFullYear(), a.getMonth(), 1), cuoi = new Date(a.getFullYear(), a.getMonth() + 1, 0);
  return [thuHai(dau), cong(thuHai(cuoi), 6)];
}
function tenKhoang() {
  var k = khoang(), a = k[0], b = k[1];
  if (S.xem === 'ngay') return nhanNgay(a) + '/' + a.getFullYear();
  if (S.xem === 'nam') return 'Năm ' + a.getFullYear();
  if (S.xem === 'thang') return 'Tháng ' + (S.moc.getMonth() + 1) + '/' + S.moc.getFullYear();
  return a.getDate() + '/' + (a.getMonth() + 1) + ' – ' + b.getDate() + '/' + (b.getMonth() + 1) + '/' + b.getFullYear();
}
function buoc(n) {
  var x = S.moc, m = { ngay: 1, '3ngay': 3, tuan: 7, t26: 7, trinh: 30 }[S.xem];
  // Đổi tháng, năm vẫn giữ ngày đang xem (ngày 31 sang tháng ngắn thì lấy ngày cuối tháng)
  var doiThang = function (t) { var c = new Date(x.getFullYear(), x.getMonth() + t + 1, 0); return new Date(c.getFullYear(), c.getMonth(), Math.min(x.getDate(), c.getDate())); };
  if (S.xem === 'thang') S.moc = doiThang(n);
  else if (S.xem === 'nam') S.moc = doiThang(12 * n);
  else S.moc = cong(x, n * m);
  ve();
}

/* Trùng giờ: cùng địa điểm (phòng, xe) hoặc cùng một người trong thành phần; lịch cả ngày không tính */
function tachTen(s) { return String(s || '').split(/[,;\n]/).map(function (t) { return t.trim().toLowerCase(); }).filter(Boolean); }
function dangTrung(a, b) {
  if (a.id === b.id || a.caNgay || b.caNgay) return false;
  if (!(a.batDau < b.ketThuc && b.batDau < a.ketThuc)) return false;
  if (a.diaDiem && a.diaDiem.trim().toLowerCase() === b.diaDiem.trim().toLowerCase()) return true;
  var ten = tachTen(b.thanhPhan);
  return tachTen(a.thanhPhan).some(function (t) { return ten.indexOf(t) >= 0; });
}
function danhDauTrung() {
  S.ds.forEach(function (x) { x._trung = S.ds.filter(function (y) { return dangTrung(x, y); }); });
}
function dsHien() { return S.ds.filter(function (x) { return !S.an[x.loai]; }); }
/* Lịch rơi vào những ngày nào, kèm giờ trong ngày đó */
function theoNgay(ds, tu, den) {
  var m = {}, a = ymd(tu), b = ymd(den);
  ds.forEach(function (x) {
    var d1 = x.batDau.slice(0, 10), d2 = x.ketThuc.slice(0, 10);
    if (d2 < a || d1 > b) return;
    for (var d = phanNgay(d1 < a ? a : d1), c = d2 > b ? b : d2; ymd(d) <= c; d = cong(d, 1)) {
      var k = ymd(d);
      (m[k] = m[k] || []).push({ x: x, a: k === d1 ? phut(x.batDau) : 0, b: k === d2 ? phut(x.ketThuc) : 1440 });
    }
  });
  Object.keys(m).forEach(function (k) { m[k].sort(function (p, q) { return (q.x.caNgay ? 1 : 0) - (p.x.caNgay ? 1 : 0) || p.a - q.a || q.b - p.b; }); });
  return m;
}
/* Lịch chồng giờ chia làn trong một cột */
function chiaLan(ds) {
  var nhom = [], hien = null;
  ds.forEach(function (e) {
    if (hien && e.a < hien.het) { hien.ds.push(e); hien.het = Math.max(hien.het, e.b); } else { hien = { ds: [e], het: e.b }; nhom.push(hien); }
  });
  nhom.forEach(function (g) {
    var lan = [];
    g.ds.forEach(function (e) {
      var i = lan.findIndex(function (h) { return h <= e.a; });
      if (i < 0) { i = lan.length; lan.push(e.b); } else lan[i] = e.b;
      e.lan = i;
    });
    g.ds.forEach(function (e) { e.soLan = lan.length; });
  });
}
function nutSu(x, cls, chuPhu, style) {
  return '<button type="button" class="lc-su ' + cls + (x._trung.length ? ' trung' : '') + '" data-id="' + esc(x.id) + '" style="--c:' + MAU[x.loai] + ';' + (style || '') + '" title="' + esc(x.tieuDe) + '"><b>' + esc(x.tieuDe) + '</b>' + (chuPhu != null ? '<small>' + esc(chuPhu) + (x._trung.length ? ' · Trùng giờ' : '') + '</small>' : '') + '</button>';
}
function veLuoiGio(tu, den) {
  var ngay = [], m = theoNgay(dsHien(), tu, den), lo = MAC_LO, hi = MAC_HI, nay = ymd(homNay());
  for (var d = tu; ymd(d) <= ymd(den); d = cong(d, 1)) ngay.push(d);
  var cot = ngay.map(function (d) {
    var k = ymd(d), tat = m[k] || [], co = tat.filter(function (e) { return !e.x.caNgay; }).map(function (e) { return { x: e.x, a: e.a, b: Math.max(e.b, e.a + 30) }; });
    chiaLan(co);
    co.forEach(function (e) { lo = Math.min(lo, Math.floor(e.a / 60) * 60); hi = Math.max(hi, Math.min(1440, Math.ceil(e.b / 60) * 60)); });
    return { d: d, k: k, caNgay: tat.filter(function (e) { return e.x.caNgay; }), co: co };
  });
  var cao = (hi - lo) / 60 * PX, gio = '', n = new Date(), mNay = n.getHours() * 60 + n.getMinutes();
  for (var g = lo; g < hi; g += 60) gio += '<span style="top:' + (g - lo) / 60 * PX + 'px">' + dongHo(g) + '</span>';
  $('#lcNoi').innerHTML = '<div class="lc-cuon" id="cuonGio"><div class="lc-dau" style="--n:' + cot.length + '"><span></span>' + cot.map(function (c) { return '<h4 class="' + (c.k === nay ? 'nay' : '') + '" data-ngay="' + c.k + '">' + nhanNgay(c.d) + '</h4>'; }).join('') + '</div>' +
    '<div class="lc-cangay" style="--n:' + cot.length + '"><span>Cả ngày</span>' + cot.map(function (c) { return '<div>' + c.caNgay.map(function (e) { return nutSu(e.x, 'tinh'); }).join('') + '</div>'; }).join('') + '</div>' +
    '<div class="lc-than" style="--n:' + cot.length + ';height:' + cao + 'px"><div class="lc-gio">' + gio + '</div>' + cot.map(function (c) {
      return '<div class="lc-cot' + (c.k === nay ? ' nay' : '') + '" data-tao="' + c.k + '" data-lo="' + lo + '">' + c.co.map(function (e) {
        var top = (e.a - lo) / 60 * PX, h = Math.max(24, (e.b - e.a) / 60 * PX - 2);
        return nutSu(e.x, '', dongHo(e.a) + '–' + dongHo(Math.min(e.b, 1439)), 'top:' + top + 'px;height:' + h + 'px;left:calc(' + e.lan + ' / ' + e.soLan + ' * 100% + 1px);width:calc(100% / ' + e.soLan + ' - 3px)');
      }).join('') + (c.k === nay && mNay >= lo && mNay <= hi ? '<div class="lc-bay-gio" style="top:' + (mNay - lo) / 60 * PX + 'px"></div>' : '') + '</div>';
    }).join('') + '</div></div>';
  var cuon = $('#cuonGio'); if (cuon) cuon.scrollTop = Math.max(0, (Math.max(lo, 7 * 60) - lo) / 60 * PX);
}
function veThang(tu, den) {
  var m = theoNgay(dsHien(), tu, den), nay = ymd(homNay()), o = '', max = dienThoai() ? 2 : 3;
  for (var d = tu; ymd(d) <= ymd(den); d = cong(d, 1)) {
    var k = ymd(d), ds = m[k] || [];
    o += '<div class="lc-ngay' + (k === nay ? ' nay' : '') + (d.getMonth() !== S.moc.getMonth() ? ' ngoai' : '') + '" data-tao="' + k + '"><button type="button" class="lc-so" data-ngay="' + k + '" aria-label="Xem ngày ' + vnNgay(k) + '">' + d.getDate() + '</button>' +
      ds.slice(0, max).map(function (e) { return nutSu(e.x, ''); }).join('') + (ds.length > max ? '<button type="button" class="lc-them" data-ngay="' + k + '">+' + (ds.length - max) + ' lịch</button>' : '') + '</div>';
  }
  $('#lcNoi').innerHTML = '<div class="lc-thang-dau">' + THU.map(function (t) { return '<span>' + t + '</span>'; }).join('') + '</div><div class="lc-thang">' + o + '</div>';
}
function veNam() {
  var y = S.moc.getFullYear(), m = theoNgay(dsHien(), new Date(y, 0, 1), new Date(y, 11, 31)), nay = ymd(homNay());
  $('#lcNoi').innerHTML = '<div class="lc-nam">' + Array.from({ length: 12 }, function (_, t) {
    var dau = new Date(y, t, 1), cuoi = new Date(y, t + 1, 0), o = THU.map(function (x) { return '<span>' + x.replace('T', '') + '</span>'; }).join('');
    for (var i = 0; i < (dau.getDay() + 6) % 7; i++) o += '<i></i>';
    for (var d = 1; d <= cuoi.getDate(); d++) {
      var k = y + '-' + hai(t + 1) + '-' + hai(d), n = (m[k] || []).length;
      o += '<button type="button" class="' + (n >= 4 ? 'm3' : n >= 2 ? 'm2' : n ? 'm1' : '') + (k === nay ? ' nay' : '') + '" data-ngay="' + k + '" aria-label="' + vnNgay(k) + ': ' + n + ' lịch">' + d + '</button>';
    }
    return '<div><h4>Tháng ' + (t + 1) + '</h4><div class="lc-tn">' + o + '</div></div>';
  }).join('') + '</div>';
}
function veTrinh(tu, den) {
  var m = theoNgay(dsHien(), tu, den), nay = ymd(homNay()), ks = Object.keys(m).sort();
  $('#lcNoi').innerHTML = ks.length ? ks.map(function (k) {
    var d = phanNgay(k);
    return '<section class="lc-tt-ngay' + (k === nay ? ' nay' : '') + '"><h4>' + nhanNgay(d) + '/' + d.getFullYear() + '</h4>' + m[k].map(function (e) {
      var x = e.x, phu = [x.diaDiem, x.thanhPhan].filter(Boolean).join(' · ');
      return '<button type="button" class="lc-dong' + (x._trung.length ? ' trung' : '') + '" data-id="' + esc(x.id) + '" style="--c:' + MAU[x.loai] + '"><time>' + (x.caNgay ? 'Cả ngày' : dongHo(e.a) + '–' + dongHo(Math.min(e.b, 1439))) + '</time><span><b>' + esc(x.tieuDe) + '</b><small>' + esc(TEN_LOAI[x.loai]) + (phu ? ' · ' + esc(phu) : '') + (x._trung.length ? ' · Trùng giờ' : '') + '</small></span></button>';
    }).join('') + '</section>';
  }).join('') : '<div class="lc-rong">Không có lịch trong 30 ngày này</div>';
}
function ve() {
  if (!$('#lcNoi')) return;   // đã rời tab Lịch trong lúc đang đọc dữ liệu
  var k = khoang();
  $('#lcTenKhoang').textContent = tenKhoang();
  $('#lcXem').innerHTML = XEM.map(function (x) { return '<button type="button" data-xem="' + x[0] + '" class="' + (S.xem === x[0] ? 'chon' : '') + '" aria-pressed="' + (S.xem === x[0]) + '">' + x[1] + '</button>'; }).join('');
  var dem = {}, nt = theoNgay(S.ds, k[0], k[1]), da = {};
  Object.keys(nt).forEach(function (n) { nt[n].forEach(function (e) { if (!da[e.x.id]) { da[e.x.id] = 1; dem[e.x.loai] = (dem[e.x.loai] || 0) + 1; } }); });
  $('#lcLoai').innerHTML = LOAI.map(function (l) { return '<button type="button" class="lc-kind' + (S.an[l[0]] ? ' off' : '') + '" data-loai="' + l[0] + '" aria-pressed="' + !S.an[l[0]] + '"><i style="background:' + l[2] + '"></i>' + l[1] + (dem[l[0]] ? '<b>' + dem[l[0]] + '</b>' : '') + '</button>'; }).join('');
  if (S.xem === 'thang') veThang(k[0], k[1]);
  else if (S.xem === 'nam') veNam();
  else if (S.xem === 'trinh') veTrinh(k[0], k[1]);
  else veLuoiGio(k[0], k[1]);
}

/* ---------- dữ liệu ---------- */
function nap() {
  return fetch(API).then(function (r) { return r.json(); }).then(function (j) {
    if (!j.ok) throw new Error(j.loi || 'API lỗi');
    S.ds = j.data.lich.map(function (x) { if (!MAU[x.loai]) x.loai = 'khac'; return x; });
    danhDauTrung(); ve();
  }).catch(function (e) {
    if (!$('#lcNoi')) return;
    $('#lcNoi').innerHTML = '<div class="lc-baoloi">Không đọc được lịch: ' + esc(e.message) + ' <button type="button" class="ck-btn" id="lcThuLai">Thử lại</button></div>';
  });
}
function gui(than, ma) {
  return fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8', 'X-Lich-Key': ma }, body: JSON.stringify(than) })
    .then(function (r) { return r.json().catch(function () { throw new Error('API trả về không đọc được (mã ' + r.status + ')'); }); })
    .then(function (j) { if (!j.ok) { var e = new Error(j.loi || 'API lỗi'); e.saiMa = j.saiMa; throw e; } return j.data; });
}
function maDaLuu() { return doc('lich_ma', ''); }

/* ---------- hộp thoại ---------- */
var veTruoc = null;
function dongHop() { $('#lcHop').innerHTML = ''; document.body.style.overflow = ''; if (veTruoc && veTruoc.isConnected) veTruoc.focus(); veTruoc = null; }
function moHop(tieuDe, than, chan) {
  if (!$('#lcHop').innerHTML) veTruoc = document.activeElement;
  $('#lcHop').innerHTML = '<div class="lc-nen" data-dong="1"><div class="lc-hop" role="dialog" aria-modal="true" aria-labelledby="hopTen"><div class="lc-hop-dau"><h3 id="hopTen">' + esc(tieuDe) + '</h3><button type="button" class="ck-btn vuong" data-dongnut="1" aria-label="Đóng">×</button></div><div class="lc-hop-than">' + than + '</div><div class="lc-hop-chan">' + chan + '</div></div></div>';
  document.body.style.overflow = 'hidden';
}
function moChiTiet(id) {
  var x = S.ds.filter(function (y) { return y.id === id; })[0]; if (!x) return;
  var tg = x.caNgay ? vnNgay(x.batDau) + (x.ketThuc.slice(0, 10) !== x.batDau.slice(0, 10) ? ' – ' + vnNgay(x.ketThuc) : '') + ', cả ngày'
    : vnNgay(x.batDau) + ' ' + x.batDau.slice(11) + ' – ' + (x.ketThuc.slice(0, 10) !== x.batDau.slice(0, 10) ? vnNgay(x.ketThuc) + ' ' : '') + x.ketThuc.slice(11);
  var hang = [['Loại', TEN_LOAI[x.loai]], ['Thời gian', tg], ['Địa điểm', x.diaDiem], ['Thành phần', x.thanhPhan], ['Đơn vị', x.donVi], ['Ghi chú', x.ghiChu]].filter(function (h) { return h[1]; });
  moHop(x.tieuDe, (x._trung.length ? '<div class="lc-loi">Trùng giờ với: ' + x._trung.map(function (y) { return esc(y.tieuDe); }).join('; ') + '</div>' : '') + '<dl class="lc-ct">' + hang.map(function (h) { return '<dt>' + h[0] + '</dt><dd>' + esc(h[1]) + '</dd>'; }).join('') + '</dl><div id="hopLoi" class="lc-loi" style="grid-column:1/-1" hidden></div>',
    '<button type="button" class="ck-btn nguy" data-xoa="' + esc(x.id) + '">Xoá</button><span class="cach"></span><button type="button" class="ck-btn" data-dongnut="1">Đóng</button><button type="button" class="ck-btn chinh" data-sua="' + esc(x.id) + '">Sửa</button>');
}
function moForm(x, loi) {
  x = x || {};
  var dBat = (x.batDau || ymd(S.moc) + ' 08:00'), dKet = (x.ketThuc || dBat.slice(0, 11) + dongHo(Math.min(phut(dBat) + 60, 1439)));
  var coMa = !!maDaLuu();
  moHop(x.id ? 'Sửa lịch' : 'Lập lịch',
    (loi ? '<div class="lc-loi" role="alert">' + esc(loi) + '</div>' : '') +
    '<label class="lc-o ca">Tên lịch<input id="fTen" maxlength="200" required value="' + esc(x.tieuDe || '') + '"></label>' +
    '<label class="lc-o ca">Loại lịch<select id="fLoai">' + LOAI.map(function (l) { return '<option value="' + l[0] + '"' + ((x.loai || 'congtac') === l[0] ? ' selected' : '') + '>' + l[1] + '</option>'; }).join('') + '</select></label>' +
    '<label class="lc-o lc-chk"><input type="checkbox" id="fCaNgay"' + (x.caNgay ? ' checked' : '') + '>Cả ngày</label>' +
    '<label class="lc-o">Từ ngày<input type="date" id="fNgay1" value="' + dBat.slice(0, 10) + '"></label><label class="lc-o f-gio">Từ giờ<input type="time" id="fGio1" value="' + dBat.slice(11) + '"></label>' +
    '<label class="lc-o">Đến ngày<input type="date" id="fNgay2" value="' + dKet.slice(0, 10) + '"></label><label class="lc-o f-gio">Đến giờ<input type="time" id="fGio2" value="' + dKet.slice(11) + '"></label>' +
    '<label class="lc-o ca">Địa điểm, phòng họp, xe<input id="fDiaDiem" maxlength="200" value="' + esc(x.diaDiem || '') + '"></label>' +
    '<label class="lc-o ca">Thành phần (cách nhau bằng dấu phẩy)<input id="fThanhPhan" maxlength="500" value="' + esc(x.thanhPhan || '') + '"></label>' +
    '<label class="lc-o">Đơn vị<input id="fDonVi" maxlength="100" value="' + esc(x.donVi || '') + '"></label>' +
    '<label class="lc-o ca">Ghi chú<textarea id="fGhiChu" rows="3" maxlength="2000">' + esc(x.ghiChu || '') + '</textarea></label>' +
    '<div class="lc-trung" id="fTrung" hidden></div>' +
    (coMa ? '' : '<label class="lc-o ca">Mã lập lịch<input type="password" id="fMa" autocomplete="off"></label>'),
    (coMa ? '<button type="button" class="ck-btn" data-quenma="1">Quên mã</button>' : '') + '<span class="cach"></span><button type="button" class="ck-btn" data-dongnut="1">Huỷ</button><button type="button" class="ck-btn chinh" id="fLuu" data-luu="' + esc(x.id || '') + '">Lưu</button>');
  anGio(); kiemTrung(x.id);
  var o = $('#fTen'); if (o) o.focus();
}
function anGio() { var ca = $('#fCaNgay').checked; document.querySelectorAll('.f-gio').forEach(function (e) { e.style.display = ca ? 'none' : ''; }); }
function layForm() {
  var ca = $('#fCaNgay').checked, n1 = $('#fNgay1').value, n2 = $('#fNgay2').value || n1;
  return { tieuDe: $('#fTen').value.trim(), loai: $('#fLoai').value, caNgay: ca, batDau: n1 + ' ' + (ca ? '00:00' : $('#fGio1').value || '00:00'), ketThuc: n2 + ' ' + (ca ? '23:59' : $('#fGio2').value || '00:00'),
    diaDiem: $('#fDiaDiem').value.trim(), thanhPhan: $('#fThanhPhan').value.trim(), donVi: $('#fDonVi').value.trim(), ghiChu: $('#fGhiChu').value.trim() };
}
function kiemTrung(id) {
  var v = $('#fTrung'); if (!v) return;
  var x = Object.assign(layForm(), { id: id || '_moi' });
  var ds = x.tieuDe || x.diaDiem || x.thanhPhan ? S.ds.filter(function (y) { return dangTrung(x, y); }) : [];
  v.hidden = !ds.length;
  v.textContent = ds.length ? 'Trùng giờ với: ' + ds.map(function (y) { return y.tieuDe + ' (' + y.batDau.slice(11) + ')'; }).join('; ') + '. Vẫn lưu được.' : '';
}
function luu(id, nut) {
  var v = layForm(), o = $('#fMa'), ma = o ? o.value.trim() : maDaLuu();
  var bao = function (t) { moForm(Object.assign(v, { id: id }), t); if (o && ma) { var m = $('#fMa'); if (m) m.value = ma; } };
  if (!v.tieuDe) return bao('Chưa nhập tên lịch');
  if (!/^\d{4}-\d{2}-\d{2} /.test(v.batDau)) return bao('Chưa chọn ngày');
  if (v.ketThuc < v.batDau) return bao('Thời gian kết thúc phải sau thời gian bắt đầu');
  if (!ma) return bao('Chưa nhập mã lập lịch');
  nut.disabled = true; nut.textContent = 'Đang lưu…';
  gui(id ? { lenh: 'sua', id: id, lich: v } : { lenh: 'them', lich: v }, ma).then(function () {
    ghi('lich_ma', ma);
    dongHop();
    S.moc = phanNgay(v.batDau.slice(0, 10));
    return nap();
  }).catch(function (e) {
    if (e.saiMa) { try { localStorage.removeItem('lich_ma'); } catch (x) {} v.id = id; moForm(v, 'Sai mã lập lịch'); return; }
    bao(e.message);
  });
}
function xoa(id, nut) {
  var ma = maDaLuu();
  if (!ma) { var x = S.ds.filter(function (y) { return y.id === id; })[0]; moForm(x, 'Nhập mã rồi lưu một lần để được xoá lịch.'); return; }
  if (nut.dataset.dem !== '1') { nut.dataset.dem = '1'; nut.textContent = 'Bấm lần nữa để xoá'; return; }
  nut.disabled = true;
  gui({ lenh: 'xoa', id: id }, ma).then(function () { dongHop(); return nap(); }).catch(function (e) {
    if (e.saiMa) { try { localStorage.removeItem('lich_ma'); } catch (z) {} }
    var l = $('#hopLoi'); if (l) { l.hidden = false; l.textContent = e.saiMa ? 'Sai mã. Bấm Sửa để nhập lại mã.' : e.message; }
    nut.disabled = false; delete nut.dataset.dem; nut.textContent = 'Xoá';
  });
}

/* ---------- sự kiện ---------- */
document.addEventListener('click', function (e) {
  var t = e.target, g;
  if (!t.closest('#lcGoc,#lcHop')) return;
  if (t.id === 'lcThuLai') { nap(); return; }
  if (t.dataset && t.dataset.dong && t === e.currentTarget.querySelector('.lc-nen')) { dongHop(); return; }
  if ((g = t.closest('[data-dongnut]'))) { dongHop(); return; }
  if ((g = t.closest('[data-xem]'))) { S.xem = g.dataset.xem; ghi('lich_xem', S.xem); ve(); return; }
  if ((g = t.closest('[data-loai]'))) { var l = g.dataset.loai; if (S.an[l]) delete S.an[l]; else S.an[l] = 1; ghi('lich_an', JSON.stringify(S.an)); ve(); return; }
  if ((g = t.closest('[data-id]'))) { moChiTiet(g.dataset.id); return; }
  if ((g = t.closest('[data-sua]'))) { moForm(S.ds.filter(function (y) { return y.id === g.dataset.sua; })[0]); return; }
  if ((g = t.closest('[data-xoa]'))) { xoa(g.dataset.xoa, g); return; }
  if ((g = t.closest('[data-luu]'))) { luu(g.dataset.luu, g); return; }
  if ((g = t.closest('[data-quenma]'))) { try { localStorage.removeItem('lich_ma'); } catch (x) {} moForm(layFormGiu()); return; }
  if ((g = t.closest('[data-ngay]'))) { S.moc = phanNgay(g.dataset.ngay); S.xem = 'ngay'; ghi('lich_xem', S.xem); ve(); return; }
  if ((g = t.closest('[data-tao]'))) {
    var gio = 8 * 60;
    if (g.classList.contains('lc-cot')) gio = Math.min(1380, Number(g.dataset.lo) + Math.floor((e.clientY - g.getBoundingClientRect().top) / PX * 2) * 30);
    moForm({ batDau: g.dataset.tao + ' ' + dongHo(gio) });
  }
});
function layFormGiu() { var v = layForm(); v.id = $('#fLuu').dataset.luu; return v; }
document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && $('#lcHop').innerHTML) dongHop(); });
document.addEventListener('change', function (e) {
  if (!$('#fLuu')) return;
  if (e.target.id === 'fCaNgay') anGio();
  if (e.target.id === 'fNgay1') { var n2 = $('#fNgay2'); if (n2.value < e.target.value) n2.value = e.target.value; }
  kiemTrung($('#fLuu').dataset.luu);
});
document.addEventListener('input', function (e) { if ($('#fLuu') && /^(fDiaDiem|fThanhPhan)$/.test(e.target.id)) kiemTrung($('#fLuu').dataset.luu); });

var hopGoc = document.createElement('div'); hopGoc.id = 'lcHop'; document.body.appendChild(hopGoc);

/* Vẽ lịch vào phần tử el, gọi mỗi lần mở tab */
function gan(el) {
  el.innerHTML = '<div id="lcGoc"><div class="lc-thanh"><div class="lc-chuyen">' +
      '<button type="button" class="ck-btn" id="lcHomNay">Hôm nay</button>' +
      '<button type="button" class="ck-btn vuong" id="lcLui" aria-label="Trước">‹</button>' +
      '<button type="button" class="ck-btn vuong" id="lcToi" aria-label="Sau">›</button>' +
      '<h2 id="lcTenKhoang" aria-live="polite"></h2></div>' +
      '<div class="lc-xem" id="lcXem" role="group" aria-label="Cách xem"></div>' +
      '<button type="button" class="ck-btn chinh lc-lap" id="lcLap">+ Lập lịch</button></div>' +
    '<div class="lc-loai" id="lcLoai" role="group" aria-label="Loại lịch"></div>' +
    '<div class="lc-the" id="lcNoi"></div></div>';
  $('#lcLap').onclick = function () { moForm(); };
  $('#lcHomNay').onclick = function () { S.moc = homNay(); ve(); };
  $('#lcLui').onclick = function () { buoc(-1); };
  $('#lcToi').onclick = function () { buoc(1); };
  ve();
  if (!S.ds.length) $('#lcNoi').innerHTML = '<div class="lc-baoloi">Đang đọc lịch…</div>';
  nap();
}
window.LICH = { gan: gan };
})();
