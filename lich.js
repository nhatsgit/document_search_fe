/* Lịch làm việc (trang lich.html). Gọi LICH.gan(phần tử). */
(function () {
'use strict';
var API = 'https://document-search-api-319700450833.us-central1.run.app/api/lich';
var LOAI = [['congtac', 'Lịch công tác', '#10b981'], ['hop', 'Cuộc họp', '#0ea5e9'], ['phong', 'Đặt phòng họp', '#8b5cf6'], ['xe', 'Đặt xe', '#f59e0b'], ['viec', 'Việc đến hạn', '#ec4899'], ['giayto', 'Hạn giấy tờ', '#ef4444'], ['khac', 'Công tác, nghỉ phép, việc giao', '#64748b']];
var MAU = {}, TEN_LOAI = {}; LOAI.forEach(function (l) { TEN_LOAI[l[0]] = l[1]; MAU[l[0]] = l[2]; });
var XEM = [['ngay', 'Ngày'], ['3ngay', '3 ngày'], ['tuan', 'Tuần'], ['t26', 'T2–T6'], ['thang', 'Tháng'], ['nam', 'Năm'], ['trinh', 'Lịch trình'], ['tai', 'Phòng, xe'], ['vt', 'Vai trò'], ['bang', 'Bảng tuần']];
var DV = ['CRCK2', 'BHCK', 'CRCK', 'BHVN', 'Đảng ủy'];
var TAI_NGUYEN = ['Phòng họp lớn', 'Phòng họp 1', 'Phòng họp 2', 'Xe 51A-123.45', 'Xe 51B-678.90'];
var LAP = [['', 'Không lặp'], ['ngay', 'Hằng ngày'], ['tuan', 'Hằng tuần'], ['2tuan', 'Hai tuần một lần'], ['thang', 'Hằng tháng'], ['nam', 'Hằng năm']];
var TEN_LAP = {}; LAP.forEach(function (l) { if (l[0]) TEN_LAP[l[0]] = l[1]; });
var TRANG_THAI = [['cho', 'Chờ duyệt'], ['duyet', 'Đã duyệt'], ['tuchoi', 'Từ chối']];
var TEN_TT = {}; TRANG_THAI.forEach(function (l) { TEN_TT[l[0]] = l[1]; });
var NHAC = [['', 'Không nhắc'], ['10', 'Trước 10 phút'], ['30', 'Trước 30 phút'], ['60', 'Trước 1 giờ'], ['1440', 'Trước 1 ngày']];
var THU = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
var ZOOM = [36, 52, 72, 96], PX = ZOOM.indexOf(Number(doc('lich_px', '52'))) >= 0 ? Number(doc('lich_px', '52')) : 52, MAC_LO = 7 * 60, MAC_HI = 18 * 60, GIO_LAM = [7 * 60 + 30, 17 * 60];

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
  dv: 'Tất cả', vaiTro: [], demoVt: null, tgVt: [], vtAn: {}, toi: false, toiVt: [], vtMo: true, q: '', am: doc('lich_am', '1') !== '0', namMo: 0, vuaKeo: false,
  daNhac: {}, tgTen: '' };
try { S.an = JSON.parse(doc('lich_an', '{}')) || {}; } catch (e) {}
try { S.vtAn = JSON.parse(doc('lich_vt_an', '{}')) || {}; } catch (e) {}
try { S.toiVt = JSON.parse(doc('lich_vt_toi_ds', '[]')) || []; } catch (e) {}
S.toi = doc('lich_vt_toi', '') === '1'; S.vtMo = doc('lich_vt_mo', '1') !== '0';
if (!XEM.some(function (x) { return x[0] === S.xem; })) S.xem = 'tuan';

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
  if (S.xem === 'ngay' || S.xem === 'tai' || S.xem === 'vt') return [a, a];
  if (S.xem === '3ngay') return [a, cong(a, 2)];
  if (S.xem === 'tuan' || S.xem === 'bang') return [thuHai(a), cong(thuHai(a), 6)];
  if (S.xem === 't26') return [thuHai(a), cong(thuHai(a), 4)];
  if (S.xem === 'trinh') return [a, cong(a, 29)];
  if (S.xem === 'nam') return [new Date(a.getFullYear(), 0, 1), new Date(a.getFullYear(), 11, 31)];
  var dau = new Date(a.getFullYear(), a.getMonth(), 1), cuoi = new Date(a.getFullYear(), a.getMonth() + 1, 0);
  return [thuHai(dau), cong(thuHai(cuoi), 6)];
}
function tenKhoang() {
  var k = khoang(), a = k[0], b = k[1];
  if (S.xem === 'ngay' || S.xem === 'tai' || S.xem === 'vt') return nhanNgay(a) + '/' + a.getFullYear();
  if (S.xem === 'nam') return 'Năm ' + a.getFullYear();
  if (S.xem === 'thang') return 'Tháng ' + (S.moc.getMonth() + 1) + '/' + S.moc.getFullYear();
  return a.getDate() + '/' + (a.getMonth() + 1) + ' – ' + b.getDate() + '/' + (b.getMonth() + 1) + '/' + b.getFullYear() + (S.xem === 'tuan' || S.xem === 't26' || S.xem === 'bang' ? ' · Tuần ' + isoTuan(a) : '');
}
function doiThang(t) {
  var x = S.moc, c = new Date(x.getFullYear(), x.getMonth() + t + 1, 0);
  S.moc = new Date(c.getFullYear(), c.getMonth(), Math.min(x.getDate(), c.getDate()));   // ngày 31 sang tháng ngắn thì lấy ngày cuối tháng
}
function doiZoom(n) {
  var i = Math.max(0, Math.min(ZOOM.length - 1, (ZOOM.indexOf(PX) < 0 ? 1 : ZOOM.indexOf(PX)) + n));
  PX = ZOOM[i]; ghi('lich_px', PX); ve();
}
function buoc(n) {
  var m = { ngay: 1, tai: 1, vt: 1, '3ngay': 3, tuan: 7, bang: 7, t26: 7, trinh: 30 }[S.xem];
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
/* Vai trò: mỗi vai trò là một "lịch" riêng có màu; lịch không gắn vai trò nào là Lịch chung toàn công ty */
var MAU_CHUNG = '#2f7a3d', MAU_VT = ['#8fa9e0', '#e3a98f', '#c39bd3', '#e38b86', '#7fc4bd', '#d4b96a', '#9aa3ad', '#8fbf9f'];
function vtTheoId(id) { return S.vaiTro.filter(function (l) { return l.id === id; })[0]; }
function vtCua(x) { return String(x.vaiTro || '').split(',').map(function (t) { return t.trim(); }).filter(function (id) { return id && vtTheoId(id); }); }
function vtTen(x) { return vtCua(x).map(function (id) { return vtTheoId(id).ten; }).join(', '); }
var TEN_CAP = { 1: 'Lãnh đạo', 2: 'Nhân viên' };
function capVt(v) { return Number(v.cap) === 1 ? 1 : 2; }
function dsVt() { return S.vaiTro.slice().sort(function (a, b) { return capVt(a) - capVt(b) || (Number(a.thuTu) || 99) - (Number(b.thuTu) || 99) || String(a.ten).localeCompare(String(b.ten)); }); }
function mauVt(v) {
  if (v.mau && /^#[0-9a-fA-F]{6}$/.test(v.mau)) return v.mau;
  var n = 0; String(v.id).split('').forEach(function (c) { n += c.charCodeAt(0); });
  return MAU_VT[n % MAU_VT.length];
}
var vtHien = function (v) { return !S.vtAn[v.id] || (S.toi && S.toiVt.indexOf(v.id) >= 0); };
/** Màu của lịch: màu của vai trò đầu tiên đang xem; không có vai trò là màu Lịch chung. */
function mauSk(x) { var ids = vtCua(x); if (!ids.length) return MAU_CHUNG; return mauVt(vtTheoId(ids.filter(function (id) { return vtHien(vtTheoId(id)); })[0] || ids[0])); }
/** Lịch hiện khi một trong các lịch (vai trò) của nó đang được tick; "Lịch của tôi" thêm các vai trò của mình. */
function khopVt(x) {
  var ids = vtCua(x);
  if (!ids.length) return !S.vtAn.chung;
  return ids.some(function (id) { return vtHien(vtTheoId(id)); });
}
function luuVtTt() { ghi('lich_vt_an', JSON.stringify(S.vtAn)); ghi('lich_vt_toi', S.toi ? '1' : ''); ghi('lich_vt_toi_ds', JSON.stringify(S.toiVt)); }
function khopTim(x) {
  if (!S.q) return true;
  var t = boDau([x.tieuDe, x.diaDiem, x.thanhPhan, x.ghiChu, x.donVi, TEN_LOAI[x.loai]].join(' '));
  return boDau(S.q).split(/\s+/).filter(Boolean).every(function (w) { return t.indexOf(w) >= 0; });
}
function dsLoc() { return S.ds.filter(function (x) { return khopDv(x) && khopVt(x) && khopTim(x); }); }
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
  return '<button type="button" class="lc-su ' + cls + (keo ? ' keo' : '') + (x._trung.length ? ' trung' : '') + (tt ? ' tt-' + tt : '') + '" data-id="' + esc(x.id) + '" style="--c:' + mauSk(x) + ';' + (style || '') + '" title="' + esc(x.tieuDe + (vtTen(x) ? ' · ' + vtTen(x) : '')) + '"><b>' + (DAU_TT[tt] || '') + esc(x.tieuDe) + (x._goc ? ' ↻' : '') + '</b>' +
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
/** Mỗi vai trò một cột trong cùng một ngày (chỉ những vai trò có lịch); Lịch chung ở cột cuối. */
function cotVt(d) {
  var k = ymd(d), tat = theoNgay(dsHien(), d, d)[k] || [], nay = k === ymd(homNay()), ra = [];
  var them = function (id, ten, mau, ds) {
    if (!ds.length) return;
    ra.push({ k: k, dd: '', vt: id, nay: nay, cuoiTuan: false, dau: '<h4><i class="lc-o-vuong nho" style="--c:' + mau + '"></i>' + esc(ten) + '</h4>',
      caNgay: ds.filter(function (e) { return e.x.caNgay; }), co: ds.filter(function (e) { return !e.x.caNgay; }) });
  };
  dsVt().filter(vtHien).forEach(function (v) { them(v.id, v.ten, mauVt(v), tat.filter(function (e) { return vtCua(e.x).indexOf(v.id) >= 0; })); });
  them('', 'Lịch chung toàn công ty', MAU_CHUNG, tat.filter(function (e) { return !vtCua(e.x).length; }));
  return ra;
}
var TEN_THU = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ nhật'];
/** Bảng lịch công tác tuần: mỗi ngày hai dòng Sáng, Chiều; mỗi vai trò có lịch một cột. */
function veBang(tu, den) {
  var m = theoNgay(dsHien(), tu, den), nay = ymd(homNay()), cell = {}, coCot = {};
  Object.keys(m).forEach(function (k) {
    m[k].forEach(function (e) {
      var buoi = !e.x.caNgay && e.a >= 720 ? 'c' : 's', ids = vtCua(e.x).filter(function (id) { return vtHien(vtTheoId(id)); });
      if (!vtCua(e.x).length) ids = [''];   // lịch chung
      ids.forEach(function (id) { coCot[id] = 1; var key = k + '|' + buoi + '|' + id; (cell[key] = cell[key] || []).push(e); });
    });
  });
  var cols = dsVt().filter(function (v) { return coCot[v.id]; }).map(function (v) { return { id: v.id, ten: v.ten, mau: mauVt(v) }; });
  if (coCot['']) cols.push({ id: '', ten: 'Lịch chung toàn công ty', mau: MAU_CHUNG });
  if (!cols.length) { $('#lcNoi').innerHTML = '<div class="lc-rong">Tuần này không có lịch nào.</div>'; return; }
  var tr = '';
  for (var d = tu; ymd(d) <= ymd(den); d = cong(d, 1)) {
    var k = ymd(d), thu = (d.getDay() + 6) % 7, co = Object.keys(cell).some(function (key) { return key.indexOf(k + '|') === 0; });
    if (thu >= 5 && !co) continue;   // thứ Bảy, Chủ nhật không có lịch thì không hiện
    [['s', 'Sáng'], ['c', 'Chiều']].forEach(function (b, i) {
      tr += '<tr class="' + (k === nay ? 'nay ' : '') + (i ? 'cuoi-ngay' : '') + '">' + (i ? '' : '<th class="lc-b-n" rowspan="2" scope="row">' + TEN_THU[thu] + '<br>' + d.getDate() + '/' + (d.getMonth() + 1) + phuNgay(d) + '</th>') + '<th class="lc-b-b" scope="row">' + b[1] + '</th>' +
        cols.map(function (c) {
          var ls = (cell[k + '|' + b[0] + '|' + c.id] || []).slice().sort(function (p, q) { return (q.x.caNgay ? 1 : 0) - (p.x.caNgay ? 1 : 0) || p.a - q.a; });
          return '<td>' + ls.map(function (e) {
            var x = e.x;
            return '<button type="button" class="lc-b-su' + (x._trung.length ? ' trung' : '') + '" data-id="' + esc(x.id) + '" style="--c:' + mauSk(x) + '"><time>' + (x.caNgay ? 'Cả ngày' : dongHo(e.a) + '–' + dongHo(Math.min(e.b, 1439))) + '</time><b>' + esc(x.tieuDe) + '</b>' + (x.diaDiem ? '<small>' + esc(x.diaDiem) + '</small>' : '') + '</button>';
          }).join('') + '</td>';
        }).join('') + '</tr>';
    });
  }
  $('#lcNoi').innerHTML = '<div class="lc-bang-cuon"><table class="lc-bang"><thead><tr><th colspan="2">Ngày</th>' + cols.map(function (c) { return '<th><i class="lc-o-vuong nho" style="--c:' + c.mau + '"></i>' + esc(c.ten) + '</th>'; }).join('') + '</tr></thead><tbody>' + tr + '</tbody></table></div>';
}
function veLuoiCot(cot, rong) {
  var lo = MAC_LO, hi = MAC_HI;
  cot.forEach(function (c) {
    c.co = c.co.map(function (e) { return { x: e.x, a: e.a, b: Math.max(e.b, e.a + 30) }; });
    chiaLan(c.co);
    c.co.forEach(function (e) { lo = Math.min(lo, Math.floor(e.a / 60) * 60); hi = Math.max(hi, Math.min(1440, Math.ceil(e.b / 60) * 60)); });
  });
  // Ngày nào có nhiều lịch chồng nhau thì cột rộng ra (mỗi lịch tối thiểu 100px) thay vì ép chữ
  var ws = cot.map(function (c) { var l = Math.max.apply(null, c.co.map(function (e) { return e.soLan || 1; }).concat([1])); return Math.max(rong ? 118 : 96, l > 1 ? l * 100 : 0); });
  var cao = (hi - lo) / 60 * PX, gio = '', n = new Date(), mNay = n.getHours() * 60 + n.getMinutes(), coCa = cot.some(function (c) { return c.caNgay.length; }) || !rong;
  for (var g = lo; g < hi; g += 60) gio += '<span style="top:' + (g - lo) / 60 * PX + 'px">' + dongHo(g) + '</span>';
  var ngoai = function (c) {   // ngoài giờ làm việc mờ đi, cuối tuần mờ cả cột
    if (c.cuoiTuan) return '<div class="lc-ngoai" style="top:0;height:' + cao + 'px"></div>';
    var tren = Math.max(0, Math.min(hi - lo, GIO_LAM[0] - lo)), duoi = Math.max(0, GIO_LAM[1] - lo);
    return (tren > 0 ? '<div class="lc-ngoai" style="top:0;height:' + tren / 60 * PX + 'px"></div>' : '') + (duoi < hi - lo ? '<div class="lc-ngoai" style="top:' + duoi / 60 * PX + 'px;height:' + (hi - lo - duoi) / 60 * PX + 'px"></div>' : '');
  };
  var st = 'grid-template-columns:58px ' + ws.map(function (w) { return 'minmax(' + w + 'px,1fr)'; }).join(' ') + ';min-width:' + (58 + ws.reduce(function (a, b) { return a + b; }, 0)) + 'px';
  $('#lcNoi').innerHTML = '<div class="lc-cuon" id="cuonGio"><div class="lc-dau" style="' + st + '"><span></span>' + cot.map(function (c) { return c.dau; }).join('') + '</div>' +
    (coCa ? '<div class="lc-cangay" style="' + st + '"><span>Cả ngày</span>' + cot.map(function (c) { return '<div>' + c.caNgay.map(function (e) { return nutSu(e.x, 'tinh'); }).join('') + '</div>'; }).join('') + '</div>' : '') +
    '<div class="lc-than" style="' + st + ';height:' + cao + 'px"><div class="lc-gio">' + gio + '</div>' + cot.map(function (c) {
      return '<div class="lc-cot' + (c.nay ? ' nay' : '') + '" style="background-size:100% ' + PX + 'px" data-tao="' + c.k + '" data-lo="' + lo + '"' + (c.dd ? ' data-dd="' + esc(c.dd) + '"' : '') + (c.vt ? ' data-vt="' + esc(c.vt) + '"' : '') + '>' + ngoai(c) + c.co.map(function (e) {
        var top = (e.a - lo) / 60 * PX, h = Math.max(24, (e.b - e.a) / 60 * PX - 2);
        return nutSu(e.x, h < 44 ? 'ngan' : '', dongHo(e.a) + '–' + dongHo(Math.min(e.b, 1439)), 'top:' + top + 'px;height:' + h + 'px;left:calc(' + e.lan + ' / ' + e.soLan + ' * 100% + 1px);width:calc(100% / ' + e.soLan + ' - 3px)', true);
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
      ds.slice(0, max).map(function (e) { return nutSu(e.x, 'tinh'); }).join('') + (ds.length > max ? '<button type="button" class="lc-them" data-ngay="' + k + '">+' + (ds.length - max) + ' lịch</button>' : '') + '</div>';
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
  var x = e.x, phu = [vtTen(x), x.diaDiem, x.thanhPhan].filter(Boolean).join(' · '), tt = chiPhongXe(x.loai) ? x.trangThai : '';
  return '<button type="button" class="lc-dong' + (x._trung.length ? ' trung' : '') + (tt ? ' tt-' + tt : '') + '" data-id="' + esc(x.id) + '" style="--c:' + mauSk(x) + '"><time>' + (x.caNgay ? 'Cả ngày' : dongHo(e.a) + '–' + dongHo(Math.min(e.b, 1439))) + '</time><span><b>' + (DAU_TT[tt] || '') + esc(x.tieuDe) + (x._goc ? ' ↻' : '') + '</b><small>' + esc(TEN_LOAI[x.loai]) + (tt ? ' · ' + TEN_TT[tt] : '') + (x.donVi ? ' · ' + esc(x.donVi) : '') + (phu ? ' · ' + esc(phu) : '') + (x._trung.length ? ' · Trùng giờ' : '') + '</small></span></button>';
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
    return '<button type="button" class="lc-st" data-id="' + esc(x.id) + '" style="--c:' + mauSk(x) + '"><b>' + esc(x.tieuDe) + '</b><small>' + (k === nay ? 'Hôm nay' : nhanNgay(phanNgay(k))) + ' · ' + (x.caNgay ? 'cả ngày' : x.batDau.slice(11)) + '</small></button>'; }).join('') : '<p class="lc-phu">Không có lịch sắp tới</p>');
}
/** Hàng chọn người: bấm một hay nhiều lãnh đạo để chỉ xem lịch của họ. */
/** Bảng "Lịch đang xem": tick vai trò nào thì hiện lịch của vai trò đó. */
function veVt() {
  var el = $('#lcVt'); if (!el) return;
  var ds = dsVt(), muc = function (id, ten, mau, on, dam, them) {
    return '<label class="lc-vt-muc' + (dam ? ' dam' : '') + '"><input type="checkbox" data-vtdoi="' + esc(id) + '"' + (on ? ' checked' : '') + '><i class="lc-o-vuong" style="--c:' + mau + '"></i><span>' + esc(ten) + '</span></label>' + (them || '');
  };
  var dem = ds.filter(function (v) { return !S.vtAn[v.id]; }).length + (S.vtAn.chung ? 0 : 1) + (S.toi ? 1 : 0);
  el.innerHTML = '<div class="lc-vt-dau"><button type="button" class="lc-vt-gap" id="lcVtGap" aria-expanded="' + S.vtMo + '"><b>Lịch đang xem</b><span class="lc-dem">' + dem + '</span><i class="lc-mui' + (S.vtMo ? ' mo' : '') + '">▾</i></button>' +
    '<span class="lc-vt-nut"><button type="button" class="lc-nut-chu" data-vttat="1">Chọn tất cả</button><button type="button" class="lc-nut-chu" data-vttat="0">Bỏ chọn</button><button type="button" class="lc-nut-chu" id="lcQlVt">Quản lý vai trò</button></span></div>' +
    (S.vtMo ? '<div class="lc-vt-ds">' + muc('toi', 'Lịch của tôi', MAU_CHUNG, S.toi, true, '<button type="button" class="lc-nut-chu nho" id="lcSuaToi" title="Chọn các vai trò của tôi">chọn vai trò</button>') +
      [1, 2].map(function (c) {
        var g = ds.filter(function (v) { return capVt(v) === c; });
        return g.length ? '<div class="lc-vt-nhom"><b>' + TEN_CAP[c] + '</b><span><button type="button" class="lc-nut-chu nho" data-vtnhom="' + c + ':on">chọn nhóm</button><button type="button" class="lc-nut-chu nho" data-vtnhom="' + c + ':off">bỏ nhóm</button></span></div>' + g.map(function (v) { return muc(v.id, v.ten, mauVt(v), !S.vtAn[v.id]); }).join('') : '';
      }).join('') + muc('chung', 'Lịch chung toàn công ty', MAU_CHUNG, !S.vtAn.chung, true) + '</div>' : '');
}
function doiVt(id, on) {
  if (id === 'toi') { if (on && !S.toiVt.length) { moVtToi(); return; } S.toi = on; }
  else if (on) delete S.vtAn[id]; else S.vtAn[id] = 1;
  luuVtTt(); ve();
}
function chonNhomCap(cap, on) {
  S.vaiTro.forEach(function (v) { if (capVt(v) === cap) { if (on) delete S.vtAn[v.id]; else S.vtAn[v.id] = 1; } });
  luuVtTt(); ve();
}
function chonTatCaVt(on) {
  S.vtAn = {}; if (!on) { S.vaiTro.forEach(function (v) { S.vtAn[v.id] = 1; }); S.vtAn.chung = 1; S.toi = false; }
  luuVtTt(); ve();
}
function moVtToi() {
  moHop('Lịch của tôi', '<p class="lc-ca lc-phu">Chọn các vai trò của bạn. Khi tick “Lịch của tôi”, lịch của các vai trò này luôn hiện.</p><div class="lc-ca lc-vtbox" id="toiBox">' + (dsVt().length ? htmlNhomVt(function (id) { return S.toiVt.indexOf(id) >= 0; }) : '<span class="lc-phu">Chưa có vai trò. Bấm “Quản lý vai trò” để thêm.</span>') + '</div>',
    '<span class="cach"></span><button type="button" class="ck-btn" data-dongnut="1">Huỷ</button><button type="button" class="ck-btn chinh" id="luuToi">Lưu</button>');
}
function ve() {
  if (!$('#lcNoi')) return;   // đã rời trang trong lúc đang đọc dữ liệu
  if (S.namMo !== S.moc.getFullYear()) lamMoi();
  var k = khoang();
  $('#lcTenKhoang').textContent = S.q ? 'Kết quả tìm kiếm' : tenKhoang();
  $('#lcXem').innerHTML = XEM.map(function (x) { return '<button type="button" data-xem="' + x[0] + '" class="' + (S.xem === x[0] && !S.q ? 'chon' : '') + '" aria-pressed="' + (S.xem === x[0]) + '">' + x[1] + '</button>'; }).join('');
  var dem = {}, nt = theoNgay(dsLoc(), k[0], k[1]), da = {}, coTb = 'Notification' in window && Notification.permission === 'granted';
  Object.keys(nt).forEach(function (n) { nt[n].forEach(function (e) { if (!da[e.x.id]) { da[e.x.id] = 1; dem[e.x.loai] = (dem[e.x.loai] || 0) + 1; } }); });
  $('#lcLoai').innerHTML = LOAI.map(function (l) { return '<button type="button" class="lc-kind' + (S.an[l[0]] ? ' off' : '') + '" data-loai="' + l[0] + '" aria-pressed="' + !S.an[l[0]] + '"><i style="background:var(--faint)"></i>' + l[1] + (dem[l[0]] ? '<b>' + dem[l[0]] + '</b>' : '') + '</button>'; }).join('') +
    '<button type="button" class="lc-kind" id="lcAm" aria-pressed="' + S.am + '" title="Hiện ngày âm lịch và ngày lễ"><i style="background:var(--gold)"></i>Âm lịch, ngày lễ</button>' +
    '<button type="button" class="lc-kind" id="lcNhac" aria-pressed="' + coTb + '" title="Nhắc việc trên trình duyệt khi lịch có đặt nhắc"><i style="background:var(--info-fg)"></i>Nhắc việc</button>';
  veMini(); veSapToi(); veVt();
  if (S.q) veTimKiem();
  else if (S.xem === 'thang') veThang(k[0], k[1]);
  else if (S.xem === 'nam') veNam();
  else if (S.xem === 'trinh') veTrinh(k[0], k[1]);
  else if (S.xem === 'tai') veLuoiCot(cotTai(S.moc), true);
  else if (S.xem === 'vt') { var cv = cotVt(S.moc); if (cv.length) veLuoiCot(cv, true); else $('#lcNoi').innerHTML = '<div class="lc-rong">Ngày này không có lịch nào.</div>'; }
  else if (S.xem === 'bang') veBang(k[0], k[1]);
  else veLuoiCot(cotNgay(k[0], k[1]), false);
}

/* ---------- dữ liệu mẫu: lịch giả chỉ nằm trong trình duyệt, không ghi vào lịch thật ---------- */
var TEN_VT_MAU = ['Trưởng phòng KHĐT', 'Kế toán thanh toán', 'Nhân viên trạm thu gom Đội 1', 'Tổ trưởng Đội 1', 'Trợ lý Đội 1', 'Đội phó Đội 1', 'Đội trưởng Đội 1', 'Cán bộ kỹ thuật KTNN', 'Trưởng phòng KTNN', 'Thủ kho thành phẩm', 'Lái xe giao hàng', 'Nhân viên IT', 'Trưởng bảo trì', 'Nhân viên hành chính', 'Trưởng phòng QLCL', 'Nhân viên kiểm nghiệm QLCL', 'Nhân viên cân mủ', 'Văn thư', 'Nhân viên bảo vệ', 'Kế toán công nợ', 'Thủ kho', 'Cán bộ dự án', 'Trưởng ban quản lý dự án', 'Thủ quỹ', 'Trưởng ca nhà máy', 'Quản đốc nhà máy', 'Kế toán phải trả', 'Kế toán phải thu', 'Kế toán tổng hợp', 'Nhân viên nhân sự TCHC', 'Trưởng phòng TCHC', 'Nhân viên bán hàng', 'Trưởng phòng bán hàng', 'Nhân viên mua hàng KHĐT', 'Kế toán trưởng', 'Tổng giám đốc', 'Phó tổng giám đốc', 'Giám đốc nhà máy', 'Lịch Ban lãnh đạo'];
var CAP_LD = ['Tổng giám đốc', 'Phó tổng giám đốc', 'Giám đốc nhà máy', 'Quản đốc nhà máy', 'Kế toán trưởng', 'Trưởng phòng KHĐT', 'Trưởng phòng KTNN', 'Trưởng phòng QLCL', 'Trưởng phòng TCHC', 'Trưởng phòng bán hàng', 'Trưởng ban quản lý dự án', 'Lịch Ban lãnh đạo'];
var VT_MAU = TEN_VT_MAU.map(function (t, i) { return { id: 'v' + (i + 1), ten: t, mau: t === 'Lịch Ban lãnh đạo' ? '#5b6b7e' : MAU_VT[i % MAU_VT.length], thuTu: i + 1, cap: CAP_LD.indexOf(t) >= 0 ? 1 : 2 }; });
var VT_ID = {}; VT_MAU.forEach(function (v) { VT_ID[v.ten] = v.id; });
/* Tên người, chức danh ghi trong thành phần của dữ liệu mẫu ứng với vai trò nào */
var MAP_VT = { 'tgđ': ['Tổng giám đốc', 'Lịch Ban lãnh đạo'], 'p.tgđ hùng': ['Phó tổng giám đốc', 'Lịch Ban lãnh đạo'], 'p.tgđ mai': ['Phó tổng giám đốc', 'Lịch Ban lãnh đạo'], 'kế toán trưởng': ['Kế toán trưởng'],
  'trưởng phòng tchc': ['Trưởng phòng TCHC'], 'phòng tchc': ['Trưởng phòng TCHC', 'Nhân viên nhân sự TCHC'], 'trưởng phòng khđt': ['Trưởng phòng KHĐT'], 'trưởng phòng kế toán': ['Kế toán trưởng'], 'phòng kế toán': ['Kế toán trưởng', 'Kế toán tổng hợp'],
  'trưởng phòng kỹ thuật': ['Trưởng phòng KTNN'], 'chị lan (văn thư)': ['Văn thư'], 'văn thư các đơn vị': ['Văn thư'], 'anh tuấn (lái xe)': ['Lái xe giao hàng'], 'anh bình (lái xe)': ['Lái xe giao hàng'], 'anh dũng (it)': ['Nhân viên IT'],
  'chuyên viên hà': ['Nhân viên hành chính'], 'bí thư': ['Lịch Ban lãnh đạo'], 'phó bí thư': ['Lịch Ban lãnh đạo'], 'các uỷ viên': ['Lịch Ban lãnh đạo'], 'phòng bhck': ['Nhân viên bán hàng'],
  'tất cả trưởng phòng': ['Trưởng phòng KHĐT', 'Trưởng phòng TCHC', 'Trưởng phòng KTNN', 'Trưởng phòng QLCL', 'Trưởng phòng bán hàng'], 'công nhân khối sản xuất': ['Trưởng ca nhà máy', 'Nhân viên trạm thu gom Đội 1'] };
function vtIds(names) { var r = []; names.forEach(function (n) { if (VT_ID[n] && r.indexOf(VT_ID[n]) < 0) r.push(VT_ID[n]); }); return r.join(','); }
function vtTu(tp) { var r = []; tachTen(tp).forEach(function (t) { r = r.concat(MAP_VT[t] || []); }); return vtIds(r); }
function demoVtLay() { if (!S.demoVt) S.demoVt = VT_MAU.map(function (l) { return Object.assign({}, l); }); return S.demoVt.slice(); }
function demoTao() {
  var h = homNay(), ds = [], dem = 0, goc = Math.round((thuHai(h) - h) / 86400000);   // goc: thứ Hai của tuần này, tính từ hôm nay
  /** loai, tên, số ngày kể từ hôm nay, giờ bắt đầu (null = cả ngày), giờ kết thúc, tuỳ chọn {dd, tp, dv, gc, dai: số ngày kéo dài thêm, lap, den: số ngày kể từ hôm nay tới lúc hết lặp, tt, nhac, lk} */
  var them = function (loai, ten, d, a, b, o) {
    o = o || {};
    ds.push({ id: 'mau' + (++dem), tieuDe: ten, loai: loai, caNgay: !a, batDau: ymd(cong(h, d)) + ' ' + (a || '00:00'), ketThuc: ymd(cong(h, d + (o.dai || 0))) + ' ' + (b || '23:59'),
      diaDiem: o.dd || '', thanhPhan: o.tp || '', donVi: o.dv || '', ghiChu: o.gc || '', lap: o.lap || '', lapDen: o.den != null ? ymd(cong(h, o.den)) : '',
      lienKet: o.lk || '', trangThai: chiPhongXe(loai) ? o.tt || 'duyet' : '', nhac: o.nhac || '', vaiTro: o.vt != null ? vtIds(o.vt) : vtTu(o.tp) });
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
  // Vai trò: gắn nhiều vai trò, vai trò Lịch Ban lãnh đạo, lịch chung không gắn vai trò
  them('hop', 'Họp bàn dự án A (trùng người)', T(0, 4), '10:00', '11:00', { dd: P1, tp: 'P.TGĐ Hùng, Trưởng phòng KHĐT', dv: 'CRCK2' });
  them('hop', 'Họp bàn dự án B (trùng người)', T(0, 4), '10:30', '11:30', { dd: P2, tp: 'P.TGĐ Hùng, Trưởng phòng Kỹ thuật', dv: 'CRCK2', gc: 'Cùng P.TGĐ Hùng với dự án A nên báo trùng.' });
  them('viec', 'Ký hồ sơ vay vốn ngân hàng', T(0, 1), '15:00', '16:00', { dv: 'CRCK2', vt: ['Tổng giám đốc', 'Kế toán trưởng'], gc: 'Gắn vai trò bằng danh sách, không ghi thành phần.' });
  them('hop', 'Họp Ban chấp hành chi bộ', T(0, 3), '14:00', '16:00', { dd: P2, dv: 'Đảng ủy', vt: ['Lịch Ban lãnh đạo'] });
  them('congtac', 'Giám đốc nhà máy làm việc với Cục Thuế', T(0, 2), '09:00', '11:00', { dd: 'Cục Thuế', dv: 'CRCK2', vt: ['Giám đốc nhà máy', 'Quản đốc nhà máy'] });
  them('viec', 'Kiểm tra cân mủ định kỳ', T(0, 2), '07:30', '08:30', { dd: 'Trạm cân', dv: 'CRCK2', vt: ['Nhân viên cân mủ', 'Nhân viên bảo vệ'] });
  them('viec', 'Thông báo chung toàn công ty (không gắn vai trò)', T(0, 3), '16:00', '16:30', { dv: 'CRCK2', vt: [], gc: 'Không gắn vai trò nào nên thuộc Lịch chung toàn công ty.' });
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
  if (S.demo) { S.goc = demoLay().map(function (x) { if (!MAU[x.loai]) x.loai = 'khac'; return x; }); S.vaiTro = demoVtLay(); lamMoi(); ve(); return Promise.resolve(); }
  return fetch(API).then(function (r) { return r.json(); }).then(function (j) {
    if (!j.ok) throw new Error(j.loi || 'API lỗi');
    S.goc = j.data.lich.map(function (x) { if (!MAU[x.loai]) x.loai = 'khac'; return x; });
    S.vaiTro = j.data.vaiTro || [];
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
    lap: x.lap || '', lapDen: x.lapDen || '', lienKet: x.lienKet || '', trangThai: x.trangThai || '', nhac: x.nhac || '', vaiTro: x.vaiTro || '' };
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
  var hang = [['Loại', TEN_LOAI[x.loai]], pxe && x.trangThai ? ['Trạng thái', TEN_TT[x.trangThai]] : null, ['Thời gian', tg], ['Vai trò', vtTen(x)], ['Lặp lại', lap], ['Nhắc', nhac], ['Địa điểm', x.diaDiem], ['Thành phần', x.thanhPhan], ['Đơn vị', x.donVi], ['Ghi chú', x.ghiChu]].filter(function (h) { return h && h[1]; });
  var duyet = pxe && x.trangThai === 'cho' ? '<button type="button" class="ck-btn" data-dt="tuchoi:' + esc(goc) + '">Từ chối</button><button type="button" class="ck-btn chinh" data-dt="duyet:' + esc(goc) + '">Duyệt</button>' : '';
  moHop(x.tieuDe, (x._trung.length ? '<div class="lc-loi">Trùng giờ với: ' + x._trung.map(function (y) { return esc(y.tieuDe); }).join('; ') + '</div>' : '') +
      '<dl class="lc-ct">' + hang.map(function (h) { return '<dt>' + h[0] + '</dt><dd>' + esc(h[1]) + '</dd>'; }).join('') + (lk ? '<dt>Liên kết</dt><dd><a href="' + esc(lk) + '" target="_blank" rel="noopener noreferrer">' + esc(lk) + '</a></dd>' : '') + '</dl><div id="hopLoi" class="lc-loi" style="grid-column:1/-1" hidden></div>',
    '<button type="button" class="ck-btn nguy" data-xoa="' + esc(goc) + '">' + (lap ? 'Xoá cả chuỗi' : 'Xoá') + '</button><span class="cach"></span><button type="button" class="ck-btn" data-dongnut="1">Đóng</button>' + duyet + '<button type="button" class="ck-btn' + (duyet ? '' : ' chinh') + '" data-sua="' + esc(goc) + '">' + (lap ? 'Sửa cả chuỗi' : 'Sửa') + '</button>');
}
function moForm(x, loi) {
  x = x || {};
  var dBat = (x.batDau || ymd(S.moc) + ' 08:00'), dKet = (x.ketThuc || dBat.slice(0, 11) + dongHo(Math.min(phut(dBat) + 60, 1439)));
  var coMa = S.demo || !!maDaLuu(), lap = x.lap && TEN_LAP[x.lap] ? x.lap : '', dv = x.donVi != null ? x.donVi : (S.dv === 'Tất cả' ? '' : S.dv), loai = x.loai || 'congtac', tt = x.trangThai || 'cho';
  var vtAll = dsVt(), vtSel = vtCua(x);
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
    '<div class="lc-o ca">Lịch, vai trò' + (vtAll.length > 8 ? '<input class="lc-vttim" id="fVtTim" placeholder="Tìm vai trò…" autocomplete="off">' : '') + '<div class="lc-vtbox" id="fVtBox">' + (vtAll.length ? htmlNhomVt(function (id) { return vtSel.indexOf(id) >= 0; }) : '<span class="lc-phu">Chưa có vai trò. Bấm “Quản lý vai trò” để thêm.</span>') + '</div><small class="lc-phu">Không chọn vai trò nào: lịch hiện ở Lịch chung toàn công ty.</small></div>' +
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
/** Một dòng chọn vai trò: ô tick, ô màu, tên. */
function chipVt(l, chon, ten) {
  return '<label class="lc-vt-muc" data-ten="' + esc(boDau(l.ten)) + '"><input type="checkbox"' + (ten ? ' name="' + ten + '"' : '') + ' value="' + esc(l.id) + '"' + (chon ? ' checked' : '') + '><i class="lc-o-vuong" style="--c:' + mauVt(l) + '"></i><span>' + esc(l.ten) + '</span></label>';
}
/** Vai trò chia hai nhóm: cấp 1 Lãnh đạo, cấp 2 Nhân viên (nhóm không có vai trò thì không hiện). nutNhom: tên thuộc tính cho nút chọn, bỏ cả nhóm. */
function htmlNhomVt(tick, ten, nutNhom) {
  return [1, 2].map(function (c) {
    var ds = dsVt().filter(function (v) { return capVt(v) === c; });
    return ds.length ? '<div class="lc-vt-nhom"><b>' + TEN_CAP[c] + '</b>' + (nutNhom ? '<span><button type="button" class="lc-nut-chu nho" data-' + nutNhom + '="' + c + ':on">chọn nhóm</button><button type="button" class="lc-nut-chu nho" data-' + nutNhom + '="' + c + ':off">bỏ nhóm</button></span>' : '') + '</div>' +
      ds.map(function (v) { return chipVt(v, tick(v.id), ten); }).join('') : '';
  }).join('');
}
function anGio() { var ca = $('#fCaNgay').checked; document.querySelectorAll('.f-gio').forEach(function (e) { e.style.display = ca ? 'none' : ''; }); }
function anLap() { var l = $('#fLap').value; document.querySelectorAll('.f-lap').forEach(function (e) { e.style.display = l ? '' : 'none'; }); }
function anTT() { var p = chiPhongXe($('#fLoai').value); document.querySelectorAll('.f-tt').forEach(function (e) { e.style.display = p ? '' : 'none'; }); }
function layForm() {
  var ca = $('#fCaNgay').checked, n1 = $('#fNgay1').value, n2 = $('#fNgay2').value || n1, lap = $('#fLap').value, loai = $('#fLoai').value;
  return { tieuDe: $('#fTen').value.trim(), loai: loai, caNgay: ca, batDau: n1 + ' ' + (ca ? '00:00' : $('#fGio1').value || '00:00'), ketThuc: n2 + ' ' + (ca ? '23:59' : $('#fGio2').value || '00:00'),
    diaDiem: $('#fDiaDiem').value.trim(), thanhPhan: $('#fThanhPhan').value.trim(), donVi: $('#fDonVi').value.trim(), ghiChu: $('#fGhiChu').value.trim(), lap: lap, lapDen: lap ? $('#fLapDen').value : '',
    vaiTro: Array.from(document.querySelectorAll('#fVtBox input:checked')).map(function (i) { return i.value; }).join(','), lienKet: $('#fLienKet').value.trim(), trangThai: chiPhongXe(loai) ? $('#fTrangThai').value : '', nhac: ca ? '' : $('#fNhac').value };
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

/* ---------- quản lý danh sách vai trò ---------- */
function moQlVt(sua, loi, tam) {
  var ds = dsVt(), l = tam || (sua ? vtTheoId(sua) : null) || {}, coMa = S.demo || !!maDaLuu(), mau = /^#[0-9a-fA-F]{6}$/.test(l.mau || '') ? l.mau : MAU_VT[ds.length % MAU_VT.length];
  moHop('Quản lý vai trò',
    (loi ? '<div class="lc-loi" role="alert">' + esc(loi) + '</div>' : '') +
    '<div class="lc-ca">' + (ds.length ? '<table class="lc-ldb"><thead><tr><th>Vai trò (lịch)</th><th>Cấp</th><th>Thứ tự</th><th></th></tr></thead><tbody>' + ds.map(function (x) {
      return '<tr><td><span class="lc-ngc2"><i class="lc-o-vuong nho" style="--c:' + mauVt(x) + '"></i>' + esc(x.ten) + '</span></td><td>' + TEN_CAP[capVt(x)] + '</td><td>' + esc(x.thuTu) + '</td><td class="lc-ldb-nut"><button type="button" class="ck-btn" data-vtsua="' + esc(x.id) + '">Sửa</button><button type="button" class="ck-btn nguy" data-vtxoa="' + esc(x.id) + '">Xoá</button></td></tr>'; }).join('') + '</tbody></table>' : '<p class="lc-phu">Chưa có vai trò nào.</p>') + '</div>' +
    '<div class="lc-ca"><b>' + (l.id ? 'Sửa: ' + esc(l.ten) : 'Thêm vai trò') + '</b></div>' +
    '<label class="lc-o ca">Tên vai trò<input id="vtTen" maxlength="80" placeholder="VD: Trưởng phòng TCHC" value="' + esc(l.ten || '') + '"></label>' +
    '<label class="lc-o">Cấp<select id="vtCap"><option value="1"' + (capVt(l) === 1 ? ' selected' : '') + '>Cấp 1: Lãnh đạo</option><option value="2"' + (capVt(l) === 2 ? ' selected' : '') + '>Cấp 2: Nhân viên</option></select></label>' +
    '<label class="lc-o">Màu<input type="color" id="vtMau" value="' + mau + '"></label>' +
    '<label class="lc-o">Thứ tự hiện (số nhỏ hiện trước)<input id="vtTT" type="number" min="1" max="999" value="' + esc(l.thuTu || '') + '"></label>' +
    (coMa ? '' : '<label class="lc-o ca">Mã lập lịch<input type="password" id="vtMa" autocomplete="off"></label>'),
    (l.id ? '<button type="button" class="ck-btn" data-vtmoi="1">Thêm vai trò khác</button>' : '') + '<span class="cach"></span><button type="button" class="ck-btn" data-dongnut="1">Đóng</button><button type="button" class="ck-btn chinh" id="vtLuu" data-vtid="' + esc(l.id || '') + '">' + (l.id ? 'Lưu thay đổi' : 'Thêm vai trò') + '</button>');
  var o = $('#vtTen'); if (o) o.focus();
}
function luuVt(nut) {
  var l = { id: nut.dataset.vtid || '', ten: $('#vtTen').value.trim(), mau: $('#vtMau').value, cap: Number($('#vtCap').value) === 1 ? 1 : 2, thuTu: Number($('#vtTT').value) || 99 }, o = $('#vtMa'), ma = o ? o.value.trim() : maDaLuu();
  if (!l.ten) return moQlVt(l.id, 'Chưa nhập tên vai trò', l);
  if (S.demo) {
    if (l.id) Object.assign(S.demoVt.filter(function (y) { return y.id === l.id; })[0] || {}, l); else { l.id = 'v' + Date.now(); S.demoVt.push(l); }
    nap().then(function () { moQlVt(); }); return;
  }
  if (!ma) return moQlVt(l.id, 'Chưa nhập mã lập lịch', l);
  nut.disabled = true; nut.textContent = 'Đang lưu…';
  gui({ lenh: 'vtLuu', vt: l }, ma).then(function () { ghi('lich_ma', ma); return nap(); }).then(function () { moQlVt(); }).catch(function (e) {
    if (e.saiMa) { try { localStorage.removeItem('lich_ma'); } catch (z) {} moQlVt(l.id, 'Sai mã lập lịch', l); return; }
    moQlVt(l.id, e.message, l);
  });
}
function xoaVt(id, nut) {
  if (nut.dataset.dem !== '1') { nut.dataset.dem = '1'; nut.textContent = 'Bấm lần nữa'; return; }
  if (S.demo) { S.demoVt = S.demoVt.filter(function (y) { return y.id !== id; }); nap().then(function () { moQlVt(); }); return; }
  var ma = maDaLuu(); if (!ma) { moQlVt('', 'Nhập mã rồi lưu một lần để được xoá.'); return; }
  nut.disabled = true;
  gui({ lenh: 'vtXoa', id: id }, ma).then(function () { return nap(); }).then(function () { moQlVt(); }).catch(function (e) {
    if (e.saiMa) { try { localStorage.removeItem('lich_ma'); } catch (z) {} }
    moQlVt('', e.saiMa ? 'Sai mã. Nhập lại mã rồi thử lại.' : e.message);
  });
}

/* ---------- xuất file: PDF, Word, Excel theo mẫu "Lịch công tác tuần" ---------- */
var TEN_CTY = 'C.R.C.K.2 APHIVATH CAOUTHOUC CO., LTD';
/** Từng ngày trong khoảng, kèm các lịch của ngày đó (đã lọc), xếp cả ngày trước rồi theo giờ. */
function suKienTheoNgay(tu, den, ds) {
  var m = theoNgay(ds, tu, den), ra = [];
  for (var d = tu; ymd(d) <= ymd(den); d = cong(d, 1)) {
    var k = ymd(d);
    ra.push({ k: k, d: d, ds: (m[k] || []).slice().sort(function (p, q) { return (q.x.caNgay ? 1 : 0) - (p.x.caNgay ? 1 : 0) || p.a - q.a; }) });
  }
  return ra;
}
/** Một dòng nội dung: giờ - vai trò - tên lịch. Thành phần: ... ĐD: ... */
function dongBaoCao(e, loc, coVt) {
  var x = e.x, vt = coVt && loc.hienVt ? vtTen(x) : '';
  return '<b>' + (x.caNgay ? 'Cả ngày' : dongHo(e.a)) + '</b> - ' + (vt ? esc(vt) + ' - ' : '') + esc(x.tieuDe) + (x.trangThai === 'cho' ? ' (chờ duyệt)' : '') + '.' +
    (loc.hienTp && x.thanhPhan ? ' Thành phần: ' + esc(x.thanhPhan) + '.' : '') + (loc.hienDd && x.diaDiem ? ' ĐD: ' + esc(x.diaDiem) + '.' : '');
}
/** Các dòng mô tả bộ lọc đang dùng, in dưới tiêu đề để người đọc biết đây là bản đã lọc. */
function moTaLoc(loc) {
  var r = [], vs = dsVt().filter(function (v) { return loc.vt.indexOf(v.id) >= 0; }), chung = loc.vt.indexOf('chung') >= 0;
  var soCap = function (c) { return S.vaiTro.filter(function (v) { return capVt(v) === c; }).length; };
  if (loc.loai.length < LOAI.length) r.push('Loại công việc: ' + LOAI.filter(function (l) { return loc.loai.indexOf(l[0]) >= 0; }).map(function (l) { return l[1]; }).join(', '));
  if (loc.kieu !== 'vt' && !(vs.length === S.vaiTro.length && chung)) {
    var tatCa = vs.length === S.vaiTro.length, c1 = vs.length > 0 && vs.length === soCap(1) && vs.every(function (v) { return capVt(v) === 1; }), c2 = vs.length > 0 && vs.length === soCap(2) && vs.every(function (v) { return capVt(v) === 2; });
    var bo = S.vaiTro.filter(function (v) { return loc.vt.indexOf(v.id) < 0; });
    var ten = tatCa ? 'tất cả vai trò' : c1 ? 'cấp Lãnh đạo' : c2 ? 'cấp Nhân viên' : bo.length && bo.length <= 4 ? 'tất cả vai trò, trừ ' + bo.map(function (v) { return v.ten; }).join(', ') : vs.length > 8 ? vs.slice(0, 8).map(function (v) { return v.ten; }).join(', ') + ' … (+' + (vs.length - 8) + ')' : vs.map(function (v) { return v.ten; }).join(', ');
    r.push('Vai trò: ' + (ten ? ten + (chung ? '; gồm Lịch chung' : (tatCa ? ' (không gồm Lịch chung)' : '')) : chung ? 'Lịch chung' : '(không chọn)'));
  }
  if (loc.q) r.push('Từ khoá: ' + loc.q);
  return r;
}
function taoBaoCao(tu, den, loc, ds) {
  var soNgay = Math.round((den - tu) / 86400000) + 1, tuan = soNgay === 7 && (tu.getDay() + 6) % 7 === 0, hienTrong = loc.hienTrong && soNgay <= 31;
  var thang = tu.getMonth() === den.getMonth() && tu.getDate() === 1 && den.getDate() === new Date(den.getFullYear(), den.getMonth() + 1, 0).getDate();
  var tieu = tuan ? 'LỊCH CÔNG TÁC TUẦN' : thang ? 'LỊCH CÔNG TÁC THÁNG ' + (tu.getMonth() + 1) + '/' + tu.getFullYear() : 'LỊCH CÔNG TÁC';
  var bang = function (dsx, coVt) {
    var hang = suKienTheoNgay(tu, den, dsx).filter(function (n) { var t = n.d.getDay(); return (hienTrong || n.ds.length) && (loc.hienCuoiTuan || (t !== 0 && t !== 6)); }).map(function (n) {
      return '<tr><td class="bc-n" align="center"><b>' + TEN_THU[(n.d.getDay() + 6) % 7] + '</b><br><b>' + vnNgay(n.k) + '</b></td><td class="bc-nd">' + n.ds.map(function (e) { return '<p>' + dongBaoCao(e, loc, coVt) + '</p>'; }).join('') + '</td></tr>';
    }).join('');
    return '<table border="1" cellspacing="0" cellpadding="6"><thead><tr><th width="150">NGÀY<br>THÁNG</th><th>THỜI GIAN - NỘI DUNG – THÀNH PHẦN – ĐỊA ĐIỂM</th></tr></thead><tbody>' + (hang || '<tr><td colspan="2" align="center">Không có lịch trong khoảng này</td></tr>') + '</tbody></table>';
  };
  var phan;
  if (loc.kieu === 'vt') {   // mỗi vai trò một bảng, ngắt trang giữa các vai trò
    var nhom = dsVt().filter(function (v) { return loc.vt.indexOf(v.id) >= 0; }).map(function (v) { return { ten: v.ten, ds: ds.filter(function (x) { return vtCua(x).indexOf(v.id) >= 0; }) }; });
    if (loc.vt.indexOf('chung') >= 0) nhom.push({ ten: 'Lịch chung toàn công ty', ds: ds.filter(function (x) { return !vtCua(x).length; }) });
    nhom = nhom.filter(function (g) { return g.ds.length; });
    phan = nhom.length ? nhom.map(function (g) { return '<div class="bc-sec"><h2>' + esc(g.ten) + '</h2>' + bang(g.ds, false) + '</div>'; }).join('') : bang([], false);
  } else phan = bang(ds, true);
  return '<div class="lc-bc"><p class="bc-cty"><b>' + TEN_CTY + '</b></p><h1>' + tieu + '</h1><p class="bc-khoang"><b>Từ ' + vnNgay(ymd(tu)) + ' đến ' + vnNgay(ymd(den)) + '</b></p>' +
    moTaLoc(loc).map(function (t) { return '<p class="bc-loc">' + esc(t) + '</p>'; }).join('') + phan + '</div>';
}
var CSS_BC = '.lc-bc .bc-loc{margin:0 0 2px;text-align:center;font-style:italic;font-size:11.5pt}.lc-bc h2{margin:18px 0 6px;font-size:14pt}.lc-bc .bc-sec+.bc-sec{page-break-before:always}' +
  '.lc-bc{font-family:"Times New Roman",Times,serif;font-size:13pt;color:#000;background:#fff}.lc-bc p{margin:4px 0}.lc-bc .bc-cty{text-align:center;font-size:12pt}.lc-bc h1{margin:14px 0 4px;text-align:center;font-size:20pt;font-weight:700}.lc-bc .bc-khoang{text-align:center;margin-bottom:14px}' +
  '.lc-bc table{width:100%;border-collapse:collapse}.lc-bc th{padding:8px;border:1px solid #000;background:#f3f6f4;color:#44525e;font-size:11.5pt}.lc-bc td{padding:8px 10px;border:1px solid #000;vertical-align:top;height:44px}.lc-bc td.bc-n{width:150px;text-align:center}.lc-bc td.bc-nd{text-align:justify}';
function xKhoang() {
  var v = (document.querySelector('input[name="xkh"]:checked') || {}).value, t = thuHai(S.moc);
  if (v === 'thang') return [new Date(S.moc.getFullYear(), S.moc.getMonth(), 1), new Date(S.moc.getFullYear(), S.moc.getMonth() + 1, 0)];
  if (v === 'tu') {
    var a = $('#xTu').value, b = $('#xDen').value || a;
    if (a && b >= a && Math.round((phanNgay(b) - phanNgay(a)) / 86400000) <= 92) return [phanNgay(a), phanNgay(b)];
  }
  return [t, cong(t, 6)];
}
function xLoc() {
  var chon = function (n) { return Array.from(document.querySelectorAll('input[name="' + n + '"]:checked')).map(function (i) { return i.value; }); }, c = function (id) { var e = $('#' + id); return !!(e && e.checked); };
  return { loai: chon('xloai'), vt: chon('xvt'), q: ($('#xQ') ? $('#xQ').value : '').trim(), kieu: chon('xkieu')[0] || 'ngay', hienVt: c('xVt'), hienTp: c('xTp'), hienDd: c('xDd'), hienTrong: c('xTrong'), hienCuoiTuan: c('xCuoi'), cho: c('xCho') };
}
/** Lịch (đã mở rộng lặp) khớp bộ lọc của hộp thoại xuất: loại công việc, vai trò, từ khoá, trạng thái. */
function suKienXuat(loc) {
  var q = boDau(loc.q || '').split(/\s+/).filter(Boolean);
  return S.ds.filter(function (x) {
    if (x.trangThai === 'tuchoi' || (x.trangThai === 'cho' && !loc.cho)) return false;
    if (loc.loai.indexOf(x.loai) < 0) return false;
    var ids = vtCua(x);
    if (ids.length) { if (!ids.some(function (id) { return loc.vt.indexOf(id) >= 0; })) return false; }
    else if (loc.vt.indexOf('chung') < 0) return false;
    if (q.length) { var t = boDau([x.tieuDe, x.diaDiem, x.thanhPhan, x.ghiChu, x.donVi].join(' ')); if (!q.every(function (w) { return t.indexOf(w) >= 0; })) return false; }
    return true;
  });
}
function xCapNhat() {
  var k = xKhoang(), v = (document.querySelector('input[name="xkh"]:checked') || {}).value, loc = xLoc(), ds = suKienXuat(loc);
  document.querySelectorAll('.f-xtu').forEach(function (e) { e.style.display = v === 'tu' ? '' : 'none'; });
  $('#xXem').innerHTML = taoBaoCao(k[0], k[1], loc, ds);
  var n = suKienTheoNgay(k[0], k[1], ds).reduce(function (t, d) { return t + d.ds.length; }, 0);
  $('#xGhiChu').textContent = n + ' dòng lịch trong khoảng ' + vnNgay(ymd(k[0])) + ' – ' + vnNgay(ymd(k[1])) + (v === 'tu' ? ' (tối đa 92 ngày)' : '') + '.';
}
/** Chọn cả cấp trong bộ lọc vai trò: tất cả, chỉ Lãnh đạo, chỉ Nhân viên (Lịch chung giữ nguyên). */
function xCap(c) {
  S.vaiTro.forEach(function (v) { var i = document.querySelector('input[name="xvt"][value="' + v.id + '"]'); if (i) i.checked = c === 'all' || capVt(v) === Number(c); });
  xCapNhat();
}
function xNhom(cap, on) {
  S.vaiTro.forEach(function (v) { if (capVt(v) === cap) { var i = document.querySelector('input[name="xvt"][value="' + v.id + '"]'); if (i) i.checked = on; } });
  xCapNhat();
}
function moXuat() {
  var md = { loai: LOAI.map(function (l) { return l[0]; }).filter(function (id) { return !S.an[id]; }), vt: dsVt().filter(vtHien).map(function (v) { return v.id; }).concat(S.vtAn.chung ? [] : ['chung']) };
  var ck = function (on) { return on ? ' checked' : ''; }, cb = function (id, ten, on) { return '<label class="lc-xc"><input type="checkbox" id="' + id + '"' + ck(on) + '>' + ten + '</label>'; };
  moHop('Xuất lịch ra file',
    '<div class="lc-ca lc-xuat-bo"><div class="lc-xuat-loc">' +
      '<fieldset><legend>Ngày</legend><div class="lc-xuat-khoang"><label><input type="radio" name="xkh" value="tuan" checked> Tuần đang xem</label><label><input type="radio" name="xkh" value="thang"> Tháng đang xem</label><label><input type="radio" name="xkh" value="tu"> Tuỳ chọn</label></div>' +
        '<div class="lc-xuat-ngay f-xtu"><label>Từ<input type="date" id="xTu" value="' + ymd(S.moc) + '"></label><label>Đến<input type="date" id="xDen" value="' + ymd(cong(S.moc, 6)) + '"></label></div></fieldset>' +
      '<fieldset><legend>Công việc (loại lịch)<span><button type="button" class="lc-nut-chu nho" data-xloai="on">tất cả</button><button type="button" class="lc-nut-chu nho" data-xloai="off">bỏ</button></span></legend>' +
        LOAI.map(function (l) { return '<label class="lc-xc"><input type="checkbox" name="xloai" value="' + l[0] + '"' + ck(md.loai.indexOf(l[0]) >= 0) + '>' + l[1] + '</label>'; }).join('') + '</fieldset>' +
      '<fieldset><legend>Vai trò</legend><div class="lc-xcap" role="group" aria-label="Cấp vai trò"><button type="button" data-xcap="all">Tất cả</button><button type="button" data-xcap="1">Lãnh đạo</button><button type="button" data-xcap="2">Nhân viên</button></div>' +
        '<div class="lc-vtbox x">' + htmlNhomVt(function (id) { return md.vt.indexOf(id) >= 0; }, 'xvt', 'xnhom') +
        '<div class="lc-vt-nhom"><b>Chung</b></div><label class="lc-vt-muc"><input type="checkbox" name="xvt" value="chung"' + ck(md.vt.indexOf('chung') >= 0) + '><i class="lc-o-vuong" style="--c:' + MAU_CHUNG + '"></i><span>Lịch chung toàn công ty</span></label></div></fieldset>' +
      '<fieldset><legend>Từ khoá</legend><input id="xQ" placeholder="Tên lịch, địa điểm, thành phần…" autocomplete="off" value="' + esc(S.q) + '"></fieldset>' +
      '<fieldset><legend>Hiển thị</legend>' + cb('xVt', 'Tên vai trò trong dòng', true) + cb('xTp', 'Thành phần', true) + cb('xDd', 'Địa điểm', true) + cb('xTrong', 'Cả ngày không có lịch', true) + cb('xCuoi', 'Thứ Bảy, Chủ nhật', true) + cb('xCho', 'Lịch chờ duyệt', true) + '</fieldset>' +
      '<fieldset><legend>Cách trình bày</legend><div class="lc-xuat-khoang"><label><input type="radio" name="xkieu" value="ngay" checked> Theo ngày</label><label><input type="radio" name="xkieu" value="vt"> Mỗi vai trò một bảng</label></div></fieldset>' +
    '</div><div class="lc-xuat-phai"><p class="lc-phu" id="xGhiChu"></p><div class="lc-xuat-xem" id="xXem"></div></div></div>',
    '<button type="button" class="ck-btn" data-xuat="ics" title="Google Lịch, Outlook, điện thoại">Thuê bao, .ics</button><span class="cach"></span><button type="button" class="ck-btn" data-dongnut="1">Đóng</button>' +
    '<button type="button" class="ck-btn" data-xuat="xls">Excel</button><button type="button" class="ck-btn" data-xuat="doc">Word</button><button type="button" class="ck-btn chinh" data-xuat="in">In, lưu PDF</button>');
  var h = $('#lcHop .lc-hop'); if (h) h.classList.add('rong');
  xCapNhat();
}
function taiFile(ten, noiDung, loai) {
  var blob = new Blob(['\ufeff' + noiDung], { type: loai + ';charset=utf-8' }), a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = ten; document.body.appendChild(a); a.click();
  setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
function xuatFile(kieu) {
  var k = xKhoang(), loc = xLoc(), ds = suKienXuat(loc), ten = 'lich-cong-tac-' + ymd(k[0]) + (ymd(k[1]) !== ymd(k[0]) ? '-den-' + ymd(k[1]) : '');
  if (kieu === 'in') {
    // In đúng phần mẫu giấy: ẩn mọi thứ khác của trang rồi gọi hộp thoại in (chọn "Lưu thành PDF" để có file PDF)
    var d = document.createElement('div'); d.id = 'lcBcIn'; d.innerHTML = '<style>' + CSS_BC + '</style>' + taoBaoCao(k[0], k[1], loc, ds); document.body.appendChild(d); document.body.classList.add('dang-in-bc');
    var xong = function () { document.body.classList.remove('dang-in-bc'); d.remove(); window.removeEventListener('afterprint', xong); };
    window.addEventListener('afterprint', xong); setTimeout(function () { window.print(); }, 60);
  } else if (kieu === 'doc') {
    taiFile(ten + '.doc', '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>Lịch công tác</title><!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View></w:WordDocument></xml><![endif]--><style>@page{size:A4;margin:2cm}' + CSS_BC + '</style></head><body>' + taoBaoCao(k[0], k[1], loc, ds) + '</body></html>', 'application/msword');
  } else if (kieu === 'xls') {
    var dong = suKienTheoNgay(k[0], k[1], ds).map(function (n) {
      return n.ds.map(function (e) {
        var x = e.x, c = function (v) { return '<td>' + esc(v) + '</td>'; };
        return '<tr>' + c(vnNgay(n.k)) + c(TEN_THU[(n.d.getDay() + 6) % 7]) + c(x.caNgay ? 'Cả ngày' : dongHo(e.a)) + c(x.caNgay ? '' : dongHo(Math.min(e.b, 1439))) + c(x.tieuDe) + c(TEN_LOAI[x.loai]) + c(vtTen(x) || 'Lịch chung') + c(x.thanhPhan) + c(x.diaDiem) + c(x.donVi) + c(x.trangThai ? TEN_TT[x.trangThai] : '') + c(x.ghiChu) + '</tr>';
      }).join('');
    }).join('');
    taiFile(ten + '.xls', '<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body><table border="1"><thead><tr><th>Ngày</th><th>Thứ</th><th>Từ giờ</th><th>Đến giờ</th><th>Nội dung</th><th>Loại</th><th>Vai trò (lịch)</th><th>Thành phần</th><th>Địa điểm</th><th>Đơn vị</th><th>Trạng thái</th><th>Ghi chú</th></tr></thead><tbody>' + dong + '</tbody></table></body></html>', 'application/vnd.ms-excel');
  }
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
    var mt = [vtTen(x) ? 'Vai trò: ' + vtTen(x) : '', x.thanhPhan ? 'Thành phần: ' + x.thanhPhan : '', x.donVi ? 'Đơn vị: ' + x.donVi : '', x.lienKet || '', x.ghiChu || ''].filter(Boolean).join('\n');
    if (mt) L.push('DESCRIPTION:' + icsChu(mt));
    L.push('CATEGORIES:' + icsChu(TEN_LOAI[x.loai] || ''), 'STATUS:' + (x.trangThai === 'cho' ? 'TENTATIVE' : x.trangThai === 'tuchoi' ? 'CANCELLED' : 'CONFIRMED'));
    if (x.nhac && !x.caNgay) L.push('BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + icsChu(x.tieuDe), 'TRIGGER:-PT' + Number(x.nhac) + 'M', 'END:VALARM');
    L.push('END:VEVENT');
  });
  L.push('END:VCALENDAR');
  return L.map(icsGap).join('\r\n') + '\r\n';
}
function moIcs() {
  var ds = S.goc.filter(function (x) { return khopVt(x); }), nv = S.dv === 'Tất cả' ? '' : S.dv, lk = API + '.ics' + (nv ? '?dv=' + encodeURIComponent(nv) : '');
  moHop('Xuất lịch (.ics)',
    '<p class="lc-ca">Đưa lịch sang <b>Google Lịch, Outlook, Apple Lịch</b> hoặc điện thoại. Lịch lặp, địa điểm, nhắc việc và trạng thái duyệt đều được mang theo.</p>' +
    '<div class="lc-ca"><b>Tải file</b> (' + ds.length + ' lịch' + (nv ? ' của ' + esc(nv) + ' và lịch không ghi đơn vị' : ', mọi đơn vị') + '). Nhập một lần, không tự cập nhật.</div>' +
    '<div class="lc-ca"><b>Thuê bao tự cập nhật</b>: dán link này vào mục “Thêm lịch từ URL” của Google Lịch hoặc Outlook.' +
    (S.demo ? ' <i>Dữ liệu mẫu không có trên máy chủ nên link này là lịch thật.</i>' : '') + '<input class="lc-link" readonly value="' + esc(lk) + '" onclick="this.select()"></div>',
    '<span class="cach"></span><button type="button" class="ck-btn" data-dongnut="1">Đóng</button><button type="button" class="ck-btn chinh" id="icsTai">Tải file .ics</button>');
}
function taiIcs() {
  var ds = S.goc.filter(function (x) { return khopVt(x); }), nv = S.dv === 'Tất cả' ? 'tat-ca' : S.dv;
  var blob = new Blob([taoIcs(ds, 'Lịch làm việc' + (S.dv === 'Tất cả' ? '' : ' ' + S.dv))], { type: 'text/calendar;charset=utf-8' }), a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'lich-' + nv + '-' + ymd(homNay()) + '.ics'; document.body.appendChild(a); a.click();
  setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}

/* ---------- tìm giờ trống chung ---------- */
function tinhTrong(ten, dai, tu, den, ids) {
  ids = ids || [];
  var ds = tachTen(ten), ra = [], bay = new Date(), mBay = bay.getHours() * 60 + bay.getMinutes(), nay = ymd(homNay());
  var m = theoNgay(S.ds.filter(function (x) { return !x.caNgay && x.trangThai !== 'tuchoi'; }), tu, den);
  for (var d = tu; ymd(d) <= ymd(den); d = cong(d, 1)) {
    var k = ymd(d), thu = (d.getDay() + 6) % 7; if (thu > 4) continue;
    var bs = (m[k] || []).filter(function (e) {
      var tenSk = tachTen(e.x.thanhPhan).concat((e.x.diaDiem || '').trim() ? [(e.x.diaDiem || '').trim().toLowerCase()] : []);
      return ds.some(function (t) { return tenSk.indexOf(t) >= 0; }) || ids.some(function (id) { return vtCua(e.x).indexOf(id) >= 0; });
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
    '<div class="lc-o ca">Vai trò cần rảnh<div class="lc-vtbox" id="tgVtBox">' + (dsVt().length ? htmlNhomVt(function (id) { return S.tgVt.indexOf(id) >= 0; }) : '<span class="lc-phu">Chưa có vai trò.</span>') + '</div></div>' +
    '<label class="lc-o ca">Người, phòng, xe khác cần rảnh (cách nhau bằng dấu phẩy)<input id="tgTen" placeholder="VD: P.TGĐ Hùng, Trưởng phòng KHĐT, Phòng họp 1" value="' + esc(S.tgTen || S.ten) + '"></label>' +
    '<label class="lc-o">Thời lượng<select id="tgDai">' + dai.map(function (n) { return '<option value="' + n + '"' + (n === 60 ? ' selected' : '') + '>' + (n >= 60 ? n / 60 + ' giờ' : n + ' phút') + '</option>'; }).join('') + '</select></label>' +
    '<span></span><label class="lc-o">Từ ngày<input type="date" id="tgTu" value="' + ymd(tu) + '"></label><label class="lc-o">Đến ngày<input type="date" id="tgDen" value="' + ymd(den) + '"></label>' +
    '<div class="lc-ca" id="tgKq"><p class="lc-phu">Giờ làm việc 08:00–11:30 và 13:30–17:00, thứ Hai đến thứ Sáu. Vai trò tính theo lịch đã gắn; tên gõ thêm phải khớp đúng cách ghi trong thành phần của lịch.</p></div>',
    '<span class="cach"></span><button type="button" class="ck-btn" data-dongnut="1">Đóng</button><button type="button" class="ck-btn chinh" id="tgTim">Tìm giờ trống</button>');
}
function chayTimGio() {
  var ten = $('#tgTen').value.trim(), kq = $('#tgKq'), ids = Array.from(document.querySelectorAll('#tgVtBox input:checked')).map(function (i) { return i.value; }); S.tgTen = ten; S.tgVt = ids;
  if (!tachTen(ten).length && !ids.length) { kq.innerHTML = '<div class="lc-loi">Chọn ít nhất một vai trò hoặc nhập một tên người, phòng, xe.</div>'; return; }
  var tu = $('#tgTu').value, den = $('#tgDen').value || tu;
  if (!tu || den < tu) { kq.innerHTML = '<div class="lc-loi">Khoảng ngày chưa đúng.</div>'; return; }
  if (Math.round((phanNgay(den) - phanNgay(tu)) / 86400000) > 60) { kq.innerHTML = '<div class="lc-loi">Chỉ tìm tối đa 60 ngày.</div>'; return; }
  var dai = Number($('#tgDai').value), ra = tinhTrong(ten, dai, phanNgay(tu), phanNgay(den), ids).slice(0, 18);
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
  if (t.closest('#lcQlVt')) { moQlVt(); return; }
  if (t.id === 'vtLuu') { luuVt(t); return; }
  if ((g = t.closest('[data-vtsua]'))) { moQlVt(g.dataset.vtsua); return; }
  if ((g = t.closest('[data-vtxoa]'))) { xoaVt(g.dataset.vtxoa, g); return; }
  if (t.closest('[data-vtmoi]')) { moQlVt(); return; }
  if (t.closest('#lcVtGap')) { S.vtMo = !S.vtMo; ghi('lich_vt_mo', S.vtMo ? '1' : '0'); veVt(); return; }
  if ((g = t.closest('[data-vtnhom]'))) { var pn = g.dataset.vtnhom.split(':'); chonNhomCap(Number(pn[0]), pn[1] === 'on'); return; }
  if ((g = t.closest('[data-vttat]'))) { chonTatCaVt(g.dataset.vttat === '1'); return; }
  if (t.closest('#lcSuaToi')) { e.preventDefault(); moVtToi(); return; }
  if (t.id === 'luuToi') { S.toiVt = Array.from(document.querySelectorAll('#toiBox input:checked')).map(function (i) { return i.value; }); S.toi = S.toiVt.length > 0; luuVtTt(); dongHop(); ve(); return; }
  if (t.id === 'tgTim') { chayTimGio(); return; }
  if (t.closest('#lcXuat')) { moXuat(); return; }
  if ((g = t.closest('[data-xcap]'))) { xCap(g.dataset.xcap); return; }
  if ((g = t.closest('[data-xnhom]'))) { var px = g.dataset.xnhom.split(':'); xNhom(Number(px[0]), px[1] === 'on'); return; }
  if ((g = t.closest('[data-xloai]'))) { document.querySelectorAll('input[name="xloai"]').forEach(function (i) { i.checked = g.dataset.xloai === 'on'; }); xCapNhat(); return; }
  if ((g = t.closest('[data-xuat]'))) { if (g.dataset.xuat === 'ics') moIcs(); else xuatFile(g.dataset.xuat); return; }
  if (t.closest('#lcTrong')) { moTimGio(); return; }
  if (t.dataset && t.dataset.dong && t === e.currentTarget.querySelector('.lc-nen')) { dongHop(); return; }
  if ((g = t.closest('[data-dongnut]'))) { dongHop(); return; }
  if ((g = t.closest('[data-trong]'))) {
    var p = g.dataset.trong.split('|'); dongHop();
    moForm({ batDau: p[0] + ' ' + dongHo(Number(p[1])), ketThuc: p[0] + ' ' + dongHo(Number(p[2])), thanhPhan: S.tgTen, vaiTro: S.tgVt.join(',') });
    return;
  }
  if ((g = t.closest('[data-dt]'))) {
    var q = g.dataset.dt.split(':'), x = timGoc(q.slice(1).join(':'));
    if (x) { dongHop(); luuDoi(x, { trangThai: q[0] }); }
    return;
  }
  if ((g = t.closest('[data-xem]'))) { S.xem = g.dataset.xem; xoaTim(); ghi('lich_xem', S.xem); ve(); return; }
  if (t.closest('#lcAm')) { S.am = !S.am; ghi('lich_am', S.am ? '1' : '0'); ve(); return; }
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
    moForm({ batDau: g.dataset.tao + ' ' + dongHo(gio), diaDiem: g.dataset.dd || '', vaiTro: g.dataset.vt || '' });
  }
});
function layFormGiu() { var v = layForm(); v.id = $('#fLuu').dataset.luu; return v; }
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape' && $('#lcHop') && $('#lcHop').innerHTML) { dongHop(); return; }
  if (!$('#lcGoc') || $('#lcHop').innerHTML || e.ctrlKey || e.metaKey || e.altKey) return;
  var ten = e.target.tagName; if (/^(INPUT|TEXTAREA|SELECT)$/.test(ten) || e.target.isContentEditable) return;
  var k = e.key.toLowerCase(), so = k === '0' ? 10 : Number(k);
  if (k === 't') { S.moc = homNay(); ve(); }
  else if (k === 'arrowleft' || k === 'j') buoc(-1);
  else if (k === 'arrowright' || k === 'k') buoc(1);
  else if (k === 'n') moForm();
  else if (k === '/') { e.preventDefault(); $('#lcTim').focus(); }
  else if (so >= 1 && so <= XEM.length) { S.xem = XEM[so - 1][0]; xoaTim(); ghi('lich_xem', S.xem); ve(); }
});
document.addEventListener('change', function (e) {
  var vd = e.target.dataset && e.target.dataset.vtdoi;
  if (vd) { doiVt(vd, e.target.checked); return; }
  if (/^(xkh|xloai|xvt|xkieu)$/.test(e.target.name || '') || /^(xTu|xDen|xVt|xTp|xDd|xTrong|xCuoi|xCho)$/.test(e.target.id || '')) { xCapNhat(); return; }
  if (!$('#fLuu')) return;
  if (e.target.id === 'fCaNgay') anGio();
  if (e.target.id === 'fLap') anLap();
  if (e.target.id === 'fLoai') anTT();
  if (e.target.id === 'fNgay1') { var n2 = $('#fNgay2'); if (n2.value < e.target.value) n2.value = e.target.value; }
  kiemTrung($('#fLuu').dataset.luu);
});
document.addEventListener('input', function (e) {
  if (e.target.id === 'lcTim') { S.q = e.target.value.trim(); ve(); return; }
  if (e.target.id === 'xQ') { xCapNhat(); return; }
  if (e.target.id === 'fVtTim') { var tk = boDau(e.target.value); document.querySelectorAll('#fVtBox .lc-vt-muc').forEach(function (l) { l.style.display = !tk || l.dataset.ten.indexOf(tk) >= 0 ? '' : 'none'; }); return; }
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
    '<section class="lc-vt" id="lcVt" aria-label="Lịch đang xem"></section>' +
    '<div class="lc-hang2"><div class="lc-loai" id="lcLoai" role="group" aria-label="Loại lịch"></div>' +
      '<div class="lc-cu"><span class="lc-zoom" role="group" aria-label="Độ cao lưới giờ"><button type="button" class="ck-btn vuong" id="lcZm" aria-label="Thu nhỏ lưới giờ" title="Thu nhỏ lưới giờ">−</button><button type="button" class="ck-btn vuong" id="lcZp" aria-label="Phóng to lưới giờ" title="Phóng to lưới giờ">+</button></span><button type="button" class="ck-btn" id="lcTrong" title="Tìm khung giờ nhiều người cùng rảnh">Tìm giờ trống</button><button type="button" class="ck-btn" id="lcXuat" title="Xuất lịch ra PDF, Word, Excel, .ics">Xuất file</button><button type="button" class="ck-btn" id="lcIn" title="In lịch đang xem">In</button>' +
      '<button type="button" class="ck-btn lc-mau" id="lcMau" aria-pressed="false" title="Xem thử bằng lịch giả, không ghi vào lịch thật">Dữ liệu mẫu</button></div></div>' +
    '<div class="lc-bo"><aside class="lc-ben"><div class="lc-mini" id="lcMini"></div><div class="lc-sap" id="lcSapToi"></div>' +
      '<p class="lc-phim">Phím tắt: T hôm nay · ← → chuyển · N lập mới · / tìm · 1–9, 0 kiểu xem. Kéo lịch để dời, kéo mép dưới để đổi độ dài.</p></aside>' +
    '<main class="lc-the" id="lcNoi"></main></div></div>';
  var nl = $('#nutLap'); if (nl) nl.onclick = function () { moForm(); };
  $('#lcHomNay').onclick = function () { S.moc = homNay(); ve(); };
  $('#lcLui').onclick = function () { buoc(-1); };
  $('#lcToi').onclick = function () { buoc(1); };
  $('#lcIn').onclick = function () { window.print(); };
  $('#lcZm').onclick = function () { doiZoom(-1); };
  $('#lcZp').onclick = function () { doiZoom(1); };
  $('#lcMau').onclick = function () {
    S.demo = !S.demo; S.demoDs = null; S.demoVt = null; S.daNhac = {}; ghi('lich_demo', S.demo ? '1' : '0'); veDemo(); S.goc = []; S.ds = [];
    $('#lcNoi').innerHTML = '<div class="lc-baoloi">Đang đọc lịch…</div>'; nap();
  };
  veDemo(); ve();
  $('#lcNoi').innerHTML = '<div class="lc-baoloi">Đang đọc lịch…</div>';
  nap();
  if (!S.hen) S.hen = setInterval(kiemNhac, 30000);
}
window.LICH = { gan: gan, am: doiAm, le: leNgay, ics: taoIcs, trong: function (ten, dai, tu, den) { return tinhTrong(ten, dai, phanNgay(tu), phanNgay(den)); }, _S: S };
})();
