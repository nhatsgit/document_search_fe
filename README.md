# Tra cứu lưu trữ: giao diện

Trang tra cứu tài liệu số hoá CRCK2 / BHCK. Một file [index.html](index.html), không cần build, phong cách giống
dashboard "Quản trị hợp nhất". Dữ liệu lấy từ API [document_search_api](https://github.com/nhatsgit/document_search_api).

- **Mỗi tab là 1 phòng:** sidebar liệt kê Toàn bộ kho / TCHC / TCKT / KHĐT / KTNN kèm số văn bản; trong mỗi phòng có
  3 trang con (tab ngang): Tìm kiếm · Bộ hồ sơ · Tổng quan. Địa chỉ dạng `#/tckt/tim?q=...` (link cũ `#/tim?...` vẫn mở được).
- **Tìm kiếm văn bản:** gõ có dấu hay không dấu, số hiệu, tên đối tác… Bảng kết quả rộng hết màn hình; nút **Bộ lọc**
  mở popup (máy tính: nhiều cột; điện thoại: trượt từ dưới lên) có số đếm (phòng, công ty, loại, năm, cơ quan, tên hồ sơ,
  thùng / thư mục, pháp lý, đơn vị tiền), khoảng ngày, khoảng giá trị. Chọn tới đâu kết quả cập nhật tới đó. Sắp xếp, xuất Excel.
- **Chi tiết văn bản:** xem PDF ngay trong trang, toàn bộ thông tin đã trích, vị trí trên sheet (sheet + dòng),
  bộ hồ sơ liên quan theo dòng thời gian, bản nghi trùng, gợi ý văn bản có thể liên quan.
- **Bộ hồ sơ liên quan:** hợp đồng / quyết định và mọi chứng từ nhắc tới nó (phiếu chi, phiếu xuất kho, thanh lý…).
- **Tổng quan kho:** số văn bản theo năm, loại, cơ quan, đối tác; chất lượng dữ liệu. Bấm vào số liệu thì sang danh sách tương ứng.

Mọi trạng thái (từ khoá, bộ lọc, văn bản đang mở) nằm trên địa chỉ trang, nên gửi link cho đồng nghiệp là mở đúng chỗ.
Phím `/` để tìm, `Esc` để đóng. Mặc định giao diện sáng (nút ◐ để đổi). Tối ưu cho điện thoại: vùng bấm ≥ 36px,
ô nhập 16px (iOS không tự phóng to), không tràn ngang ở 375px.

## Địa chỉ API

Trong `index.html`:

```js
var API_CLOUD_RUN = '';   // điền 'https://<service>.run.app/api/exec' sau khi deploy Cloud Run
```

- Mở trang từ `http://localhost:8080` (API chạy trên máy phục vụ luôn trang): tự gọi cùng địa chỉ.
- Thử API khác mà không sửa code: thêm `?api=https://.../api/exec` vào địa chỉ trang (trình duyệt nhớ lại);
  `?api=mac-dinh` để bỏ.

## Chạy trên máy

Đặt repo này cạnh `document_search_api`, rồi trong thư mục API:

```bash
npm run dev
```

Mở http://localhost:8080.

## GitHub Pages

Repo → **Settings → Pages → Deploy from a branch → `main` / `(root)`**. Trang sẽ ở
`https://nhatsgit.github.io/document_search_fe/`. Nhớ điền `API_CLOUD_RUN` trước khi push.

PDF mở bằng trình xem của Google Drive: người xem cần đăng nhập Google trên trình duyệt và được chia sẻ quyền xem
file. Khi API bật proxy PDF (`BAT_PROXY_PDF=1`), trang tự chuyển sang tải PDF qua API.
