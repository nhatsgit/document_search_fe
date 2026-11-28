/* =====================================================================
   Văn thư › Chức năng › Nộp hồ sơ: đưa file PDF (từ máy hoặc link Drive riêng) vào thư mục chung của phòng,
   AI đọc ngay, xem kết quả. Máy chủ: /api/nop (document_search_api/lib/nop.js).
   Khung nằm ngoài #man nên vẽ lại trang không làm mất file đang tải.
   ===================================================================== */
(function () {
  'use strict';
  var API = (/^(localhost|127\.0\.0\.1)$/.test(location.hostname) && location.port === '8080' ? location.origin : 'https://document-search-api-319700450833.us-central1.run.app') + '/api/nop';
  var N = { ct: '', pb: '', cach: 'may', du: null, loi: '', dangTai: false, tai: [], bao: [], hang: [], dangDoc: '', mo: '', kq: {} };
  var khung = null, henTai = null;
  var $n = function (s) { return khung.querySelector(s); };
  try { var luu = (localStorage.getItem('vt_nop_pv') || '').split('|'); N.ct = luu[0] || ''; N.pb = luu[1] || ''; } catch (e) {}

  var CHIP = { 'Đã đọc': 'xong', 'Đang đọc': 'dang', 'Chờ đọc': 'cho', 'Chờ lượt': 'luot', 'Lỗi': 'loi', 'Bỏ qua': 'luot', 'Trùng': 'cho' };
  var linkXem = function (id) { return 'https://drive.google.com/file/d/' + encodeURIComponent(id) + '/view'; };
  var mb = function (n) { return n >= 10 ? Math.round(n) + ' MB' : (Math.round(n * 10) / 10).toLocaleString('vi-VN') + ' MB'; };

  function goi(than) {
    return fetch(API, than ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(than) } : { cache: 'no-store' })
      .then(function (r) { return r.json(); }).then(function (j) { if (!j.ok) { var e = new Error(j.loi || 'Máy chủ lỗi'); e.dang = j.dang; throw e; } return j.data; });
  }
  function napDs() {
    N.dangTai = true;
    return goi().then(function (d) { N.du = d; N.loi = ''; }).catch(function (e) { N.loi = e.message; }).then(function () { N.dangTai = false; ve(); });
  }
  function phongDangChon() { return N.du && N.du.cauHinh.filter(function (x) { return x.congTy === N.ct && x.phong === N.pb; })[0]; }
  function duNhan() { var p = phongDangChon(); return !!(p && p.sanSang); }

  /* ---------- AI đọc: lần lượt từng file ---------- */
  function xepDoc(ma) { if (N.dangDoc !== ma && N.hang.indexOf(ma) < 0) N.hang.push(ma); docTiep(); }
  function docTiep() {
    if (N.dangDoc || !N.hang.length) { ve(); return; }
    var ma = N.dangDoc = N.hang.shift(); delete N.kq[ma]; ve();
    var henLai = setTimeout(napDs, 1500);                               // để thấy trạng thái "Đang đọc"
    goi({ lenh: 'doc', ma: ma }).then(function (d) {
      if (d.trangThai === 'Đã đọc' && !N.mo) moKetQua(ma);
      if (d.trangThai === 'Chờ lượt') N.hang = [];                      // hết lượt: khỏi gọi tiếp các file sau
    }).catch(function (e) { N.bao.push({ loai: 'loi', chu: e.message }); })
      .then(function () { clearTimeout(henLai); N.dangDoc = ''; return napDs(); }).then(docTiep);
  }
  function moKetQua(ma) {
    N.mo = ma;
    if (!N.kq[ma]) fetch(API + '?ma=' + encodeURIComponent(ma), { cache: 'no-store' }).then(function (r) { return r.json(); })
      .then(function (j) { if (!j.ok) throw new Error(j.loi); N.kq[ma] = j.data; ve(); })
      .catch(function (e) { N.mo = ''; N.bao.push({ loai: 'loi', chu: 'Không xem được kết quả: ' + e.message }); ve(); });
    ve();
  }

  /* ---------- nộp từ máy: trình duyệt gửi file thẳng lên Drive ---------- */
  function chonFile(ds) {
    N.bao = [];
    Array.prototype.slice.call(ds).forEach(function (f, i) {
      if (!/\.pdf$/i.test(f.name)) { N.bao.push({ loai: 'loi', chu: f.name + ': chỉ nhận file PDF' }); return; }
      if (i >= N.du.gioiHan.moiLan) { N.bao.push({ loai: 'loi', chu: f.name + ': mỗi lần chỉ nộp ' + N.du.gioiHan.moiLan + ' file' }); return; }
      N.tai.push({ f: f, ct: N.ct, pb: N.pb, pt: 0, tt: 'cho' });
    });
    taiTiep(); ve();
  }
  function taiTiep() {
    if (N.tai.some(function (x) { return x.tt === 'dang'; })) return;
    var x = N.tai.filter(function (y) { return y.tt === 'cho'; })[0]; if (!x) return;
    x.tt = 'dang'; ve();
    goi({ lenh: 'taiLen', congTy: x.ct, phong: x.pb, ten: x.f.name, kichThuoc: x.f.size }).then(function (d) {
      return new Promise(function (xong, hong) {
        var r = new XMLHttpRequest();
        r.open('PUT', d.url); r.setRequestHeader('Content-Type', 'application/pdf');
        r.upload.onprogress = function (e) { if (!e.lengthComputable) return; x.pt = Math.round(e.loaded * 100 / e.total); var o = khung.querySelector('[data-pt="' + N.tai.indexOf(x) + '"]'); if (o) o.textContent = x.pt + '%'; };
        r.onload = function () { var j = {}; try { j = JSON.parse(r.responseText); } catch (e) {} if (r.status < 300 && j.id) xong(j.id); else hong(new Error('Google Drive không nhận file (' + r.status + ')')); };
        r.onerror = function () { hong(new Error('Mất kết nối khi đang tải lên')); };
        r.send(x.f);
      });
    }).then(function (fileId) { return goi({ lenh: 'ghiNhan', congTy: x.ct, phong: x.pb, fileId: fileId }); }).then(function (d) {
      N.tai.splice(N.tai.indexOf(x), 1);
      if (d.trangThai === 'Trùng') N.bao.push({ loai: 'nhac', chu: d.ten + ': ' + d.ghiChu });
      return napDs().then(function () { if (d.trangThai === 'Chờ đọc') xepDoc(d.ma); });
    }).catch(function (e) { x.tt = 'loi'; x.loi = e.message; }).then(function () { ve(); taiTiep(); });
  }

  /* ---------- nộp bằng link ---------- */
  function guiLink() {
    var o = $n('#nopLink'), ds = o.value.split(/\s+/).filter(Boolean);
    if (!ds.length) { o.focus(); return; }
    N.bao = []; N.dangLink = true; ve();
    var ct = N.ct, pb = N.pb, hong = [];
    ds.reduce(function (p, link) {
      return p.then(function () {
        return goi({ lenh: 'lienKet', congTy: ct, phong: pb, link: link }).then(function (d) {
          d.boQua.forEach(function (b) { N.bao.push({ loai: 'nhac', chu: b.ten + ': ' + b.lyDo }); });
          if (d.conLai) N.bao.push({ loai: 'nhac', chu: 'Còn ' + d.conLai + ' file trong thư mục chưa nhận (mỗi lần ' + N.du.gioiHan.moiLan + ' file). Gửi lại link để nhận tiếp.' });
          if (d.them.length) N.bao.push({ loai: 'ok', chu: 'Đã chép ' + d.them.length + ' file vào thư mục ' + pb + ' · ' + ct });
          d.them.forEach(function (x) { xepDoc(x.ma); });
        }).catch(function (e) { hong.push(link); N.bao.push({ loai: 'loi', chu: e.message }); });
      });
    }, Promise.resolve()).then(function () { N.dangLink = false; var o2 = $n('#nopLink'); if (o2) o2.value = hong.join('\n'); N.nhap = hong.join('\n'); return napDs(); });
  }

  /* ---------- vẽ ---------- */
  function chonPv() {
    var ct = ['CRCK2', 'BHCK'], pb = ['TCHC', 'KHĐT', 'TCKT', 'KTNN'];
    var o = function (id, nhan, ds, v) { return '<label class="nop-nhan">' + nhan + '<select class="o" id="' + id + '"><option value="">Chọn…</option>' + ds.map(function (x) { return '<option' + (x === v ? ' selected' : '') + '>' + x + '</option>'; }).join('') + '</select></label>'; };
    return o('nopCt', 'Công ty', ct, N.ct) + o('nopPb', 'Phòng', pb, N.pb);
  }
  function veGui() {
    if (!N.du) return '<p class="nop-ghi">' + (N.loi ? 'Không kết nối được máy chủ: ' + esc(N.loi) + ' <button type="button" class="nut" data-nop="tailai">Thử lại</button>' : 'Đang kết nối…') + '</p>';
    var p = phongDangChon(), chua = !N.du.cauHinh.some(function (x) { return x.sanSang; });
    if (chua) return '<div class="nop-canh"><b>Chưa có thư mục nhận file nên chưa nộp được.</b> Quản trị tạo một thư mục trong bộ nhớ dùng chung, chia sẻ quyền <b>Người đóng góp</b> cho <code>' + esc(N.du.emailMay) + '</code>, rồi dán link thư mục vào tab <b>TN_NOP_THU_MUC</b> của sheet lưu trữ. <button type="button" class="nut" data-nop="tailai">Kiểm tra lại</button></div>';
    if (!p) return '<p class="nop-ghi">Chọn công ty và phòng để nộp.</p>';
    if (!p.sanSang) return '<div class="nop-canh">Phòng ' + esc(N.pb) + ' · ' + esc(N.ct) + ' chưa nhận file được: ' + esc(p.lyDo) + '.</div>';
    var tab = '<div class="seg" role="group" aria-label="Cách nộp"><button type="button" class="' + (N.cach === 'may' ? 'chon' : '') + '" data-cach="may">Từ máy</button><button type="button" class="' + (N.cach === 'link' ? 'chon' : '') + '" data-cach="link">Gửi link Drive</button></div>';
    var than = N.cach === 'may'
      ? '<label class="nop-tha" id="nopTha"><b>Kéo thả file PDF vào đây</b><span>hoặc bấm để chọn file · tối đa ' + N.du.gioiHan.moiLan + ' file mỗi lần, mỗi file dưới ' + N.du.gioiHan.mb + ' MB</span><input type="file" id="nopFile" accept="application/pdf,.pdf" multiple></label>'
      : '<label class="nop-nhan">Link file hoặc thư mục (mỗi dòng một link)<textarea class="o" id="nopLink" rows="3" placeholder="https://drive.google.com/file/d/…&#10;https://drive.google.com/drive/folders/…"' + (N.dangLink ? ' disabled' : '') + '>' + esc(N.nhap || '') + '</textarea></label>' +
        '<p class="nop-ghi">Máy phải xem được file: chia sẻ quyền Xem cho <code>' + esc(N.du.emailMay) + '</code> <button type="button" class="nut" data-nop="chep">Sao chép</button> hoặc bật "Bất kỳ ai có đường liên kết".</p>' +
        '<div><button type="button" class="nut chinh" data-nop="guilink"' + (N.dangLink ? ' disabled' : '') + '>' + (N.dangLink ? 'Đang chép file…' : 'Nộp và cho AI đọc') + '</button></div>';
    return tab + than + '<p class="nop-ghi">File được <b>chép</b> vào thư mục chung của phòng, bản gốc của bạn vẫn giữ nguyên. Hôm nay còn nhận ' + N.du.conTrongNgay + ' file.</p>';
  }
  function veTai() {
    return N.tai.map(function (x, i) {
      return '<div class="nop-tai"><span class="ten">' + esc(x.f.name) + ' <small>' + mb(x.f.size / 1048576) + ' · ' + esc(x.pb + ' · ' + x.ct) + '</small></span>' +
        (x.tt === 'dang' ? '<span data-pt="' + i + '">' + x.pt + '%</span>' : x.tt === 'loi' ? '<span class="nop-loi">' + esc(x.loi) + '</span><button type="button" class="nut" data-tailai="' + i + '">Thử lại</button><button type="button" class="nut" data-bo="' + i + '">Bỏ</button>' : '<span>Chờ tải</span>') + '</div>';
    }).join('');
  }
  function veKetQua(ma) {
    var k = N.kq[ma]; if (!k) return '<div class="nop-kq">Đang đọc kết quả…</div>';
    var vb = k.dong.filter(function (d) { return d.loai_dong === 'Văn bản'; }), bo = k.dong.filter(function (d) { return d.loai_dong === 'Bộ hồ sơ'; })[0];
    if (!vb.length) return '<div class="nop-kq">Không có văn bản nào được trích.</div>';
    var o = function (n, v) { return v ? '<dt>' + n + '</dt><dd>' + esc(v) + '</dd>' : ''; };
    return '<div class="nop-kq">' + (bo ? '<p><b>' + esc(bo.ten_bo_ho_so) + '</b> · ' + vb.length + ' văn bản</p>' : '') + vb.map(function (d) {
      return '<article><h4>' + esc([d.loai_vb_ten, d.so_ky_hieu].filter(Boolean).join(' · ') || 'Văn bản') + '</h4><p>' + esc(d.trich_yeu) + '</p><dl>' +
        o('Ngày', d.ngay_vb.split('-').reverse().join('/')) + o('Cơ quan ban hành', d.co_quan_ban_hanh) + o('Đối tác / nơi nhận', d.ben_nhan_doi_tac) + o('Người ký', d.nguoi_ky) +
        o('Giá trị', d.so_tien ? d.so_tien + ' ' + d.don_vi_tien : '') + o('Trang trong file', d.trang_tu ? d.trang_tu + (d.trang_den && d.trang_den !== d.trang_tu ? '–' + d.trang_den : '') : '') + '</dl>' +
        (d.canh_bao ? '<small>Cần soát: ' + esc(d.canh_bao.split(';').map(function (c) { c = c.trim(); return CANH[c.split(' ')[0]] || c; }).join(' · ')) + '</small>' : '') + '</article>';
    }).join('') + '</div>';
  }
  var CANH = { so_hieu_khong_ro: 'số hiệu chưa rõ', ngay_khong_ro: 'ngày chưa rõ', so_tien_khong_ro: 'số tiền chưa rõ', chat_luong_scan_kem: 'bản scan kém', do_tin_cay_thap: 'độ tin cậy thấp', loai_chua_co_trong_danh_muc: 'loại chưa có trong danh mục', nhieu_van_ban_trong_file: 'file có nhiều văn bản', nghi_nham_nguoi_dai_dien: 'có thể nhầm người đại diện', dung_doc_som: 'AI chưa đọc hết file', doc_mot_phan: 'AI mới đọc một phần' };
  function veDs() {
    if (!N.du) return '';
    if (!N.du.ds.length) return '<div class="the rong">Chưa có hồ sơ nào được nộp.</div>';
    return '<div class="the nop-ds">' + N.du.ds.map(function (d) {
      var dang = N.dangDoc === d.ma, cho = N.hang.indexOf(d.ma) >= 0, tt = dang ? 'Đang đọc' : d.trangThai, ma = esc(d.ma);
      var nut = tt === 'Đã đọc' ? '<button type="button" class="nut" data-xem="' + ma + '" aria-expanded="' + (N.mo === d.ma) + '">' + (N.mo === d.ma ? 'Đóng' : 'Xem kết quả') + '</button>'
        : /Chờ đọc|Chờ lượt|Lỗi|Đang đọc/.test(tt) && !dang && !cho ? '<button type="button" class="nut" data-doc="' + ma + '">' + (tt === 'Lỗi' ? 'Đọc lại' : 'Đọc') + '</button>' : '';
      return '<div class="nop-dong"><div class="ten"><a href="' + linkXem(d.fileId) + '" target="_blank" rel="noopener">' + esc(d.ten) + '</a><small>' + esc(d.luc.slice(8, 10) + '/' + d.luc.slice(5, 7) + ' ' + d.luc.slice(11, 16)) + ' · ' + esc(d.phong + ' · ' + d.congTy) + ' · ' + esc(d.nguon) + ' · ' + mb(d.mb) + '</small>' +
        (d.ghiChu && !dang ? '<small class="nop-ghichu">' + esc(d.ghiChu) + '</small>' : '') + '</div><span class="nop-tt ' + (cho ? 'cho' : CHIP[tt] || 'cho') + '">' + (cho ? 'Xếp hàng' : esc(tt) + (tt === 'Đã đọc' ? ' · ' + d.soVb + ' văn bản' : '')) + '</span>' + nut + '</div>' + (N.mo === d.ma ? veKetQua(d.ma) : '');
    }).join('') + '</div>';
  }
  function ve() {
    if (!khung || khung.hidden) return;
    var o = $n('#nopLink'); if (o) N.nhap = o.value;
    var dangGo = document.activeElement && document.activeElement.id === 'nopLink', vt = dangGo ? document.activeElement.selectionStart : 0;
    $n('#nopPv').innerHTML = chonPv();
    $n('#nopGui').innerHTML = veGui();
    $n('#nopTai').innerHTML = veTai();
    $n('#nopBao').innerHTML = N.bao.map(function (b) { return '<p class="nop-bao ' + b.loai + '">' + esc(b.chu) + '</p>'; }).join('') +
      (N.dangDoc ? '<p class="nop-bao nhac">AI đang đọc, mỗi file khoảng 1 phút (file dày lâu hơn). Giữ trang này mở.</p>' : '');
    $n('#nopDs').innerHTML = veDs();
    if (dangGo && $n('#nopLink')) { $n('#nopLink').focus(); $n('#nopLink').setSelectionRange(vt, vt); }
  }

  function dung() {
    khung = document.createElement('div'); khung.id = 'khungNop'; khung.className = 'nop';
    khung.innerHTML = '<section class="the nop-tren"><div class="nop-pv" id="nopPv"></div><div id="nopGui"></div><div id="nopTai"></div><div id="nopBao" role="status"></div></section>' +
      '<div class="nop-dau"><h3>Hồ sơ đã nộp</h3><button type="button" class="nut" data-nop="tailai">Tải lại</button></div><div id="nopDs"></div>';
    document.getElementById('man').parentNode.appendChild(khung);
    khung.addEventListener('change', function (e) {
      var t = e.target;
      if (t.id === 'nopCt' || t.id === 'nopPb') { N[t.id === 'nopCt' ? 'ct' : 'pb'] = t.value; N.bao = []; try { localStorage.setItem('vt_nop_pv', N.ct + '|' + N.pb); } catch (x) {} ve(); }
      else if (t.id === 'nopFile' && t.files.length && duNhan()) chonFile(t.files);
    });
    ['dragover', 'drop'].forEach(function (loai) {
      khung.addEventListener(loai, function (e) {
        if (!e.target.closest('#nopTha')) return;
        e.preventDefault();
        if (loai === 'drop' && duNhan()) chonFile(e.dataTransfer.files);
      });
    });
    khung.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      var d = b.dataset;
      if (d.cach) { N.cach = d.cach; N.bao = []; ve(); }
      else if (d.nop === 'tailai') napDs();
      else if (d.nop === 'guilink') guiLink();
      else if (d.nop === 'chep') { navigator.clipboard.writeText(N.du.emailMay).then(function () { b.textContent = 'Đã chép'; }); }
      else if (d.doc) xepDoc(d.doc);
      else if (d.xem) { if (N.mo === d.xem) { N.mo = ''; ve(); } else moKetQua(d.xem); }
      else if (d.tailai !== undefined) { N.tai[d.tailai].tt = 'cho'; taiTiep(); ve(); }
      else if (d.bo !== undefined) { N.tai.splice(Number(d.bo), 1); ve(); }
    });
    window.addEventListener('beforeunload', function (e) { if (N.dangDoc || N.dangLink || N.tai.some(function (x) { return x.tt === 'dang'; })) { e.preventDefault(); e.returnValue = ''; } });
  }

  window.NOPHOSO = {
    hien: function (co) {
      if (!co) { if (khung) khung.hidden = true; clearInterval(henTai); henTai = null; return; }
      var moLai = !khung || khung.hidden;
      if (!khung) dung();
      khung.hidden = false;
      clearTimeout(window._tgCao); document.getElementById('man').style.minHeight = '';
      ve();
      if (moLai) napDs();
      // người khác nộp hoặc file đang đọc ở máy khác: làm mới mỗi 30 giây khi còn file chưa xong
      if (!henTai) henTai = setInterval(function () { if (!document.hidden && !N.dangTai && N.du && N.du.ds.some(function (d) { return d.trangThai === 'Đang đọc'; })) napDs(); }, 30000);
    }
  };
})();
