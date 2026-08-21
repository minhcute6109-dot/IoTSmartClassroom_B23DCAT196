CHỈNH SỬA HAI TRANG:
1. Dữ liệu cảm biến (Data Sensor)
2. Lịch sử hoạt động (Action History)

GIỮ NGUYÊN:
- Light Theme, nền trắng.
- Sidebar, Header và Navigation hiện tại.
- Font chữ, màu sắc, icon và Design System hiện tại.
- Không thay đổi Dashboard và Profile.
- Không tạo thêm trang mới.
- Không thay đổi logic dữ liệu.

==================================================
1. YÊU CẦU CHUNG CHO CẢ HAI TRANG
==================================================

Mục tiêu quan trọng:
Trong một màn hình desktop 1440x900, toàn bộ phần bảng dữ liệu phải hiển thị vừa đủ để người dùng nhìn thấy các bản ghi mà KHÔNG CẦN CUỘN TRANG DỌC.

Không được để bảng có chiều cao vượt quá phần nội dung của màn hình.

Thiết kế bảng theo dạng:
- Header bảng cố định trong card.
- Số lượng bản ghi hiển thị trên mỗi trang vừa đủ cho một màn hình.
- Có phân trang ở cuối bảng.
- Không cần thanh cuộn dọc để xem các bản ghi trong trang hiện tại.

Ưu tiên hiển thị khoảng 8–10 bản ghi trên một trang tùy kích thước thực tế của bảng.

Nếu nội dung quá dài:
- Giảm khoảng cách giữa các dòng một cách hợp lý.
- Giảm chiều cao từng row.
- Điều chỉnh chiều cao bảng.
- Không làm chữ quá nhỏ gây khó đọc.

Phân trang xử lý phần dữ liệu còn lại.

==================================================
2. TRANG DATA SENSOR
==================================================

Tiêu đề:
Data Sensor
Dữ liệu cảm biến

Bảng hiển thị dữ liệu theo TỪNG BẢN GHI.

Các cột:

Mã bản ghi
Tên cảm biến
Loại cảm biến
Giá trị
Đơn vị
Thời gian
Chất lượng

Ví dụ:

001 | Cảm biến nhiệt độ | Nhiệt độ | 28.4 | °C | 21/08/2026 13:45:32 | Hợp lệ

002 | Cảm biến độ ẩm | Độ ẩm | 55.2 | % | 21/08/2026 13:45:32 | Hợp lệ

003 | Cảm biến ánh sáng | Ánh sáng | 249.1 | lux | 21/08/2026 13:45:32 | Hợp lệ

004 | Cảm biến khí CO₂ | Nồng độ CO₂ | 620 | ppm | 21/08/2026 13:45:35 | Hợp lệ

Có thể hiển thị thêm một số bản ghi không hợp lệ để minh họa.

Nếu "Chất lượng = Không hợp lệ":
- hiển thị badge màu đỏ.
- cho phép bấm vào badge để xem chi tiết lỗi trong Modal.

==================================================
3. TÌM KIẾM DATA SENSOR
==================================================

Phía trên bảng chỉ có:

[ 🔍 Tìm kiếm dữ liệu ]   [ Bộ lọc chi tiết ]

Không trải các trường lọc ngày/tháng/năm/giờ/phút/giây trực tiếp trên thanh tìm kiếm.

Khi bấm "Bộ lọc chi tiết", mở Modal hoặc Panel.

Có các trường:

- Thứ
- Ngày
- Tháng
- Năm
- Giờ
- Phút
- Giây
- Cảm biến
- Chất lượng

Tất cả các trường có thể để "Tất cả".

Không sử dụng bộ lọc "Từ ngày - Đến ngày".

Có:
[ Đặt lại ] [ Tìm kiếm ]

==================================================
4. TRANG ACTION HISTORY
==================================================

Tiêu đề:
Action History
Lịch sử hoạt động

Bảng gồm:

Mã
Thiết bị
Hành động
Thời gian

Ví dụ:

060 | Quạt | ON  | 21/08/2026 13:26:55
059 | Điều hòa | ON | 21/08/2026 13:20:21
058 | Đèn | ON | 21/08/2026 13:15:09
057 | Đèn | ON | 21/08/2026 13:10:37
056 | Đèn | OFF | 21/08/2026 13:06:49
055 | Quạt | ON | 21/08/2026 13:01:45

Status:
- ON: màu xanh lá
- OFF: màu xám

Tên thiết bị:
- Đèn
- Quạt
- Điều hòa

==================================================
5. TÌM KIẾM CHI TIẾT ACTION HISTORY
==================================================

Phía trên bảng chỉ hiển thị:

[ 🔍 Tìm kiếm lịch sử ]   [ Bộ lọc chi tiết ]

Không đặt nhiều trường trực tiếp trên thanh tìm kiếm.

Khi bấm "Bộ lọc chi tiết", mở Modal.

Các điều kiện lọc:

THỜI GIAN:
- Thứ
- Ngày
- Tháng
- Năm
- Giờ
- Phút
- Giây

THIẾT BỊ:
- Tất cả
- Đèn
- Quạt
- Điều hòa

HÀNH ĐỘNG:
- Tất cả
- ON
- OFF

Các trường thời gian không bắt buộc.
"Tất cả" nghĩa là không áp dụng điều kiện đó.

Có:
[ Đặt lại ] [ Tìm kiếm ]

Ví dụ người dùng có thể tìm:
- Tất cả thao tác vào Thứ 2.
- Tất cả thao tác ngày 21/08/2026.
- Tất cả thao tác của Đèn.
- Tất cả thao tác ON của Quạt vào 13:45:32.
- Kết hợp nhiều điều kiện cùng lúc.

==================================================
6. PHÂN TRANG
==================================================

Ở cuối cả hai bảng hiển thị:

"Hiển thị 1–10 trên X bản ghi"

Có các nút:

[ Trước ] [ 1 ] [ 2 ] [ 3 ] ... [ Sau ]

Không tạo scroll dọc trong trang hiện tại.

Nếu có nhiều dữ liệu hơn:
→ chuyển sang trang tiếp theo bằng Pagination.

==================================================
7. KÍCH THƯỚC VÀ BỐ CỤC
==================================================

Desktop:
1440x900

Phần tiêu đề và bộ lọc chiếm ít chiều cao.

Bảng chiếm phần lớn diện tích còn lại.

Mỗi trang phải đạt yêu cầu:
- nhìn thấy toàn bộ bảng trong một màn hình.
- khoảng 8–10 bản ghi trong trang hiện tại.
- thanh phân trang luôn nằm ở cuối card.
- không cần cuộn xuống để nhìn bản ghi cuối cùng.

Không làm font quá nhỏ.
Không làm row quá cao.
Không để khoảng trắng thừa giữa các dòng.

==================================================
8. LIGHT THEME
==================================================

Background:
- trắng
- trắng xám rất nhạt

Card:
- trắng
- border xám nhẹ
- shadow rất nhẹ

Text:
- tiêu đề xanh đậm/đen
- nội dung xám đậm

Màu dữ liệu:
- Nhiệt độ: đỏ
- Độ ẩm: xanh dương
- Ánh sáng: vàng
- Hợp lệ: xanh lá
- Không hợp lệ: đỏ

GIỮ TOÀN BỘ TEXT TRÊN GIAO DIỆN BẰNG TIẾNG VIỆT NGOẠI TRỪ TÊN TRANG SONG NGỮ:
- Dashboard / Bảng điều khiển
- Data Sensor / Dữ liệu cảm biến
- Action History / Lịch sử hoạt động
- Profile / Hồ sơ

==================================================
9. KẾT QUẢ MONG MUỐN
==================================================

Hai trang Data Sensor và Action History phải có cảm giác là cùng một hệ thống.

Mỗi trang:
- Không cần cuộn dọc để xem các bản ghi trong trang hiện tại.
- Có tìm kiếm nhanh.
- Có một nút "Bộ lọc chi tiết".
- Có Modal lọc thời gian chi tiết đến giây.
- Có phân trang.
- Bảng gọn, rõ ràng, dễ đọc.