/* Lịch làm việc (trang lich.html). Gọi LICH.gan(phần tử). */
(function () {
'use strict';
var API = 'https://document-search-api-319700450833.us-central1.run.app/api/lich';
var LOAI = [['congtac', 'Lịch công tác', '#10b981'], ['hop', 'Cuộc họp', '#0ea5e9'], ['phong', 'Đặt phòng họp', '#8b5cf6'], ['xe', 'Đặt xe', '#f59e0b'], ['viec', 'Việc đến hạn', '#ec4899'], ['giayto', 'Hạn giấy tờ', '#ef4444'], ['khac', 'Công tác, nghỉ phép, việc giao', '#64748b']];
var MAU = {}, TEN_LOAI = {}; LOAI.forEach(function (l) { TEN_LOAI[l[0]] = l[1]; MAU[l[0]] = l[2]; });
var XEM = [['ngay', 'Ngày'], ['3ngay', '3 ngày'], ['tuan', 'Tuần'], ['t26', 'T2–T6'], ['thang', 'Tháng'], ['nam', 'Năm'], ['trinh', 'Lịch trình'], ['tai', 'Phòng, xe']];
var DV = ['CRCK2', 'BHCK', 'CRCK', 'BHVN', 'Đảng ủy'];
var TAI_NGUYEN = ['Phòng họp lớn', 'Phòng họp 1', 'Phòng họp 2', 'Xe 51A-123.45', 'Xe 51B-678.90'];
var LAP = [['', 'Không lặp'], ['ngay', 'Hằng ngày'], ['tuan', 'Hằng tuần'], ['2tuan', 'Hai tuần một lần'], ['thang', 'Hằng tháng'], ['nam', 'Hằng năm']];
var TEN_LAP = {}; LAP.forEach(function (l) { if (l[0]) TEN_LAP[l[0]] = l[1]; });
var TRANG_THAI = [['cho', 'Chờ duyệt'], ['duyet', 'Đã duyệt'], ['tuchoi', 'Từ chối']];
var TEN_TT = {}; TRANG_THAI.forEach(function (l) { TEN_TT[l[0]] = l[1]; });
var NHAC = [['', 'Không nhắc'], ['10', 'Trước 10 phút'], ['30', 'Trước 30 phút'], ['60', 'Trước 1 giờ'], ['1440', 'Trước 1 ngày']];
var THU = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
var PX = 52, MAC_LO = 7 * 60, MAC_HI = 18 * 60, GIO_LAM = [7 * 60 + 30, 17 * 60];

var $ = function (s) { return document.querySelector(s); };
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function doc(k, d) { try { var v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } }
function ghi(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
function dienThoai() { return window.matchMedia('(max-width: 767px)').matches; }
function boDau(s) { return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase(); }
function chiPhongXe(l) { return l === 'phong' || l === 'xe'; }

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
function isoTuan(d) {
  var t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())), n = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - n);
  return Math.ceil(((t - new Date(Date.UTC(t.getUTCFullYear(), 0, 1))) / 86400000 + 1) / 7);
}

var S = { xem: doc('lich_xem', dienThoai() ? 'ngay' : 'tuan'), moc: homNay(), an: {}, ds: [], goc: [], demo: doc('lich_demo', '1') !== '0', demoDs: null,
  dv: doc('lich_dv', 'CRCK2'), q: '', am: doc('lich_am', '1') !== '0', namMo: 0, vuaKeo: false,
  cuaToi: doc('lich_cuatoi', '') === '1', ten: doc('lich_ten', ''), daNhac: {}, tgTen: '' };
try { S.an = JSON.parse(doc('lich_an', '{}')) || {}; } catch (e) {}
if (!XEM.some(function (x) { return x[0] === S.xem; })) S.xem = 'tuan';
if (S.dv !== 'Tất cả' && DV.indexOf(S.dv) < 0) S.dv = 'CRCK2';

/* ---------- âm lịch và ngày lễ (thuật toán Hồ Ngọc Đức, múi giờ +7) ---------- */
function jdnTu(dd, mm, yy) {
  var a = Math.floor((14 - mm) / 12), y = yy + 4800 - a, m = mm + 12 * a - 3;
  return dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
}
function trangMoi(k) {
  var T = k / 1236.85, T2 = T * T, T3 = T2 * T, dr = Math.PI / 180;
  var Jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
  Jd1 += 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
  var M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3, Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3, F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
  var C1 = (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * dr * M);
  C1 = C1 - 0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(dr * 2 * Mpr) - 0.0004 * Math.sin(dr * 3 * Mpr);
  C1 = C1 + 0.0104 * Math.sin(dr * 2 * F) - 0.0051 * Math.sin(dr * (M + Mpr)) - 0.0074 * Math.sin(dr * (M - Mpr)) + 0.0004 * Math.sin(dr * (2 * F + M));
  C1 = C1 - 0.0004 * Math.sin(dr * (2 * F - M)) - 0.0006 * Math.sin(dr * (2 * F + Mpr)) + 0.0010 * Math.sin(dr * (2 * F - Mpr)) + 0.0005 * Math.sin(dr * (2 * Mpr + M));
  var dt = T < -11 ? 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3 : -0.000278 + 0.000265 * T + 0.000262 * T2;
  return Jd1 + C1 - dt;
}
function ngayTrangMoi(k) { return Math.floor(trangMoi(k) + 0.5 + 7 / 24); }
function kinhDoMt(jd) {
  var T = (jd - 2451545.5 - 7 / 24) / 36525, T2 = T * T, dr = Math.PI / 180;
  var M = 357.52910 + 35999.05030 * T - 0.0001559 * T2 - 0.00000048 * T * T2, L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
  var DL = (1.914600 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M) + (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) + 0.000290 * Math.sin(dr * 3 * M);
  var L = (L0 + DL) * dr; L -= Math.PI * 2 * Math.floor(L / (Math.PI * 2));
  return Math.floor(L / Math.PI * 6);
}
function thang11(yy) {
  var off = jdnTu(31, 12, yy) - 2415021, k = Math.floor(off / 29.530588853), nm = ngayTrangMoi(k);
  if (kinhDoMt(nm) >= 9) nm = ngayTrangMoi(k - 1);
  return nm;
}
function thangNhuan(a11) {
  var k = Math.floor((a11 - 2415021.076998695) / 29.530588853 + 0.5), last = 0, i = 1, arc = kinhDoMt(ngayTrangMoi(k + i));
  do { last = arc; i++; arc = kinhDoMt(ngayTrangMoi(k + i)); } while (arc !== last && i < 14);
  return i - 1;
}
/** Dương lịch sang âm lịch: [ngày, tháng, năm, nhuận 0/1]. */
function doiAm(dd, mm, yy) {
  var dayNumber = jdnTu(dd, mm, yy), k = Math.floor((dayNumber - 2415021.076998695) / 29.530588853), monthStart = ngayTrangMoi(k + 1);
  if (monthStart > dayNumber) monthStart = ngayTrangMoi(k);
  var a11 = thang11(yy), b11 = a11, nam;
  if (a11 >= monthStart) { nam = yy; a11 = thang11(yy - 1); } else { nam = yy + 1; b11 = thang11(yy + 1); }
  var ngay = dayNumber - monthStart + 1, diff = Math.floor((monthStart - a11) / 29), nhuan = 0, thang = diff + 11;
  if (b11 - a11 > 365) { var lo = thangNhuan(a11); if (diff >= lo) { thang = diff + 10; if (diff === lo) nhuan = 1; } }
  if (thang > 12) thang -= 12;
  if (thang >= 11 && diff < 4) nam -= 1;
  return [ngay, thang, nam, nhuan];
}
var AM = {};
function am(d) { var k = ymd(d); return AM[k] || (AM[k] = doiAm(d.getDate(), d.getMonth() + 1, d.getFullYear())); }
var LE_DL = { '1-1': 'Tết Dương lịch', '30-4': 'Giải phóng miền Nam', '1-5': 'Quốc tế Lao động', '2-9': 'Quốc khánh' };
function leNgay(d) {
  var dl = LE_DL[d.getDate() + '-' + (d.getMonth() + 1)]; if (dl) return dl;
  var a = am(d); if (a[3]) return '';
  if (a[1] === 1 && a[0] === 1) return 'Tết Nguyên đán';
  if (a[1] === 1 && a[0] === 2) return 'Mùng 2 Tết';
  if (a[1] === 1 && a[0] === 3) return 'Mùng 3 Tết';
  if (a[1] === 3 && a[0] === 10) return 'Giỗ Tổ Hùng Vương';
  var mai = am(cong(d, 1)); if (mai[0] === 1 && mai[1] === 1 && !mai[3]) return 'Giao thừa';
  return '';
}
var amChu = function (d) { var a = am(d); return a[0] === 1 ? '1/' + a[1] : String(a[0]); };
/** Dòng phụ dưới ngày: tên ngày lễ và ngày âm lịch. */
function phuNgay(d) {
  if (!S.am) return '';
  var le = leNgay(d), a = am(d);
  return '<small class="lc-am">' + (le ? '<span class="lc-le">' + esc(le) + '</span> ' : '') + 'âm ' + (a[0] === 1 ? '<b>1/' + a[1] + '</b>' : a[0] + '/' + a[1]) + '</small>';
}

/* ---------- khoảng đang xem ---------- */
function khoang() {
  var a = S.moc;
  if (S.xem === 'ngay' || S.xem === 'tai') return [a, a];
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
  if (S.xem === 'ngay' || S.xem === 'tai') return nhanNgay(a) + '/' + a.getFullYear();
  if (S.xem === 'nam') return 'Năm ' + a.getFullYear();
  if (S.xem === 'thang') return 'Tháng ' + (S.moc.getMonth() + 1) + '/' + S.moc.getFullYear();
  return a.getDate() + '/' + (a.getMonth() + 1) + ' – ' + b.getDate() + '/' + (b.getMonth() + 1) + '/' + b.getFullYear() + (S.xem === 'tuan' || S.xem === 't26' ? ' · Tuần ' + isoTuan(a) : '');
}
function doiThang(t) {
  var x = S.moc, c = new Date(x.getFullYear(), x.getMonth() + t + 1, 0);
  S.moc = new Date(c.getFullYear(), c.getMonth(), Math.min(x.getDate(), c.getDate()));   // ngày 31 sang tháng ngắn thì lấy ngày cuối tháng
}
function buoc(n) {
  var m = { ngay: 1, tai: 1, '3ngay': 3, tuan: 7, t26: 7, trinh: 30 }[S.xem];
  if (S.xem === 'thang') doiThang(n);
  else if (S.xem === 'nam') doiThang(12 * n);
  else S.moc = cong(S.moc, n * m);
  ve();
}

/* ---------- lịch lặp: mở rộng thành từng lần trong cửa sổ đang xem ---------- */
function moLap(x, tu, den) {
  var b = phanNgay(x.batDau.slice(0, 10)), span = Math.round((phanNgay(x.ketThuc.slice(0, 10)) - b) / 86400000), gio1 = x.batDau.slice(11), gio2 = x.ketThuc.slice(11);
  var cuoi = x.lapDen ? phanNgay(x.lapDen) : den; if (cuoi > den) cuoi = den;
  var ra = [];
  for (var i = 0; i < 4000; i++) {
    var d;
    if (x.lap === 'ngay') d = cong(b, i);
    else if (x.lap === 'tuan') d = cong(b, 7 * i);
    else if (x.lap === '2tuan') d = cong(b, 14 * i);
    else if (x.lap === 'thang') { d = new Date(b.getFullYear(), b.getMonth() + i, b.getDate()); if (d.getDate() !== b.getDate()) continue; }   // tháng không có ngày đó thì bỏ qua
    else { d = new Date(b.getFullYear() + i, b.getMonth(), b.getDate()); if (d.getMonth() !== b.getMonth()) continue; }
    if (d > cuoi) break;
    if (cong(d, span) < tu) continue;
    ra.push(Object.assign({}, x, { id: x.id + '@' + ymd(d), _goc: x.id, batDau: ymd(d) + ' ' + gio1, ketThuc: ymd(cong(d, span)) + ' ' + gio2 }));
  }
  return ra;
}
function lamMoi() {
  var y = S.moc.getFullYear(), tu = new Date(y - 1, 0, 1), den = new Date(y + 1, 11, 31), ds = [];
  S.namMo = y;
  S.goc.forEach(function (x) { if (x.lap && TEN_LAP[x.lap]) ds = ds.concat(moLap(x, tu, den)); else ds.push(x); });
  S.ds = ds; danhDauTrung();
}

/* Trùng giờ: cùng địa điểm (phòng, xe) hoặc cùng một người trong thành phần; lịch cả ngày và lịch bị từ chối không tính */
function tachTen(s) { return String(s || '').split(/[,;\n]/).map(function (t) { return t.trim().toLowerCase(); }).filter(Boolean); }
function dangTrung(a, b) {
  if (a.id === b.id || a.caNgay || b.caNgay || a.trangThai === 'tuchoi' || b.trangThai === 'tuchoi') return false;
  if (!(a.batDau < b.ketThuc && b.batDau < a.ketThuc)) return false;
  if (a.diaDiem && a.diaDiem.trim().toLowerCase() === (b.diaDiem || '').trim().toLowerCase()) return true;
  var ten = tachTen(b.thanhPhan);
  return tachTen(a.thanhPhan).some(function (t) { return ten.indexOf(t) >= 0; });
}
function danhDauTrung() {
  S.ds.forEach(function (x) { x._trung = []; });
  // Xếp theo giờ bắt đầu: lịch sau chỉ cần so với những lịch bắt đầu trước giờ kết thúc của lịch đang xét
  var s = S.ds.filter(function (x) { return !x.caNgay; }).sort(function (a, b) { return a.batDau < b.batDau ? -1 : a.batDau > b.batDau ? 1 : 0; });
  for (var i = 0; i < s.length; i++) for (var j = i + 1; j < s.length && s[j].batDau < s[i].ketThuc; j++) if (dangTrung(s[i], s[j])) { s[i]._trung.push(s[j]); s[j]._trung.push(s[i]); }
}
function khopDv(x) { return S.dv === 'Tất cả' || !x.donVi || x.donVi === S.dv; }
function khopToi(x) { return !S.cuaToi || !S.ten || boDau(x.thanhPhan).indexOf(boDau(S.ten)) >= 0; }
function khopTim(x) {
  if (!S.q) return true;
  var t = boDau([x.tieuDe, x.diaDiem, x.thanhPhan, x.ghiChu, x.donVi, TEN_LOAI[x.loai]].join(' '));
  return boDau(S.q).split(/\s+/).filter(Boolean).every(function (w) { return t.indexOf(w) >= 0; });
}
function dsLoc() { return S.ds.filter(function (x) { return khopDv(x) && khopToi(x) && khopTim(x); }); }
function dsHien() { return dsLoc().filter(function (x) { return !S.an[x.loai]; }); }
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
function keoDuoc(x) { return !x._goc && !x.caNgay && x.batDau.slice(0, 10) === x.ketThuc.slice(0, 10); }
var DAU_TT = { cho: '⏳ ', tuchoi: '✕ ' };
function nutSu(x, cls, chuPhu, style, luoi) {
  var keo = luoi && keoDuoc(x), tt = chiPhongXe(x.loai) ? x.trangThai : '';
  return '<button type="button" class="lc-su ' + cls + (keo ? ' keo' : '') + (x._trung.length ? ' trung' : '') + (tt ? ' tt-' + tt : '') + '" data-id="' + esc(x.id) + '" style="--c:' + MAU[x.loai] + ';' + (style || '') + '" title="' + esc(x.tieuDe) + '"><b>' + (DAU_TT[tt] || '') + esc(x.tieuDe) + (x._goc ? ' ↻' : '') + '</b>' +
    (chuPhu != null ? '<small>' + esc(chuPhu) + (x._trung.length ? ' · Trùng giờ' : '') + '</small>' : '') + (keo ? '<i class="lc-gt" aria-hidden="true"></i>' : '') + '</button>';
}

/* ---------- các kiểu xem ---------- */
function cotNgay(tu, den) {
  var m = theoNgay(dsHien(), tu, den), ra = [], nay = ymd(homNay());
  for (var d = tu; ymd(d) <= ymd(den); d = cong(d, 1)) {
    var k = ymd(d), tat = m[k] || [];
    ra.push({ k: k, dd: '', nay: k === nay, cuoiTuan: (d.getDay() + 6) % 7 >= 5, dau: '<h4 class="' + (k === nay ? 'nay' : '') + '" data-ngay="' + k + '">' + nhanNgay(d) + phuNgay(d) + '</h4>',
      caNgay: tat.filter(function (e) { return e.x.caNgay; }), co: tat.filter(function (e) { return !e.x.caNgay; }) });
  }
  return ra;
}
/** Mỗi phòng họp, xe một cột trong cùng một ngày. */
function cotTai(d) {
  var k = ymd(d), tat = (theoNgay(dsHien(), d, d)[k] || []).filter(function (e) { return !e.x.caNgay; }), ten = TAI_NGUYEN.slice(), nay = k === ymd(homNay());
  var gTen = function (e) { return (e.x.diaDiem || '').trim().toLowerCase(); };
  tat.forEach(function (e) { var t = (e.x.diaDiem || '').trim(); if (t && chiPhongXe(e.x.loai) && !ten.some(function (y) { return y.toLowerCase() === t.toLowerCase(); })) ten.push(t); });
  return ten.map(function (t) {
    return { k: k, dd: t, nay: nay, cuoiTuan: false, dau: '<h4>' + esc(t) + '</h4>', caNgay: [], co: tat.filter(function (e) { return gTen(e) === t.toLowerCase(); }) };
  });
}
function veLuoiCot(cot, rong) {
  var lo = MAC_LO, hi = MAC_HI;
  cot.forEach(function (c) {
    c.co = c.co.map(function (e) { return { x: e.x, a: e.a, b: Math.max(e.b, e.a + 30) }; });
    chiaLan(c.co);
    c.co.forEach(function (e) { lo = Math.min(lo, Math.floor(e.a / 60) * 60); hi = Math.max(hi, Math.min(1440, Math.ceil(e.b / 60) * 60)); });
  });
  var cao = (hi - lo) / 60 * PX, gio = '', n = new Date(), mNay = n.getHours() * 60 + n.getMinutes(), coCa = cot.some(function (c) { return c.caNgay.length; }) || !rong;
  for (var g = lo; g < hi; g += 60) gio += '<span style="top:' + (g - lo) / 60 * PX + 'px">' + dongHo(g) + '</span>';
  var ngoai = function (c) {   // ngoài giờ làm việc mờ đi, cuối tuần mờ cả cột
    if (c.cuoiTuan) return '<div class="lc-ngoai" style="top:0;height:' + cao + 'px"></div>';
    var tren = Math.max(0, Math.min(hi - lo, GIO_LAM[0] - lo)), duoi = Math.max(0, GIO_LAM[1] - lo);
    return (tren > 0 ? '<div class="lc-ngoai" style="top:0;height:' + tren / 60 * PX + 'px"></div>' : '') + (duoi < hi - lo ? '<div class="lc-ngoai" style="top:' + duoi / 60 * PX + 'px;height:' + (hi - lo - duoi) / 60 * PX + 'px"></div>' : '');
  };
  var st = '--n:' + cot.length + (rong ? ';--min:118px' : '');
  $('#lcNoi').innerHTML = '<div class="lc-cuon" id="cuonGio"><div class="lc-dau" style="' + st + '"><span></span>' + cot.map(function (c) { return c.dau; }).join('') + '</div>' +
    (coCa ? '<div class="lc-cangay" style="' + st + '"><span>Cả ngày</span>' + cot.map(function (c) { return '<div>' + c.caNgay.map(function (e) { return nutSu(e.x, 'tinh'); }).join('') + '</div>'; }).join('') + '</div>' : '') +
    '<div class="lc-than" style="' + st + ';height:' + cao + 'px"><div class="lc-gio">' + gio + '</div>' + cot.map(function (c) {
      return '<div class="lc-cot' + (c.nay ? ' nay' : '') + '" data-tao="' + c.k + '" data-lo="' + lo + '"' + (c.dd ? ' data-dd="' + esc(c.dd) + '"' : '') + '>' + ngoai(c) + c.co.map(function (e) {
        var top = (e.a - lo) / 60 * PX, h = Math.max(24, (e.b - e.a) / 60 * PX - 2);
        return nutSu(e.x, '', dongHo(e.a) + '–' + dongHo(Math.min(e.b, 1439)), 'top:' + top + 'px;height:' + h + 'px;left:calc(' + e.lan + ' / ' + e.soLan + ' * 100% + 1px);width:calc(100% / ' + e.soLan + ' - 3px)', true);
      }).join('') + (c.nay && mNay >= lo && mNay <= hi ? '<div class="lc-bay-gio" style="top:' + (mNay - lo) / 60 * PX + 'px"></div>' : '') + '</div>';
    }).join('') + '</div></div>';
  var cuon = $('#cuonGio'); if (cuon) cuon.scrollTop = Math.max(0, (Math.max(lo, 7 * 60) - lo) / 60 * PX);
}
function veThang(tu, den) {
  var m = theoNgay(dsHien(), tu, den), nay = ymd(homNay()), o = '', max = dienThoai() ? 2 : 3;
  for (var d = tu; ymd(d) <= ymd(den); d = cong(d, 1)) {
    var k = ymd(d), ds = m[k] || [], le = S.am ? leNgay(d) : '', t = (d.getDay() + 6) % 7, a = am(d);
    o += '<div class="lc-ngay' + (k === nay ? ' nay' : '') + (d.getMonth() !== S.moc.getMonth() ? ' ngoai' : '') + (t === 6 ? ' cn' : '') + (le ? ' le' : '') + '" data-tao="' + k + '"><div class="lc-ngay-dau"><button type="button" class="lc-so" data-ngay="' + k + '" aria-label="Xem ngày ' + vnNgay(k) + '">' + d.getDate() + '</button>' +
      (S.am ? '<span class="lc-am">' + (a[0] === 1 ? '<b>1/' + a[1] + '</b>' : amChu(d)) + '</span>' : '') + '</div>' + (le ? '<span class="lc-le">' + esc(le) + '</span>' : '') +
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
      var k = y + '-' + hai(t + 1) + '-' + hai(d), n = (m[k] || []).length, ngay = new Date(y, t, d), le = S.am ? leNgay(ngay) : '', a = S.am ? am(ngay) : null;
      o += '<button type="button" class="' + (n >= 4 ? 'm3' : n >= 2 ? 'm2' : n ? 'm1' : '') + (k === nay ? ' nay' : '') + (le ? ' le' : '') + '" data-ngay="' + k + '" title="' + esc((le ? le + ' · ' : '') + (a ? 'âm ' + a[0] + '/' + a[1] : '')) + '" aria-label="' + vnNgay(k) + ': ' + n + ' lịch">' + d + '</button>';
    }
    return '<div><h4>Tháng ' + (t + 1) + '</h4><div class="lc-tn">' + o + '</div></div>';
  }).join('') + '</div>';
}
function dongTrinh(e) {
  var x = e.x, phu = [x.diaDiem, x.thanhPhan].filter(Boolean).join(' · '), tt = chiPhongXe(x.loai) ? x.trangThai : '';
  return '<button type="button" class="lc-dong' + (x._trung.length ? ' trung' : '') + (tt ? ' tt-' + tt : '') + '" data-id="' + esc(x.id) + '" style="--c:' + MAU[x.loai] + '"><time>' + (x.caNgay ? 'Cả ngày' : dongHo(e.a) + '–' + dongHo(Math.min(e.b, 1439))) + '</time><span><b>' + (DAU_TT[tt] || '') + esc(x.tieuDe) + (x._goc ? ' ↻' : '') + '</b><small>' + esc(TEN_LOAI[x.loai]) + (tt ? ' · ' + TEN_TT[tt] : '') + (x.donVi ? ' · ' + esc(x.donVi) : '') + (phu ? ' · ' + esc(phu) : '') + (x._trung.length ? ' · Trùng giờ' : '') + '</small></span></button>';
}
function veTrinh(tu, den) {
  var m = theoNgay(dsHien(), tu, den), nay = ymd(homNay()), ks = Object.keys(m).sort();
  $('#lcNoi').innerHTML = ks.length ? ks.map(function (k) {
    var d = phanNgay(k);
    return '<section class="lc-tt-ngay' + (k === nay ? ' nay' : '') + '"><h4>' + nhanNgay(d) + '/' + d.getFullYear() + phuNgay(d) + '</h4>' + m[k].map(dongTrinh).join('') + '</section>';
  }).join('') : '<div class="lc-rong">Không có lịch trong 30 ngày này</div>';
}
function veTimKiem() {
  var ds = dsHien().slice().sort(function (a, b) { return a.batDau < b.batDau ? -1 : a.batDau > b.batDau ? 1 : 0; }), nay = ymd(homNay()), nhom = [], truoc = '';
  ds.slice(0, 300).forEach(function (x) {
    var k = x.batDau.slice(0, 10);
    if (k !== truoc) { nhom.push({ k: k, ds: [] }); truoc = k; }
    nhom[nhom.length - 1].ds.push({ x: x, a: phut(x.batDau), b: phut(x.ketThuc) });
  });
  $('#lcNoi').innerHTML = '<div class="lc-ket-qua">' + ds.length + ' lịch khớp “' + esc(S.q) + '”' + (ds.length > 300 ? ', hiện 300 lịch đầu' : '') + ' · <button type="button" class="lc-xoa-tim" id="lcXoaTim">Xoá tìm kiếm</button></div>' +
    (ds.length ? nhom.map(function (g) {
      var d = phanNgay(g.k);
      return '<section class="lc-tt-ngay' + (g.k === nay ? ' nay' : '') + '"><h4>' + nhanNgay(d) + '/' + d.getFullYear() + phuNgay(d) + '</h4>' + g.ds.map(dongTrinh).join('') + '</section>';
    }).join('') : '<div class="lc-rong">Không có lịch nào khớp</div>');
}
function veMini() {
  var el = $('#lcMini'); if (!el) return;
  var y = S.moc.getFullYear(), m = S.moc.getMonth(), dau = thuHai(new Date(y, m, 1)), cuoi = cong(thuHai(new Date(y, m + 1, 0)), 6), k = khoang(), a = ymd(k[0]), b = ymd(k[1]), nay = ymd(homNay());
  var co = theoNgay(dsHien(), dau, cuoi), o = '<span class="lc-mt">Tu</span>' + THU.map(function (t) { return '<span class="lc-mt">' + t + '</span>'; }).join('');
  for (var d = dau; ymd(d) <= ymd(cuoi); d = cong(d, 1)) {
    var s = ymd(d), t = (d.getDay() + 6) % 7;
    if (t === 0) o += '<em>' + isoTuan(d) + '</em>';
    o += '<button type="button" data-mini="' + s + '" class="' + (d.getMonth() !== m ? 'ngoai ' : '') + (s === nay ? 'nay ' : '') + (s >= a && s <= b ? 'chon ' : '') + (co[s] ? 'co ' : '') + (S.am && leNgay(d) ? 'le' : '') + '">' + d.getDate() + '</button>';
  }
  el.innerHTML = '<div class="lc-mini-dau"><b>Tháng ' + (m + 1) + '/' + y + '</b><span><button type="button" data-minit="-1" aria-label="Tháng trước">‹</button><button type="button" data-minit="1" aria-label="Tháng sau">›</button></span></div><div class="lc-mini-luoi">' + o + '</div>';
}
function veSapToi() {
  var el = $('#lcSapToi'); if (!el) return;
  var n = new Date(), bay = ymd(n) + ' ' + hai(n.getHours()) + ':' + hai(n.getMinutes()), nay = ymd(n);
  var ds = dsHien().filter(function (x) { return x.ketThuc >= bay && x.trangThai !== 'tuchoi'; }).sort(function (a, b) { return a.batDau < b.batDau ? -1 : a.batDau > b.batDau ? 1 : 0; }).slice(0, 6);
  el.innerHTML = '<h3>Sắp tới</h3>' + (ds.length ? ds.map(function (x) {
    var k = x.batDau.slice(0, 10);
    return '<button type="button" class="lc-st" data-id="' + esc(x.id) + '" style="--c:' + MAU[x.loai] + '"><b>' + esc(x.tieuDe) + '</b><small>' + (k === nay ? 'Hôm nay' : nhanNgay(phanNgay(k))) + ' · ' + (x.caNgay ? 'cả ngày' : x.batDau.slice(11)) + '</small></button>'; }).join('') : '<p class="lc-phu">Không có lịch sắp tới</p>');
}
function ve() {
  if (!$('#lcNoi')) return;   // đã rời trang trong lúc đang đọc dữ liệu
  if (S.namMo !== S.moc.getFullYear()) lamMoi();
  var k = khoang();
  $('#lcTenKhoang').textContent = S.q ? 'Kết quả tìm kiếm' : tenKhoang();
  $('#lcXem').innerHTML = XEM.map(function (x) { return '<button type="button" data-xem="' + x[0] + '" class="' + (S.xem === x[0] && !S.q ? 'chon' : '') + '" aria-pressed="' + (S.xem === x[0]) + '">' + x[1] + '</button>'; }).join('');
  $('#lcDv').innerHTML = DV.concat(['Tất cả']).map(function (d) { return '<button type="button" data-dv="' + esc(d) + '" class="' + (S.dv === d ? 'chon' : '') + '" aria-pressed="' + (S.dv === d) + '">' + esc(d) + '</button>'; }).join('');
  var dem = {}, nt = theoNgay(dsLoc(), k[0], k[1]), da = {}, coTb = 'Notification' in window && Notification.permission === 'granted';
  Object.keys(nt).forEach(function (n) { nt[n].forEach(function (e) { if (!da[e.x.id]) { da[e.x.id] = 1; dem[e.x.loai] = (dem[e.x.loai] || 0) + 1; } }); });
  $('#lcLoai').innerHTML = LOAI.map(function (l) { return '<button type="button" class="lc-kind' + (S.an[l[0]] ? ' off' : '') + '" data-loai="' + l[0] + '" aria-pressed="' + !S.an[l[0]] + '"><i style="background:' + l[2] + '"></i>' + l[1] + (dem[l[0]] ? '<b>' + dem[l[0]] + '</b>' : '') + '</button>'; }).join('') +
    '<button type="button" class="lc-kind" id="lcToi2" aria-pressed="' + S.cuaToi + '" title="Chỉ hiện lịch có tên bạn trong thành phần"><i style="background:var(--brand)"></i>Của tôi' + (S.ten ? ': ' + esc(S.ten) : '') + '</button>' +
    '<button type="button" class="lc-kind" id="lcAm" aria-pressed="' + S.am + '" title="Hiện ngày âm lịch và ngày lễ"><i style="background:var(--gold)"></i>Âm lịch, ngày lễ</button>' +
    '<button type="button" class="lc-kind" id="lcNhac" aria-pressed="' + coTb + '" title="Nhắc việc trên trình duyệt khi lịch có đặt nhắc"><i style="background:var(--info-fg)"></i>Nhắc việc</button>';
  veMini(); veSapToi();
  if (S.q) veTimKiem();
  else if (S.xem === 'thang') veThang(k[0], k[1]);
  else if (S.xem === 'nam') veNam();
  else if (S.xem === 'trinh') veTrinh(k[0], k[1]);
  else if (S.xem === 'tai') veLuoiCot(cotTai(S.moc), true);
  else veLuoiCot(cotNgay(k[0], k[1]), false);
}

/* ---------- dữ liệu mẫu: lịch giả chỉ nằm trong trình duyệt, không ghi vào lịch thật ---------- */
function demoTao() {
  var h = homNay(), ds = [], dem = 0, goc = Math.round((thuHai(h) - h) / 86400000);   // goc: thứ Hai của tuần này, tính từ hôm nay
  /** loai, tên, số ngày kể từ hôm nay, giờ bắt đầu (null = cả ngày), giờ kết thúc, tuỳ chọn {dd, tp, dv, gc, dai: số ngày kéo dài thêm, lap, den: số ngày kể từ hôm nay tới lúc hết lặp, tt, nhac, lk} */
  var them = function (loai, ten, d, a, b, o) {
    o = o || {};
    ds.push({ id: 'mau' + (++dem), tieuDe: ten, loai: loai, caNgay: !a, batDau: ymd(cong(h, d)) + ' ' + (a || '00:00'), ketThuc: ymd(cong(h, d + (o.dai || 0))) + ' ' + (b || '23:59'),
      diaDiem: o.dd || '', thanhPhan: o.tp || '', donVi: o.dv || '', ghiChu: o.gc || '', lap: o.lap || '', lapDen: o.den != null ? ymd(cong(h, o.den)) : '',
      lienKet: o.lk || '', trangThai: chiPhongXe(loai) ? o.tt || 'duyet' : '', nhac: o.nhac || '' });
  };
  var P1 = 'Phòng họp 1', P2 = 'Phòng họp 2', PL = 'Phòng họp lớn', X1 = 'Xe 51A-123.45', X2 = 'Xe 51B-678.90';
  var T = function (k, thu) { return goc + 7 * k + thu; };   // thu: 0 = thứ Hai … 6 = Chủ nhật
  var ngayThang = function (t, ngay) { var d = new Date(h.getFullYear(), h.getMonth() + t, ngay); return Math.round((d - h) / 86400000); };

  // Lịch lặp: giao ban thứ Hai hằng tuần, Đảng uỷ hai tuần một lần, bảo hiểm thứ Năm hằng tuần, thuế ngày 20 hằng tháng, kỷ niệm hằng năm, tập huấn hằng ngày
  them('hop', 'Giao ban tuần', T(-10, 0), '08:00', '09:30', { dd: PL, tp: 'TGĐ, P.TGĐ Hùng, P.TGĐ Mai, Trưởng phòng TCHC, Trưởng phòng KHĐT', dv: 'CRCK2', lap: 'tuan', den: T(14, 0), nhac: '30', gc: 'Báo cáo công việc tuần trước, kế hoạch tuần này.\nTrưởng phòng chuẩn bị số liệu trước 16:00 thứ Sáu.' });
  them('hop', 'Họp ban Thường vụ Đảng uỷ', T(-10, 1), '14:00', '16:00', { dd: P2, tp: 'Bí thư, Phó bí thư, các Uỷ viên', dv: 'Đảng ủy', lap: '2tuan', den: T(14, 1) });
  them('hop', 'Họp giao ban bảo hiểm', T(-4, 3), '09:00', '10:00', { dd: P1, tp: 'Phòng BHCK, Phòng BHVN', dv: 'BHVN', lap: 'tuan', den: T(10, 3) });
  them('giayto', 'Hạn nộp báo cáo thuế tháng', ngayThang(-6, 20), null, null, { dv: 'CRCK2', lap: 'thang', den: ngayThang(8, 20) });
  them('khac', 'Kỷ niệm ngày thành lập công ty', Math.round((new Date(h.getFullYear() - 1, 2, 15) - h) / 86400000), null, null, { dv: 'CRCK2', lap: 'nam', gc: 'Lặp hằng năm, không có ngày kết thúc.' });
  them('phong', 'Tập huấn phần mềm quản lý văn bản', T(1, 0), '13:30', '15:00', { dd: P1, tp: 'Văn thư các đơn vị', dv: 'BHCK', lap: 'ngay', den: T(1, 4), gc: 'Lặp hằng ngày trong 5 ngày, thứ Hai đến thứ Sáu tuần sau.' });

  // Tuần này: đủ các trường hợp để xem
  them('xe', 'Xe đi Sở Kế hoạch và Đầu tư nộp hồ sơ', T(0, 0), '08:30', '11:30', { dd: X1, tp: 'Chị Lan (Văn thư), Anh Tuấn (lái xe)', dv: 'CRCK2' });
  them('giayto', 'Hạn nộp báo cáo an toàn lao động quý IV', T(0, 0), null, null, { dv: 'CRCK2', gc: 'Nộp cho Sở Lao động trước 17:00.', lk: 'https://service.base.vn' });
  them('phong', 'Phỏng vấn ứng viên kế toán', T(0, 0), '14:00', '16:00', { dd: P2, tp: 'Trưởng phòng TCHC, Trưởng phòng Kế toán', dv: 'CRCK2' });
  them('hop', 'Họp kế hoạch đầu tư năm 2027', T(0, 1), '09:00', '10:30', { dd: P1, tp: 'Trưởng phòng KHĐT, P.TGĐ Hùng', dv: 'CRCK2', nhac: '10', lk: 'https://service.base.vn' });
  them('hop', 'Họp rà soát nhân sự (trùng phòng)', T(0, 1), '09:30', '11:00', { dd: P1, tp: 'Trưởng phòng TCHC, Chuyên viên Hà', dv: 'CRCK2', gc: 'Cố ý đặt trùng Phòng họp 1 để thấy cảnh báo trùng giờ.' });
  them('hop', 'Làm việc với đối tác Vinatex (trùng người)', T(0, 1), '10:00', '11:30', { dd: P2, tp: 'Trưởng phòng KHĐT, Giám đốc Vinatex', dv: 'CRCK2', gc: 'Trùng người với cuộc họp kế hoạch đầu tư lúc 09:00.' });
  them('congtac', 'Đoàn công tác Phnom Penh làm việc với đối tác', T(0, 2), null, null, { dai: 2, dd: 'Phnom Penh, Campuchia', tp: 'TGĐ, P.TGĐ Mai, Trưởng phòng KHĐT', dv: 'CRCK2', gc: 'Đi 3 ngày, về chiều thứ Sáu. Vé máy bay do văn phòng đặt.' });
  them('khac', 'Nghỉ phép: anh Minh (phòng Kỹ thuật)', T(0, 2), null, null, { dv: 'CRCK2' });
  them('hop', 'Gọi điện thoại nhanh với Tập đoàn', T(0, 2), '10:00', '10:15', { tp: 'P.TGĐ Hùng', dv: 'BHCK', gc: 'Chỉ 15 phút, để xem khối rất ngắn.' });
  them('hop', 'Họp triển khai chương trình chuyển đổi số toàn công ty, thống nhất lộ trình, phân công phụ trách từng phòng ban và kế hoạch đào tạo người dùng cuối', T(0, 2), '14:00', '15:30', { dd: PL, tp: 'Tất cả trưởng phòng', dv: 'CRCK2', gc: 'Tên dài để xem cách xuống dòng.' });
  them('phong', 'Đặt Phòng họp lớn cho hội nghị khách hàng (chờ duyệt)', T(0, 2), '08:00', '12:00', { dd: PL, tp: 'Phòng Kinh doanh', dv: 'CRCK2', tt: 'cho', gc: 'Đang chờ người quản lý phòng họp duyệt.' });
  them('xe', 'Xe đi Vũng Tàu (bị từ chối)', T(0, 2), '07:00', '17:00', { dd: X1, tp: 'Anh Bình (lái xe)', dv: 'CRCK2', tt: 'tuchoi', gc: 'Bị từ chối nên không tính trùng xe.' });
  // Thứ Năm: nhiều lịch trong ngày, sớm, khuya, qua đêm
  them('xe', 'Xe đưa đoàn ra sân bay Tân Sơn Nhất', T(0, 3), '06:30', '08:00', { dd: X2, tp: 'Anh Tuấn (lái xe)', dv: 'CRCK2', gc: 'Khối bắt đầu sớm hơn 07:00 để lưới giờ mở rộng.' });
  them('hop', 'Họp đầu ngày (stand-up)', T(0, 3), '08:00', '08:30', { dd: P1, tp: 'Phòng TCHC', dv: 'CRCK2' });
  them('hop', 'Họp phòng Kế toán', T(0, 3), '08:00', '09:00', { dd: P2, tp: 'Phòng Kế toán', dv: 'CRCK2' });
  them('phong', 'Đào tạo an toàn lao động', T(0, 3), '08:15', '11:30', { dd: PL, tp: 'Công nhân khối sản xuất', dv: 'BHCK' });
  them('viec', 'Gửi bản thảo quy chế cho Pháp chế', T(0, 3), '10:00', '10:30', { tp: 'Chuyên viên Hà', dv: 'CRCK2', nhac: '10' });
  them('xe', 'Xe đón khách Tập đoàn', T(0, 3), '13:00', '15:00', { dd: X1, tp: 'Anh Tuấn (lái xe)', dv: 'CRCK2' });
  them('hop', 'Tiếp khách và ăn tối với đối tác', T(0, 3), '18:30', '21:00', { dd: 'Nhà hàng Sen Vàng, 25 Lê Duẩn', tp: 'TGĐ, P.TGĐ Hùng, Giám đốc Vinatex', dv: 'CRCK2' });
  them('khac', 'Trực sự cố hệ thống (qua đêm)', T(0, 3), '22:00', '02:00', { dai: 1, dd: 'Phòng máy chủ', tp: 'Anh Dũng (IT)', dv: 'CRCK2', gc: 'Bắt đầu 22:00 thứ Năm, kết thúc 02:00 thứ Sáu.' });
  // Thứ Sáu, Bảy, Chủ nhật
  them('viec', 'Trình ký quyết định bổ nhiệm', T(0, 4), null, null, { dv: 'CRCK2' });
  them('viec', 'Nộp bản kê tài sản cố định', T(0, 4), null, null, { dv: 'CRCK2' });
  them('giayto', 'Hết hạn giấy phép xả thải', T(0, 4), null, null, { dv: 'BHCK', gc: 'Cần gia hạn trước ngày này.' });
  them('giayto', 'Hạn đóng bảo hiểm tháng này', T(0, 4), null, null, { dv: 'CRCK2' });
  them('hop', 'Họp tổng kết tuần', T(0, 4), '15:00', '17:00', { dd: PL, tp: 'TGĐ, P.TGĐ Hùng, P.TGĐ Mai, các Trưởng phòng', dv: 'CRCK2' });
  them('phong', 'Đặt phòng sinh hoạt chi bộ', T(0, 4), '17:00', '18:00', { dd: P2, dv: 'Đảng ủy', tt: 'cho', gc: 'Không ghi thành phần.' });
  them('khac', 'Trực cơ quan ngày thứ Bảy', T(0, 5), null, null, { tp: 'Chị Lan (Văn thư)', dv: 'CRCK2' });
  // Chủ nhật tuần này để trống

  // Tuần sau và các tuần sau nữa: đợt nhiều ngày
  them('khac', 'Kiểm toán nội bộ', T(1, 0), null, null, { dai: 4, dd: 'Tại văn phòng công ty', tp: 'Đoàn kiểm toán Tập đoàn', dv: 'CRCK2', gc: 'Kéo dài cả tuần, thứ Hai đến thứ Sáu.' });
  them('congtac', 'Đi thị sát vườn cây Tây Ninh', T(1, 2), '07:30', '17:00', { dd: 'Nông trường Tây Ninh', tp: 'P.TGĐ Mai, Trưởng phòng Kỹ thuật', dv: 'BHCK' });
  them('xe', 'Xe đi Tây Ninh', T(1, 2), '07:00', '18:00', { dd: X2, tp: 'Anh Tuấn (lái xe)', dv: 'BHCK' });
  them('xe', 'Xe đi dự hội nghị tại Biên Hòa (trùng xe)', T(1, 2), '08:00', '12:00', { dd: X2, tp: 'Anh Bình (lái xe)', dv: 'CRCK', gc: 'Cố ý trùng xe với chuyến đi Tây Ninh.' });
  them('congtac', 'Hội nghị ngành cao su toàn quốc', T(2, 1), null, null, { dai: 1, dd: 'Hà Nội', tp: 'TGĐ, Trưởng phòng KHĐT', dv: 'CRCK2' });
  them('khac', 'Nghỉ phép: chị Hương', T(1, 3), null, null, { dai: 6, dv: 'BHVN', gc: 'Nghỉ phép hai tuần, kéo qua cuối tuần.' });
  // Lịch không ghi đơn vị: hiện ở mọi đơn vị
  them('viec', 'Thông báo chung toàn công ty (không ghi đơn vị)', T(0, 2), '16:00', '16:30', { gc: 'Không có đơn vị nên hiện ở mọi bộ lọc đơn vị.' });

  // Rải ngẫu nhiên (cố định) cả năm để xem chế độ Tháng và Năm có độ dày khác nhau
  var seed = 20261105, ngau = function (n) { seed = (seed * 1103515245 + 12345) % 2147483648; return Math.floor(seed / 2147483648 * n); };
  var MAUL = [
    ['hop', ['Họp phòng', 'Họp triển khai', 'Họp đánh giá tiến độ', 'Họp với nhà cung cấp', 'Họp hội đồng thi đua'], [P1, P2, PL]],
    ['phong', ['Đặt phòng đào tạo', 'Đặt phòng phỏng vấn', 'Đặt phòng tiếp khách'], [P1, P2, PL]],
    ['xe', ['Xe đi công tác', 'Xe đưa đón khách', 'Xe đi ngân hàng', 'Xe đi Sở'], [X1, X2]],
    ['congtac', ['Công tác tại nông trường', 'Đi làm việc với cơ quan thuế', 'Dự hội nghị'], ['Nông trường', 'Cục Thuế', 'Tập đoàn']],
    ['viec', ['Hoàn thiện báo cáo', 'Trình ký hồ sơ', 'Phản hồi công văn'], ['']],
    ['giayto', ['Gia hạn giấy phép', 'Hết hạn hợp đồng', 'Hạn nộp hồ sơ'], ['']],
    ['khac', ['Nghỉ phép', 'Trực cơ quan'], ['']]
  ], DONVI = ['CRCK2', 'CRCK2', 'CRCK2', 'BHCK', 'CRCK', 'BHVN', 'Đảng ủy'], NGUOI = ['TGĐ', 'P.TGĐ Hùng', 'P.TGĐ Mai', 'Trưởng phòng TCHC', 'Trưởng phòng KHĐT', 'Chị Lan (Văn thư)', 'Chuyên viên Hà', 'Anh Tuấn (lái xe)', 'Anh Dũng (IT)'];
  var ngayDau = new Date(h.getFullYear(), 0, 1), ngayCuoi = new Date(h.getFullYear(), 11, 31), tongNgay = Math.round((ngayCuoi - ngayDau) / 86400000);
  for (var i = 0; i < 200; i++) {
    var d = cong(ngayDau, ngau(tongNgay)), thu = (d.getDay() + 6) % 7, mau = MAUL[ngau(MAUL.length)];
    if (thu > 4 && ngau(4)) continue;   // cuối tuần thưa hơn
    var ten = mau[1][ngau(mau[1].length)], dd = mau[2][ngau(mau[2].length)], dv = DONVI[ngau(DONVI.length)], tp = NGUOI[ngau(NGUOI.length)] + (ngau(2) ? ', ' + NGUOI[ngau(NGUOI.length)] : '');
    var ngayTu = Math.round((d - h) / 86400000), tt = ['duyet', 'duyet', 'duyet', 'cho', 'tuchoi'][ngau(5)];
    if (mau[0] === 'giayto' || mau[0] === 'viec' || mau[0] === 'khac' || (mau[0] === 'congtac' && ngau(2))) them(mau[0], ten, ngayTu, null, null, { dv: dv, tp: mau[0] === 'viec' ? tp : '', dd: dd, dai: mau[0] === 'congtac' ? ngau(3) : 0 });
    else { var gio = 7 * 60 + ngau(10) * 60 + ngau(2) * 30, dai = 30 + ngau(4) * 30; them(mau[0], ten, ngayTu, dongHo(gio), dongHo(Math.min(gio + dai, 1439)), { dd: dd, tp: tp, dv: dv, tt: tt }); }
  }
  return ds;
}
function demoLay() { if (!S.demoDs) S.demoDs = demoTao(); return S.demoDs.slice(); }
function demoLuu(id, v) {
  if (id) { var x = S.demoDs.filter(function (y) { return y.id === id; })[0]; if (x) Object.assign(x, v); }
  else S.demoDs.push(Object.assign({ id: 'mau' + Date.now() }, v));
}
function veDemo() {
  var b = $('#lcMau'), t = $('#lcDemo');
  if (b) b.setAttribute('aria-pressed', S.demo);
  if (t) t.hidden = !S.demo;
}

/* ---------- dữ liệu ---------- */
function nap() {
  if (S.demo) { S.goc = demoLay().map(function (x) { if (!MAU[x.loai]) x.loai = 'khac'; return x; }); lamMoi(); ve(); return Promise.resolve(); }
  return fetch(API).then(function (r) { return r.json(); }).then(function (j) {
    if (!j.ok) throw new Error(j.loi || 'API lỗi');
    S.goc = j.data.lich.map(function (x) { if (!MAU[x.loai]) x.loai = 'khac'; return x; });
    lamMoi(); ve();
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
function thongBao(t) {
  var e = document.createElement('div'); e.className = 'lc-toast'; e.setAttribute('role', 'status'); e.textContent = t; document.body.appendChild(e);
  setTimeout(function () { e.remove(); }, 5200);
}
function timGoc(id) { return S.goc.filter(function (y) { return y.id === id; })[0]; }
function duLieuGui(x) {
  return { tieuDe: x.tieuDe, loai: x.loai, caNgay: x.caNgay, batDau: x.batDau, ketThuc: x.ketThuc, diaDiem: x.diaDiem, thanhPhan: x.thanhPhan, donVi: x.donVi, ghiChu: x.ghiChu,
    lap: x.lap || '', lapDen: x.lapDen || '', lienKet: x.lienKet || '', trangThai: x.trangThai || '', nhac: x.nhac || '' };
}

/* ---------- hộp thoại ---------- */
var veTruoc = null;
function dongHop() { $('#lcHop').innerHTML = ''; document.body.style.overflow = ''; if (veTruoc && veTruoc.isConnected) veTruoc.focus(); veTruoc = null; }
function moHop(tieuDe, than, chan) {
  if (!$('#lcHop').innerHTML) veTruoc = document.activeElement;
  $('#lcHop').innerHTML = '<div class="lc-nen" data-dong="1"><div class="lc-hop" role="dialog" aria-modal="true" aria-labelledby="hopTen"><div class="lc-hop-dau"><h3 id="hopTen">' + esc(tieuDe) + '</h3><button type="button" class="ck-btn vuong" data-dongnut="1" aria-label="Đóng">×</button></div><div class="lc-hop-than">' + than + '</div><div class="lc-hop-chan">' + chan + '</div></div></div>';
  document.body.style.overflow = 'hidden';
}
var linkAnToan = function (u) { return /^https?:\/\//i.test(u || '') ? u : ''; };
function moChiTiet(id) {
  var x = S.ds.filter(function (y) { return y.id === id; })[0]; if (!x) return;
  var goc = x._goc || x.id, pxe = chiPhongXe(x.loai);
  var tg = x.caNgay ? vnNgay(x.batDau) + (x.ketThuc.slice(0, 10) !== x.batDau.slice(0, 10) ? ' – ' + vnNgay(x.ketThuc) : '') + ', cả ngày'
    : vnNgay(x.batDau) + ' ' + x.batDau.slice(11) + ' – ' + (x.ketThuc.slice(0, 10) !== x.batDau.slice(0, 10) ? vnNgay(x.ketThuc) + ' ' : '') + x.ketThuc.slice(11);
  var lap = x.lap && TEN_LAP[x.lap] ? TEN_LAP[x.lap] + (x.lapDen ? ', đến ' + vnNgay(x.lapDen) : ', không giới hạn') : '';
  var nhac = x.nhac ? (NHAC.filter(function (n) { return n[0] === x.nhac; })[0] || [0, x.nhac + ' phút'])[1] : '';
  var lk = linkAnToan(x.lienKet);
  var hang = [['Loại', TEN_LOAI[x.loai]], pxe && x.trangThai ? ['Trạng thái', TEN_TT[x.trangThai]] : null, ['Thời gian', tg], ['Lặp lại', lap], ['Nhắc', nhac], ['Địa điểm', x.diaDiem], ['Thành phần', x.thanhPhan], ['Đơn vị', x.donVi], ['Ghi chú', x.ghiChu]].filter(function (h) { return h && h[1]; });
  var duyet = pxe && x.trangThai === 'cho' ? '<button type="button" class="ck-btn" data-dt="tuchoi:' + esc(goc) + '">Từ chối</button><button type="button" class="ck-btn chinh" data-dt="duyet:' + esc(goc) + '">Duyệt</button>' : '';
  moHop(x.tieuDe, (x._trung.length ? '<div class="lc-loi">Trùng giờ với: ' + x._trung.map(function (y) { return esc(y.tieuDe); }).join('; ') + '</div>' : '') +
      '<dl class="lc-ct">' + hang.map(function (h) { return '<dt>' + h[0] + '</dt><dd>' + esc(h[1]) + '</dd>'; }).join('') + (lk ? '<dt>Liên kết</dt><dd><a href="' + esc(lk) + '" target="_blank" rel="noopener noreferrer">' + esc(lk) + '</a></dd>' : '') + '</dl><div id="hopLoi" class="lc-loi" style="grid-column:1/-1" hidden></div>',
    '<button type="button" class="ck-btn nguy" data-xoa="' + esc(goc) + '">' + (lap ? 'Xoá cả chuỗi' : 'Xoá') + '</button><span class="cach"></span><button type="button" class="ck-btn" data-dongnut="1">Đóng</button>' + duyet + '<button type="button" class="ck-btn' + (duyet ? '' : ' chinh') + '" data-sua="' + esc(goc) + '">' + (lap ? 'Sửa cả chuỗi' : 'Sửa') + '</button>');
}
function moForm(x, loi) {
  x = x || {};
  var dBat = (x.batDau || ymd(S.moc) + ' 08:00'), dKet = (x.ketThuc || dBat.slice(0, 11) + dongHo(Math.min(phut(dBat) + 60, 1439)));
  var coMa = S.demo || !!maDaLuu(), lap = x.lap && TEN_LAP[x.lap] ? x.lap : '', dv = x.donVi != null ? x.donVi : (S.dv === 'Tất cả' ? '' : S.dv), loai = x.loai || 'congtac', tt = x.trangThai || 'cho';
  var opt = function (ds, cur) { return ds.map(function (l) { return '<option value="' + l[0] + '"' + (cur === l[0] ? ' selected' : '') + '>' + l[1] + '</option>'; }).join(''); };
  moHop(x.id ? 'Sửa lịch' : 'Lập lịch',
    (loi ? '<div class="lc-loi" role="alert">' + esc(loi) + '</div>' : '') +
    (x.id && lap ? '<div class="lc-trung">Lịch này lặp lại: sửa sẽ đổi cả chuỗi.</div>' : '') +
    '<label class="lc-o ca">Tên lịch<input id="fTen" maxlength="200" required value="' + esc(x.tieuDe || '') + '"></label>' +
    '<label class="lc-o">Loại lịch<select id="fLoai">' + LOAI.map(function (l) { return '<option value="' + l[0] + '"' + (loai === l[0] ? ' selected' : '') + '>' + l[1] + '</option>'; }).join('') + '</select></label>' +
    '<label class="lc-o f-tt">Trạng thái<select id="fTrangThai">' + opt(TRANG_THAI, tt) + '</select></label>' +
    '<label class="lc-o lc-chk"><input type="checkbox" id="fCaNgay"' + (x.caNgay ? ' checked' : '') + '>Cả ngày</label>' +
    '<label class="lc-o">Từ ngày<input type="date" id="fNgay1" value="' + dBat.slice(0, 10) + '"></label><label class="lc-o f-gio">Từ giờ<input type="time" id="fGio1" value="' + dBat.slice(11) + '"></label>' +
    '<label class="lc-o">Đến ngày<input type="date" id="fNgay2" value="' + dKet.slice(0, 10) + '"></label><label class="lc-o f-gio">Đến giờ<input type="time" id="fGio2" value="' + dKet.slice(11) + '"></label>' +
    '<label class="lc-o">Lặp lại<select id="fLap">' + opt(LAP, lap) + '</select></label>' +
    '<label class="lc-o f-lap">Lặp đến ngày (bỏ trống: mãi mãi)<input type="date" id="fLapDen" value="' + esc(x.lapDen || '') + '"></label>' +
    '<label class="lc-o f-gio">Nhắc việc<select id="fNhac">' + opt(NHAC, x.nhac || '') + '</select></label>' +
    '<label class="lc-o ca">Địa điểm, phòng họp, xe<input id="fDiaDiem" maxlength="200" list="dsDiaDiem" value="' + esc(x.diaDiem || '') + '"><datalist id="dsDiaDiem">' + TAI_NGUYEN.map(function (t) { return '<option value="' + esc(t) + '">'; }).join('') + '</datalist></label>' +
    '<label class="lc-o ca">Thành phần (cách nhau bằng dấu phẩy)<input id="fThanhPhan" maxlength="500" value="' + esc(x.thanhPhan || '') + '"></label>' +
    '<label class="lc-o">Đơn vị<input id="fDonVi" maxlength="100" list="dsDonVi" value="' + esc(dv) + '"><datalist id="dsDonVi">' + DV.map(function (t) { return '<option value="' + esc(t) + '">'; }).join('') + '</datalist></label>' +
    '<label class="lc-o">Liên kết (phiếu Base, tài liệu)<input id="fLienKet" maxlength="500" type="url" placeholder="https://" value="' + esc(x.lienKet || '') + '"></label>' +
    '<label class="lc-o ca">Ghi chú<textarea id="fGhiChu" rows="3" maxlength="2000">' + esc(x.ghiChu || '') + '</textarea></label>' +
    '<div class="lc-trung" id="fTrung" hidden></div>' +
    (coMa ? '' : '<label class="lc-o ca">Mã lập lịch<input type="password" id="fMa" autocomplete="off"></label>'),
    (coMa && !S.demo ? '<button type="button" class="ck-btn" data-quenma="1">Quên mã</button>' : '') + '<span class="cach"></span><button type="button" class="ck-btn" data-dongnut="1">Huỷ</button><button type="button" class="ck-btn chinh" id="fLuu" data-luu="' + esc(x.id || '') + '">Lưu</button>');
  anGio(); anLap(); anTT(); kiemTrung(x.id);
  var o = $('#fTen'); if (o) o.focus();
}
function anGio() { var ca = $('#fCaNgay').checked; document.querySelectorAll('.f-gio').forEach(function (e) { e.style.display = ca ? 'none' : ''; }); }
function anLap() { var l = $('#fLap').value; document.querySelectorAll('.f-lap').forEach(function (e) { e.style.display = l ? '' : 'none'; }); }
function anTT() { var p = chiPhongXe($('#fLoai').value); document.querySelectorAll('.f-tt').forEach(function (e) { e.style.display = p ? '' : 'none'; }); }
function layForm() {
  var ca = $('#fCaNgay').checked, n1 = $('#fNgay1').value, n2 = $('#fNgay2').value || n1, lap = $('#fLap').value, loai = $('#fLoai').value;
  return { tieuDe: $('#fTen').value.trim(), loai: loai, caNgay: ca, batDau: n1 + ' ' + (ca ? '00:00' : $('#fGio1').value || '00:00'), ketThuc: n2 + ' ' + (ca ? '23:59' : $('#fGio2').value || '00:00'),
    diaDiem: $('#fDiaDiem').value.trim(), thanhPhan: $('#fThanhPhan').value.trim(), donVi: $('#fDonVi').value.trim(), ghiChu: $('#fGhiChu').value.trim(), lap: lap, lapDen: lap ? $('#fLapDen').value : '',
    lienKet: $('#fLienKet').value.trim(), trangThai: chiPhongXe(loai) ? $('#fTrangThai').value : '', nhac: ca ? '' : $('#fNhac').value };
}
function kiemTrung(id) {
  var v = $('#fTrung'); if (!v) return;
  var x = Object.assign(layForm(), { id: id || '_moi' });
  var ds = (x.tieuDe || x.diaDiem || x.thanhPhan) && !x.lap ? S.ds.filter(function (y) { return (y._goc || y.id) !== id && dangTrung(x, y); }) : [];
  v.hidden = !ds.length;
  v.textContent = ds.length ? 'Trùng giờ với: ' + ds.map(function (y) { return y.tieuDe + ' (' + y.batDau.slice(11) + ')'; }).join('; ') + '. Vẫn lưu được.' : '';
}
function luu(id, nut) {
  var v = layForm(), o = $('#fMa'), ma = o ? o.value.trim() : maDaLuu();
  var bao = function (t) { moForm(Object.assign(v, { id: id }), t); if (o && ma) { var m = $('#fMa'); if (m) m.value = ma; } };
  if (!v.tieuDe) return bao('Chưa nhập tên lịch');
  if (!/^\d{4}-\d{2}-\d{2} /.test(v.batDau)) return bao('Chưa chọn ngày');
  if (v.ketThuc < v.batDau) return bao('Thời gian kết thúc phải sau thời gian bắt đầu');
  if (v.lap && v.lapDen && v.lapDen < v.batDau.slice(0, 10)) return bao('Ngày kết thúc lặp phải sau ngày bắt đầu');
  if (v.lienKet && !linkAnToan(v.lienKet)) return bao('Liên kết phải bắt đầu bằng http:// hoặc https://');
  if (!ma && !S.demo) return bao('Chưa nhập mã lập lịch');
  if (S.demo) { demoLuu(id, v); dongHop(); S.moc = phanNgay(v.batDau.slice(0, 10)); nap(); return; }
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
  if (S.demo) {
    if (nut.dataset.dem !== '1') { nut.dataset.dem = '1'; nut.textContent = 'Bấm lần nữa để xoá'; return; }
    S.demoDs = S.demoDs.filter(function (y) { return y.id !== id; }); dongHop(); nap(); return;
  }
  var ma = maDaLuu();
  if (!ma) { moForm(timGoc(id), 'Nhập mã rồi lưu một lần để được xoá lịch.'); return; }
  if (nut.dataset.dem !== '1') { nut.dataset.dem = '1'; nut.textContent = 'Bấm lần nữa để xoá'; return; }
  nut.disabled = true;
  gui({ lenh: 'xoa', id: id }, ma).then(function () { dongHop(); return nap(); }).catch(function (e) {
    if (e.saiMa) { try { localStorage.removeItem('lich_ma'); } catch (z) {} }
    var l = $('#hopLoi'); if (l) { l.hidden = false; l.textContent = e.saiMa ? 'Sai mã. Bấm Sửa để nhập lại mã.' : e.message; }
    nut.disabled = false; delete nut.dataset.dem; nut.textContent = 'Xoá';
  });
}
/** Đổi một vài trường của lịch (kéo thả, duyệt): cập nhật ngay trên màn hình, gửi lên máy chủ sau, lỗi thì nạp lại. */
function luuDoi(x, patch) {
  var v = Object.assign(duLieuGui(x), patch);
  if (S.demo) { demoLuu(x.id, v); nap(); return; }
  var ma = maDaLuu();
  if (!ma) { moForm(Object.assign(v, { id: x.id }), 'Nhập mã để lưu thay đổi.'); return; }
  Object.assign(x, patch); lamMoi(); ve();
  gui({ lenh: 'sua', id: x.id, lich: v }, ma).then(function () { thongBao('Đã lưu thay đổi'); nap(); }).catch(function (e) {
    if (e.saiMa) { try { localStorage.removeItem('lich_ma'); } catch (z) {} moForm(Object.assign(v, { id: x.id }), 'Sai mã lập lịch'); return; }
    thongBao('Không lưu được: ' + e.message); nap();
  });
}

/* ---------- xuất .ics (Google Lịch, Outlook, điện thoại) ---------- */
function icsChu(s) { return String(s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n'); }
function icsGap(d) { var ra = []; while (d.length > 72) { ra.push(d.slice(0, 72)); d = ' ' + d.slice(72); } ra.push(d); return ra.join('\r\n'); }
var icsGio = function (s) { return s.slice(0, 4) + s.slice(5, 7) + s.slice(8, 10) + 'T' + s.slice(11, 13) + s.slice(14, 16) + '00'; };
var icsNgay = function (s) { return s.slice(0, 4) + s.slice(5, 7) + s.slice(8, 10); };
function taoIcs(ds, ten) {
  var L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//CRCK//Lich lam viec//VI', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:' + icsChu(ten), 'X-WR-TIMEZONE:Asia/Ho_Chi_Minh',
    'BEGIN:VTIMEZONE', 'TZID:Asia/Ho_Chi_Minh', 'BEGIN:STANDARD', 'DTSTART:19700101T000000', 'TZOFFSETFROM:+0700', 'TZOFFSETTO:+0700', 'TZNAME:ICT', 'END:STANDARD', 'END:VTIMEZONE'];
  var bay = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z', RR = { ngay: 'DAILY', tuan: 'WEEKLY', '2tuan': 'WEEKLY;INTERVAL=2', thang: 'MONTHLY', nam: 'YEARLY' };
  ds.forEach(function (x) {
    L.push('BEGIN:VEVENT', 'UID:' + x.id + '@lich.crck', 'DTSTAMP:' + bay, 'SUMMARY:' + icsChu(x.tieuDe));
    if (x.caNgay) L.push('DTSTART;VALUE=DATE:' + icsNgay(x.batDau), 'DTEND;VALUE=DATE:' + icsNgay(ymd(cong(phanNgay(x.ketThuc.slice(0, 10)), 1))));
    else L.push('DTSTART;TZID=Asia/Ho_Chi_Minh:' + icsGio(x.batDau), 'DTEND;TZID=Asia/Ho_Chi_Minh:' + icsGio(x.ketThuc));
    if (RR[x.lap]) L.push('RRULE:FREQ=' + RR[x.lap] + (x.lapDen ? ';UNTIL=' + (x.caNgay ? icsNgay(x.lapDen) : icsNgay(x.lapDen) + 'T235959') : ''));
    if (x.diaDiem) L.push('LOCATION:' + icsChu(x.diaDiem));
    var mt = [x.thanhPhan ? 'Thành phần: ' + x.thanhPhan : '', x.donVi ? 'Đơn vị: ' + x.donVi : '', x.lienKet || '', x.ghiChu || ''].filter(Boolean).join('\n');
    if (mt) L.push('DESCRIPTION:' + icsChu(mt));
    L.push('CATEGORIES:' + icsChu(TEN_LOAI[x.loai] || ''), 'STATUS:' + (x.trangThai === 'cho' ? 'TENTATIVE' : x.trangThai === 'tuchoi' ? 'CANCELLED' : 'CONFIRMED'));
    if (x.nhac && !x.caNgay) L.push('BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + icsChu(x.tieuDe), 'TRIGGER:-PT' + Number(x.nhac) + 'M', 'END:VALARM');
    L.push('END:VEVENT');
  });
  L.push('END:VCALENDAR');
  return L.map(icsGap).join('\r\n') + '\r\n';
}
function moIcs() {
  var ds = S.goc.filter(function (x) { return khopDv(x) && khopToi(x); }), nv = S.dv === 'Tất cả' ? '' : S.dv, lk = API + '.ics' + (nv ? '?dv=' + encodeURIComponent(nv) : '');
  moHop('Xuất lịch (.ics)',
    '<p class="lc-ca">Đưa lịch sang <b>Google Lịch, Outlook, Apple Lịch</b> hoặc điện thoại. Lịch lặp, địa điểm, nhắc việc và trạng thái duyệt đều được mang theo.</p>' +
    '<div class="lc-ca"><b>Tải file</b> (' + ds.length + ' lịch' + (nv ? ' của ' + esc(nv) + ' và lịch không ghi đơn vị' : ', mọi đơn vị') + '). Nhập một lần, không tự cập nhật.</div>' +
    '<div class="lc-ca"><b>Thuê bao tự cập nhật</b>: dán link này vào mục “Thêm lịch từ URL” của Google Lịch hoặc Outlook.' +
    (S.demo ? ' <i>Dữ liệu mẫu không có trên máy chủ nên link này là lịch thật.</i>' : '') + '<input class="lc-link" readonly value="' + esc(lk) + '" onclick="this.select()"></div>',
    '<span class="cach"></span><button type="button" class="ck-btn" data-dongnut="1">Đóng</button><button type="button" class="ck-btn chinh" id="icsTai">Tải file .ics</button>');
}
function taiIcs() {
  var ds = S.goc.filter(function (x) { return khopDv(x) && khopToi(x); }), nv = S.dv === 'Tất cả' ? 'tat-ca' : S.dv;
  var blob = new Blob([taoIcs(ds, 'Lịch làm việc' + (S.dv === 'Tất cả' ? '' : ' ' + S.dv))], { type: 'text/calendar;charset=utf-8' }), a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'lich-' + nv + '-' + ymd(homNay()) + '.ics'; document.body.appendChild(a); a.click();
  setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}

/* ---------- tìm giờ trống chung ---------- */
function tinhTrong(ten, dai, tu, den) {
  var ds = tachTen(ten), ra = [], bay = new Date(), mBay = bay.getHours() * 60 + bay.getMinutes(), nay = ymd(homNay());
  var m = theoNgay(S.ds.filter(function (x) { return !x.caNgay && x.trangThai !== 'tuchoi'; }), tu, den);
  for (var d = tu; ymd(d) <= ymd(den); d = cong(d, 1)) {
    var k = ymd(d), thu = (d.getDay() + 6) % 7; if (thu > 4) continue;
    var bs = (m[k] || []).filter(function (e) {
      var tenSk = tachTen(e.x.thanhPhan).concat((e.x.diaDiem || '').trim() ? [(e.x.diaDiem || '').trim().toLowerCase()] : []);
      return ds.some(function (t) { return tenSk.indexOf(t) >= 0; });
    });
    var dem = 0;
    [[8 * 60, 11 * 60 + 30], [13 * 60 + 30, 17 * 60]].forEach(function (w) {
      for (var t = w[0]; t + dai <= w[1] && dem < 3; t += 30) {
        if (k === nay && t < mBay) continue;
        if (bs.some(function (e) { return e.a < t + dai && t < e.b; })) continue;
        ra.push({ k: k, a: t, b: t + dai }); dem++;
        t += Math.max(0, dai - 30);   // các gợi ý trong cùng ngày không chồng nhau
      }
    });
  }
  return ra;
}
function moTimGio() {
  var tu = homNay(), den = cong(tu, 6), dai = [30, 60, 90, 120, 180];
  moHop('Tìm giờ trống chung',
    '<label class="lc-o ca">Người, phòng, xe cần cùng rảnh (cách nhau bằng dấu phẩy)<input id="tgTen" placeholder="VD: P.TGĐ Hùng, Trưởng phòng KHĐT, Phòng họp 1" value="' + esc(S.tgTen || S.ten) + '"></label>' +
    '<label class="lc-o">Thời lượng<select id="tgDai">' + dai.map(function (n) { return '<option value="' + n + '"' + (n === 60 ? ' selected' : '') + '>' + (n >= 60 ? n / 60 + ' giờ' : n + ' phút') + '</option>'; }).join('') + '</select></label>' +
    '<span></span><label class="lc-o">Từ ngày<input type="date" id="tgTu" value="' + ymd(tu) + '"></label><label class="lc-o">Đến ngày<input type="date" id="tgDen" value="' + ymd(den) + '"></label>' +
    '<div class="lc-ca" id="tgKq"><p class="lc-phu">Giờ làm việc 08:00–11:30 và 13:30–17:00, thứ Hai đến thứ Sáu. Tên phải khớp đúng cách ghi trong thành phần của lịch.</p></div>',
    '<span class="cach"></span><button type="button" class="ck-btn" data-dongnut="1">Đóng</button><button type="button" class="ck-btn chinh" id="tgTim">Tìm giờ trống</button>');
  $('#tgTen').focus();
}
function chayTimGio() {
  var ten = $('#tgTen').value.trim(), kq = $('#tgKq'); S.tgTen = ten;
  if (!tachTen(ten).length) { kq.innerHTML = '<div class="lc-loi">Nhập ít nhất một tên người, phòng hoặc xe.</div>'; return; }
  var tu = $('#tgTu').value, den = $('#tgDen').value || tu;
  if (!tu || den < tu) { kq.innerHTML = '<div class="lc-loi">Khoảng ngày chưa đúng.</div>'; return; }
  if (Math.round((phanNgay(den) - phanNgay(tu)) / 86400000) > 60) { kq.innerHTML = '<div class="lc-loi">Chỉ tìm tối đa 60 ngày.</div>'; return; }
  var dai = Number($('#tgDai').value), ra = tinhTrong(ten, dai, phanNgay(tu), phanNgay(den)).slice(0, 18);
  kq.innerHTML = ra.length ? '<p class="lc-phu">' + ra.length + ' khung giờ cùng rảnh, bấm để lập lịch:</p><div class="lc-trong">' + ra.map(function (r) {
    return '<button type="button" class="ck-btn" data-trong="' + r.k + '|' + r.a + '|' + r.b + '">' + nhanNgay(phanNgay(r.k)) + ' · ' + dongHo(r.a) + '–' + dongHo(r.b) + '</button>'; }).join('') + '</div>' : '<div class="lc-loi">Không có khung giờ nào cùng rảnh trong khoảng này.</div>';
}

/* ---------- nhắc việc: toast trong trang, kèm thông báo của trình duyệt nếu đã cho phép ---------- */
function kiemNhac() {
  if (!$('#lcGoc')) return;
  var bay = Date.now();
  S.ds.forEach(function (x) {
    if (!x.nhac || x.caNgay || x.trangThai === 'tuchoi' || S.daNhac[x.id]) return;
    var bd = new Date(x.batDau.replace(' ', 'T')).getTime(), t = bd - Number(x.nhac) * 60000;
    if (bay < t || bay >= bd) return;
    S.daNhac[x.id] = 1;
    var tb = x.tieuDe + ' lúc ' + x.batDau.slice(11) + (x.diaDiem ? ' tại ' + x.diaDiem : '');
    thongBao('Sắp tới: ' + tb);
    try { if ('Notification' in window && Notification.permission === 'granted') new Notification('Lịch sắp tới', { body: tb }); } catch (e) {}
  });
}

/* ---------- kéo thả: dời lịch, kéo mép dưới để đổi độ dài ---------- */
var keo = null;
document.addEventListener('pointerdown', function (e) {
  if (e.button !== 0 || e.pointerType === 'touch') return;
  var b = e.target.closest('.lc-su.keo'); if (!b || !b.closest('#lcGoc')) return;
  var x = S.ds.filter(function (y) { return y.id === b.dataset.id; })[0]; if (!x) return;
  keo = { b: b, x: x, che: e.target.closest('.lc-gt') ? 'gt' : 'di', x0: e.clientX, y0: e.clientY, h0: b.offsetHeight, dich: false };
});
document.addEventListener('pointermove', function (e) {
  if (!keo) return;
  var dx = e.clientX - keo.x0, dy = e.clientY - keo.y0;
  if (!keo.dich && Math.abs(dx) + Math.abs(dy) < 5) return;
  keo.dich = true; keo.b.classList.add('dang-keo'); e.preventDefault();
  if (keo.che === 'gt') keo.b.style.height = Math.max(14, keo.h0 + dy) + 'px';
  else keo.b.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
});
function ketThucKeo(e, huy) {
  var k = keo; keo = null; if (!k) return;
  k.b.classList.remove('dang-keo'); k.b.style.transform = ''; if (k.che === 'gt') k.b.style.height = k.h0 + 'px';
  if (!k.dich) return;
  S.vuaKeo = true; setTimeout(function () { S.vuaKeo = false; }, 80);
  if (huy) return;
  var x = k.x, dm = Math.round((e.clientY - k.y0) / PX * 60 / 15) * 15, bd = phut(x.batDau), dai = phut(x.ketThuc) - bd, ngay = x.batDau.slice(0, 10), patch;
  if (k.che === 'gt') {
    var kt = Math.min(1439, Math.max(bd + 15, bd + dai + dm));
    if (kt === bd + dai) return;
    patch = { ketThuc: ngay + ' ' + dongHo(kt) };
  } else {
    var cot = document.elementsFromPoint(e.clientX, e.clientY).filter(function (el) { return el.classList && el.classList.contains('lc-cot'); })[0];
    var d2 = cot ? cot.dataset.tao : ngay, dd = cot && cot.dataset.dd ? cot.dataset.dd : null, bd2 = Math.max(0, Math.min(1439 - dai, bd + dm));
    if (d2 === ngay && bd2 === bd && (dd == null || dd === x.diaDiem)) return;
    patch = { batDau: d2 + ' ' + dongHo(bd2), ketThuc: d2 + ' ' + dongHo(bd2 + dai) };
    if (dd != null) patch.diaDiem = dd;
  }
  luuDoi(x, patch);
}
document.addEventListener('pointerup', function (e) { ketThucKeo(e, false); });
document.addEventListener('pointercancel', function (e) { ketThucKeo(e, true); });

/* ---------- sự kiện ---------- */
function xoaTim() { S.q = ''; var o = $('#lcTim'); if (o) o.value = ''; }
document.addEventListener('click', function (e) {
  var t = e.target, g;
  if (!t.closest('#lcGoc,#lcHop')) return;
  if (S.vuaKeo) return;
  if (t.id === 'lcThuLai') { nap(); return; }
  if (t.id === 'lcXoaTim') { xoaTim(); ve(); return; }
  if (t.id === 'icsTai') { taiIcs(); return; }
  if (t.id === 'tgTim') { chayTimGio(); return; }
  if (t.closest('#lcIcs')) { moIcs(); return; }
  if (t.closest('#lcTrong')) { moTimGio(); return; }
  if (t.dataset && t.dataset.dong && t === e.currentTarget.querySelector('.lc-nen')) { dongHop(); return; }
  if ((g = t.closest('[data-dongnut]'))) { dongHop(); return; }
  if ((g = t.closest('[data-trong]'))) {
    var p = g.dataset.trong.split('|'); dongHop();
    moForm({ batDau: p[0] + ' ' + dongHo(Number(p[1])), ketThuc: p[0] + ' ' + dongHo(Number(p[2])), thanhPhan: S.tgTen });
    return;
  }
  if ((g = t.closest('[data-dt]'))) {
    var q = g.dataset.dt.split(':'), x = timGoc(q.slice(1).join(':'));
    if (x) { dongHop(); luuDoi(x, { trangThai: q[0] }); }
    return;
  }
  if ((g = t.closest('[data-xem]'))) { S.xem = g.dataset.xem; xoaTim(); ghi('lich_xem', S.xem); ve(); return; }
  if ((g = t.closest('[data-dv]'))) { S.dv = g.dataset.dv; ghi('lich_dv', S.dv); ve(); return; }
  if (t.closest('#lcAm')) { S.am = !S.am; ghi('lich_am', S.am ? '1' : '0'); ve(); return; }
  if (t.closest('#lcToi2')) {
    if (S.cuaToi) { S.cuaToi = false; ghi('lich_cuatoi', ''); ve(); return; }
    moHop('Lịch của tôi',
      '<label class="lc-o ca">Tên của bạn, đúng như ghi trong thành phần của lịch<input id="tenToi" maxlength="100" placeholder="VD: Trưởng phòng TCHC" value="' + esc(S.ten) + '"></label><p class="lc-ca lc-phu">Chỉ lưu trên trình duyệt này, không đăng nhập. Lịch nào có tên này trong thành phần sẽ hiện.</p>',
      '<span class="cach"></span><button type="button" class="ck-btn" data-dongnut="1">Huỷ</button><button type="button" class="ck-btn chinh" id="luuTen">Xem lịch của tôi</button>');
    $('#tenToi').focus(); return;
  }
  if (t.id === 'luuTen') { var n = $('#tenToi').value.trim(); if (!n) return; S.ten = n; S.cuaToi = true; ghi('lich_ten', n); ghi('lich_cuatoi', '1'); dongHop(); ve(); return; }
  if (t.closest('#lcNhac')) {
    if (!('Notification' in window)) { thongBao('Trình duyệt này không hỗ trợ thông báo. Nhắc việc vẫn hiện trong trang khi đang mở.'); return; }
    if (Notification.permission === 'granted') { thongBao('Nhắc việc đã bật. Chỉ nhắc khi trang Lịch đang mở.'); return; }
    Notification.requestPermission().then(function () { ve(); thongBao(Notification.permission === 'granted' ? 'Đã bật nhắc việc. Chỉ nhắc khi trang Lịch đang mở.' : 'Chưa được cho phép thông báo trên trình duyệt.'); });
    return;
  }
  if ((g = t.closest('[data-loai]'))) { var l = g.dataset.loai; if (S.an[l]) delete S.an[l]; else S.an[l] = 1; ghi('lich_an', JSON.stringify(S.an)); ve(); return; }
  if ((g = t.closest('[data-minit]'))) { doiThang(Number(g.dataset.minit)); ve(); return; }
  if ((g = t.closest('[data-mini]'))) { S.moc = phanNgay(g.dataset.mini); xoaTim(); ve(); return; }
  if ((g = t.closest('[data-id]'))) { moChiTiet(g.dataset.id); return; }
  if ((g = t.closest('[data-sua]'))) { moForm(timGoc(g.dataset.sua)); return; }
  if ((g = t.closest('[data-xoa]'))) { xoa(g.dataset.xoa, g); return; }
  if ((g = t.closest('[data-luu]'))) { luu(g.dataset.luu, g); return; }
  if ((g = t.closest('[data-quenma]'))) { try { localStorage.removeItem('lich_ma'); } catch (x2) {} moForm(layFormGiu()); return; }
  if ((g = t.closest('[data-ngay]'))) { S.moc = phanNgay(g.dataset.ngay); S.xem = 'ngay'; xoaTim(); ghi('lich_xem', S.xem); ve(); return; }
  if ((g = t.closest('[data-tao]'))) {
    var gio = 8 * 60;
    if (g.classList.contains('lc-cot')) gio = Math.min(1380, Number(g.dataset.lo) + Math.floor((e.clientY - g.getBoundingClientRect().top) / PX * 2) * 30);
    moForm({ batDau: g.dataset.tao + ' ' + dongHo(gio), diaDiem: g.dataset.dd || '' });
  }
});
function layFormGiu() { var v = layForm(); v.id = $('#fLuu').dataset.luu; return v; }
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape' && $('#lcHop') && $('#lcHop').innerHTML) { dongHop(); return; }
  if (!$('#lcGoc') || $('#lcHop').innerHTML || e.ctrlKey || e.metaKey || e.altKey) return;
  var ten = e.target.tagName; if (/^(INPUT|TEXTAREA|SELECT)$/.test(ten) || e.target.isContentEditable) return;
  var k = e.key.toLowerCase(), so = Number(k);
  if (k === 't') { S.moc = homNay(); ve(); }
  else if (k === 'arrowleft' || k === 'j') buoc(-1);
  else if (k === 'arrowright' || k === 'k') buoc(1);
  else if (k === 'n') moForm();
  else if (k === '/') { e.preventDefault(); $('#lcTim').focus(); }
  else if (so >= 1 && so <= XEM.length) { S.xem = XEM[so - 1][0]; xoaTim(); ghi('lich_xem', S.xem); ve(); }
});
document.addEventListener('change', function (e) {
  if (!$('#fLuu')) return;
  if (e.target.id === 'fCaNgay') anGio();
  if (e.target.id === 'fLap') anLap();
  if (e.target.id === 'fLoai') anTT();
  if (e.target.id === 'fNgay1') { var n2 = $('#fNgay2'); if (n2.value < e.target.value) n2.value = e.target.value; }
  kiemTrung($('#fLuu').dataset.luu);
});
document.addEventListener('input', function (e) {
  if (e.target.id === 'lcTim') { S.q = e.target.value.trim(); ve(); return; }
  if ($('#fLuu') && /^(fDiaDiem|fThanhPhan)$/.test(e.target.id)) kiemTrung($('#fLuu').dataset.luu);
});

var hopGoc = document.createElement('div'); hopGoc.id = 'lcHop'; document.body.appendChild(hopGoc);

/* Vẽ lịch vào phần tử el */
function gan(el) {
  el.innerHTML = '<div id="lcGoc"><div class="lc-thanh"><div class="lc-chuyen">' +
      '<button type="button" class="ck-btn" id="lcHomNay">Hôm nay</button>' +
      '<button type="button" class="ck-btn vuong" id="lcLui" aria-label="Trước">‹</button>' +
      '<button type="button" class="ck-btn vuong" id="lcToi" aria-label="Sau">›</button>' +
      '<h2 id="lcTenKhoang" aria-live="polite"></h2></div>' +
      '<input class="lc-tim" id="lcTim" type="search" placeholder="Tìm lịch (phím /)" aria-label="Tìm lịch" autocomplete="off">' +
      '<div class="lc-xem" id="lcXem" role="group" aria-label="Cách xem"></div></div>' +
    '<div class="lc-demo" id="lcDemo" hidden>Đang xem <b>dữ liệu mẫu</b>: lịch giả để xem thử. Lập, sửa, xoá, kéo thả, duyệt chỉ có tác dụng trên trình duyệt này, không ghi vào lịch thật. Bấm <b>Dữ liệu mẫu</b> lần nữa để về lịch thật.</div>' +
    '<div class="lc-hang2"><div class="lc-seg" id="lcDv" role="group" aria-label="Đơn vị"></div><div class="lc-loai" id="lcLoai" role="group" aria-label="Loại lịch"></div>' +
      '<div class="lc-cu"><button type="button" class="ck-btn" id="lcTrong" title="Tìm khung giờ nhiều người cùng rảnh">Tìm giờ trống</button><button type="button" class="ck-btn" id="lcIcs" title="Xuất lịch sang Google, Outlook">Xuất .ics</button><button type="button" class="ck-btn" id="lcIn" title="In lịch đang xem">In</button>' +
      '<button type="button" class="ck-btn lc-mau" id="lcMau" aria-pressed="false" title="Xem thử bằng lịch giả, không ghi vào lịch thật">Dữ liệu mẫu</button></div></div>' +
    '<div class="lc-bo"><aside class="lc-ben"><div class="lc-mini" id="lcMini"></div><div class="lc-sap" id="lcSapToi"></div>' +
      '<p class="lc-phim">Phím tắt: T hôm nay · ← → chuyển · N lập mới · / tìm · 1–8 kiểu xem. Kéo lịch để dời, kéo mép dưới để đổi độ dài.</p></aside>' +
    '<main class="lc-the" id="lcNoi"></main></div></div>';
  var nl = $('#nutLap'); if (nl) nl.onclick = function () { moForm(); };
  $('#lcHomNay').onclick = function () { S.moc = homNay(); ve(); };
  $('#lcLui').onclick = function () { buoc(-1); };
  $('#lcToi').onclick = function () { buoc(1); };
  $('#lcIn').onclick = function () { window.print(); };
  $('#lcMau').onclick = function () {
    S.demo = !S.demo; S.demoDs = null; S.daNhac = {}; ghi('lich_demo', S.demo ? '1' : '0'); veDemo(); S.goc = []; S.ds = [];
    $('#lcNoi').innerHTML = '<div class="lc-baoloi">Đang đọc lịch…</div>'; nap();
  };
  veDemo(); ve();
  $('#lcNoi').innerHTML = '<div class="lc-baoloi">Đang đọc lịch…</div>';
  nap();
  if (!S.hen) S.hen = setInterval(kiemNhac, 30000);
}
window.LICH = { gan: gan, am: doiAm, le: leNgay, ics: taoIcs, trong: function (ten, dai, tu, den) { return tinhTrong(ten, dai, phanNgay(tu), phanNgay(den)); }, _S: S };
})();
