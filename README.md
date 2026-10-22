# Hệ thống Quản trị và Giám sát Phòng học Thông minh (IoT Smart Classroom)

> **Học phần:** IOT và ứng dụng  
> **Sinh viên thực hiện:** Nguyễn Anh Minh  
> **Mã sinh viên:** B23DCAT196  
> **Lớp:** D23CQAT01-B  
> **Khoa:** An toàn Thông tin – Học viện Công nghệ Bưu chính Viễn thông (PTIT)  
> **Giảng viên hướng dẫn:** TS. Nguyễn Quốc Uy  

[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.2-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-v20-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express.js-v4.19-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql&logoColor=white)](https://www.mysql.com/)
[![MQTT](https://img.shields.io/badge/MQTT-HiveMQ_Cloud_TLS_8883-660066?logo=mqtt&logoColor=white)](https://www.hivemq.com/)
[![ESP32-C3](https://img.shields.io/badge/MCU-ESP32--C3_RISC--V-E7352C?logo=espressif&logoColor=white)](https://www.espressif.com/)

---

## 1. Giới thiệu tổng quan đề tài

Hệ thống **IoT Smart Classroom** được thiết kế và hiện thực hóa khép kín từ tầng mạch phần cứng vi điều khiển thu thập dữ liệu biên, tầng trung gian truyền thông bảo mật qua giao thức MQTT TLS, tầng máy chủ xử lý tập trung Node.js/Express, cơ sở dữ liệu quan hệ MySQL cho đến giao diện trang web quản trị thời gian thực React 19.

### Các tính năng cốt lõi:
- **Giám sát vi khí hậu thời gian thực:** Thu thập các thông số Nhiệt độ (°C), Độ ẩm (% RH) và Cường độ ánh sáng (lux) định kỳ mỗi 1.5 giây, trực quan hóa trên các thẻ đo tức thời và biểu đồ Recharts liên tục.
- **Điều khiển thiết bị độc lập & Phản hồi thực tế:** Hỗ trợ bật/tắt từ xa 3 thiết bị điện (Đèn, Quạt, Điều hòa mô phỏng qua 3 LED 5mm nối điện trở hạn dòng riêng 220Ω).
- **Cơ chế Watchdog Timeout 2.5 giây:** Xử lý triệt để ngoại lệ phần cứng ngắt kết nối (rút cáp, mất Wi-Fi); tự động hủy trạng thái chờ, bảo vệ trạng thái an toàn trên web và ghi nhận lỗi FAILED trong lịch sử.
- **Bảo toàn trạng thái PENDING qua F5:** Sử dụng Store quản lý tập trung kết hợp localStorage để công tắc tiếp tục đếm nốt thời gian chờ ngay cả khi người dùng chuyển trang hoặc tải lại trình duyệt.
- **Tra cứu, Lọc đa tiêu chí & Sắp xếp đa chiều:** Hỗ trợ lọc theo loại cảm biến, tìm kiếm nhanh linh hoạt, sắp xếp hai chiều (ASC/DESC) trực tiếp trên tiêu đề cột.
- **Phân trang động thông minh:** Cho phép người dùng tùy ý nhập số lượng bản ghi hiển thị trên mỗi trang (pageSize = 10, 20, 50, 100...) và nhập số trang để chuyển nhanh (Jump to page).

---

## 2. Kiến trúc hệ thống và Luồng dữ liệu

Hệ thống được tổ chức theo mô hình phân tầng:

```
┌────────────────────────────────────────────────────────┐
│               WEB FRONTEND (React 19 + TS)             │
│   Dashboard  |  Data Sensor  |  Action History  |  Profile│
└──────────────┬────────────────────────▲────────────────┘
   HTTP REST   │                        │ WebSocket
   (Port 8443) │                        │ (Socket.IO)
┌──────────────▼────────────────────────┴────────────────┐
│               BACKEND SERVER (Node.js/Express)         │
│  Controllers  |  Services  |  Watchdog Timeout 2.5s     │
└──────────────┬────────────────────────▲────────────────┘
   MySQL Query │                        │ MQTT TLS (Port 8883)
┌──────────────▼──────┐       ┌─────────┴────────────────┐
│  DATABASE (MySQL 8) │       │   MQTT BROKER (HiveMQ)   │
│  5 bảng chuẩn hóa   │       │   3 Topic chuẩn hóa      │
└─────────────────────┘       └─────────▲────────────────┘
                                        │ Wi-Fi 802.11 b/g/n
                              ┌─────────┴────────────────┐
                              │  HARDWARE (ESP32-C3)     │
                              │  DHT11, BH1750, 3 LED    │
                              └──────────────────────────┘
```

### 3 Topic MQTT chuẩn hóa:
1. `Data_Sensors`: Kênh ESP32 gửi dữ liệu cảm biến định kỳ mỗi 1.5 giây lên Backend.
2. `Device_control`: Kênh Backend phát lệnh điều khiển `{ action_id, device_id, action }` xuống ESP32.
3. `Device_Response`: Kênh ESP32 gửi bản tin xác nhận trạng thái thực tế lên Backend sau khi chuyển mức logic GPIO.

---

## 3. Sơ đồ đấu nối phần cứng (Hardware Pinout)

Vi điều khiển trung tâm: **ESP32-C3 Super Mini (Kiến trúc 32-bit RISC-V 160MHz)**

| Linh kiện / Thiết bị | Chân trên Module | Chân GPIO ESP32-C3 | Điện áp hoạt động | Ghi chú kỹ thuật |
| :--- | :---: | :---: | :---: | :--- |
| **Cảm biến DHT11** | DATA (OUT) | **GPIO 0** | 3.3V – 5V | Chuẩn giao tiếp 1-Wire Single-bus |
| **Cảm biến BH1750** | SDA | **GPIO 8** | 3.3V – 5V | Chuẩn giao tiếp I2C, địa chỉ `0x23` |
| **Cảm biến BH1750** | SCL | **GPIO 9** | 3.3V – 5V | Chuẩn giao tiếp I2C |
| **LED 1 (Đỏ - Mô phỏng Đèn)** | Anode (+) | **GPIO 3** | 2.0V – 2.2V | Mắc nối tiếp điện trở riêng 220Ω |
| **LED 2 (Xanh lá - Mô phỏng Quạt)** | Anode (+) | **GPIO 1** | 3.0V – 3.2V | Mắc nối tiếp điện trở riêng 220Ω |
| **LED 3 (Xanh dương - Mô phỏng ĐH)** | Anode (+) | **GPIO 10** | 3.0V – 3.2V | Mắc nối tiếp điện trở riêng 220Ω |
| **GND chung** | Cathode (-) | **GND** | 0V | Nối chung toàn bộ mass mạch |

> [!CAUTION]
> **Quy tắc an toàn điện:** Mỗi đèn LED rời 5mm **bắt buộc phải mắc nối tiếp một điện trở hạn dòng riêng** (220Ω – 330Ω) để bảo vệ an toàn cho cổng GPIO của vi điều khiển ESP32-C3. Không nối trực tiếp LED vào GPIO hoặc dùng chung một điện trở cho nhiều LED.

---

## 4. Thiết kế cơ sở dữ liệu MySQL

Cơ sở dữ liệu được chuẩn hóa đạt **Đệ tam chuẩn (3NF)** gồm đúng 5 bảng quan hệ:

1. **`Users`**: Lưu trữ thông tin định danh sinh viên/người dùng và các đường dẫn tài liệu dự án.
2. **`Devices`**: Quản lý danh mục 3 thiết bị (`device_id`: 1 - Đèn, 2 - Quạt, 3 - Điều hòa) và trạng thái ON/OFF hiện tại.
3. **`Sensors`**: Quản lý danh mục 3 cảm biến (`sensor_id`: 1 - Nhiệt độ, 2 - Độ ẩm, 3 - Ánh sáng) và đơn vị tính (°C, %, lux).
4. **`DataSensor` (4 cột chuẩn tối ưu)**:
   - `data_id` (PK, INT AUTO_INCREMENT)
   - `sensor_id` (FK, INT, REFERENCES Sensors)
   - `value` (DECIMAL(6,2))
   - `recorded_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)
5. **`Action`**: Nhật ký toàn bộ tiến trình điều khiển thiết bị:
   - `action_id` (PK, INT AUTO_INCREMENT)
   - `user_id` (FK, INT), `device_id` (FK, INT)
   - `action` (ENUM('ON', 'OFF'))
   - `status` (ENUM('PENDING', 'SUCCESS', 'FAIL'))
   - `requested_at` (TIMESTAMP), `responded_at` (TIMESTAMP NULL)

---

## 5. Đặc tả giao diện lập trình ứng dụng (API Documentation)

| STT | Phương thức | Đường dẫn Endpoint | Chức năng nghiệp vụ |
| :---: | :---: | :--- | :--- |
| **1** | `GET` | `/api/sensors` | Lấy danh sách số đo cảm biến (hỗ trợ phân trang, lọc `sensor_type`, tìm kiếm và sắp xếp đa cột) |
| **2** | `GET` | `/api/device-states` | Lấy trạng thái Bật/Tắt thực tế mới nhất của 3 thiết bị |
| **3** | `POST` | `/api/devices/:device_id/control` | Gửi lệnh điều khiển thiết bị (`body: { "action": "ON"|"OFF" }`) |
| **4** | `GET` | `/api/history` | Lấy danh sách lịch sử thao tác thiết bị (hỗ trợ phân trang, lọc tổ hợp và sắp xếp) |
| **5** | `GET` | `/api/profile` | Lấy thông tin cá nhân sinh viên và các liên kết dự án |

---

## 6. Cấu trúc thư mục dự án

```
IoTSmartClassroom_B23DCAT196/
├── backend/                               # Máy chủ ứng dụng Backend Node.js
│   ├── config/
│   │   └── db.js                          # Kết nối MySQL Connection Pool
│   ├── controllers/                       # Xử lý logic nghiệp vụ và xác thực đầu vào
│   │   ├── deviceController.js
│   │   ├── historyController.js
│   │   ├── profileController.js
│   │   └── sensorController.js
│   ├── routes/                            # Định tuyến 5 RESTful API
│   ├── services/
│   │   ├── mqttService.js                 # Xử lý subscribe, publish và MySQL Transactions
│   │   └── socketService.js               # Quản lý phát tán sự kiện WebSocket Socket.IO
│   ├── .env.example                       # File mẫu cấu hình biến môi trường
│   ├── schema.sql                         # Kịch bản DDL khởi tạo 5 bảng MySQL
│   └── server.js                          # Khởi chạy Express HTTP, Socket.IO và MQTT Client
├── hardware/
│   └── esp32/                             # Firmware vi điều khiển ESP32-C3
│       ├── src/
│       │   └── main.cpp                   # Đọc DHT11/BH1750 (1.5s), điều khiển GPIO và MQTT TLS
│       ├── platformio.ini                 # Cấu hình board và thư viện PlatformIO
│       └── README.md                      # Hướng dẫn chi tiết phần cứng & nạp code
├── src/                                   # Giao diện người dùng Web Frontend React 19
│   ├── components/                        # Các UI Component dùng chung (Sidebar, Modals)
│   ├── pages/                             # 4 màn hình chức năng chính
│   │   ├── Dashboard.tsx                  # Giám sát vi khí hậu & điều khiển 3 thiết bị
│   │   ├── DataSensor.tsx                 # Tra cứu dữ liệu cảm biến (phân trang, lọc, sắp xếp)
│   │   ├── ActionHistory.tsx              # Lịch sử thao tác thiết bị
│   │   └── Profile.tsx                    # Hồ sơ sinh viên & tài liệu liên kết
│   ├── services/
│   │   ├── api.ts                         # Axios client gọi REST API
│   │   ├── deviceControlStore.ts          # Store quản lý trạng thái PENDING qua localStorage
│   │   └── socket.ts                      # WebSocket client kết nối thời gian thực
│   ├── types.ts                           # Khai báo kiểu dữ liệu tĩnh TypeScript
│   ├── App.tsx                            # Định tuyến trang SPA
│   ├── main.tsx                           # Điểm nhập ứng dụng React
│   └── index.css                          # Định dạng toàn cục Tailwind CSS v4
├── IoT_Smart_Classroom_API.postman_collection.json  # Bộ sưu tập kiểm thử Postman API
├── index.html                             # File HTML gốc (chuẩn hóa title và viewport)
├── vite.config.ts                         # Cấu hình đóng gói Vite + React + Tailwind
├── package.json                           # Khai báo thư viện phụ thuộc Frontend
└── README.md                              # Tài liệu kỹ thuật tổng quan dự án
```

---

## 7. Hướng dẫn cài đặt và khởi chạy hệ thống

### Yêu cầu môi trường:
- **Node.js:** Phiên bản `>= 18.x` (khuyến nghị Node.js LTS v20.x).
- **MySQL Server:** Phiên bản `>= 8.0` đang chạy.
- **Môi trường nạp Firmware:** VS Code tích hợp tiện ích **PlatformIO IDE**.

---

### Bước 1: Khởi tạo cơ sở dữ liệu MySQL
1. Đăng nhập vào MySQL:
   ```bash
   mysql -u root -p
   ```
2. Thực thi file kịch bản SQL khởi tạo CSDL và bảng mẫu:
   ```sql
   SOURCE d:/Study/PTIT/N4-K1/IOT/IoTSmartClassroomUIUX/backend/schema.sql;
   ```

---

### Bước 2: Cài đặt và khởi chạy Backend Server
1. Điều hướng vào thư mục backend:
   ```bash
   cd backend
   ```
2. Cài đặt các gói thư viện:
   ```bash
   npm install
   ```
3. Tạo file cấu hình môi trường `.env` dựa trên file mẫu `.env.example`:
   ```bash
   cp .env.example .env
   ```
   *Điền thông tin kết nối MySQL và thông tin tài khoản HiveMQ Cloud TLS của bạn vào `.env`.*
4. Khởi chạy máy chủ Backend:
   ```bash
   npm start
   ```
   *Máy chủ Backend sẽ lắng nghe tại cổng `http://localhost:5000`.*

---

### Bước 3: Cài đặt và khởi chạy Frontend React
1. Mở cửa sổ dòng lệnh tại thư mục gốc của dự án:
   ```bash
   npm install
   ```
2. Khởi chạy máy chủ phát triển Vite:
   ```bash
   npm run dev
   ```
3. Mở trình duyệt web và truy cập địa chỉ:
   ```
   http://localhost:8443
   ```

---

### Bước 4: Nạp Firmware cho vi điều khiển ESP32-C3
1. Mở thư mục `hardware/esp32` bằng phần mềm VS Code có cài đặt **PlatformIO**.
2. Mở file `src/main.cpp`, cập nhật tên Wi-Fi (`ssid`), mật khẩu (`password`) và thông tin Broker HiveMQ Cloud.
3. Cắm bo mạch ESP32-C3 Super Mini qua cổng USB Type-C.
4. Bấm nút **PlatformIO: Upload** để biên dịch và nạp firmware xuống mạch.
5. Mở **Serial Monitor** (baudrate `115200`) để theo dõi nhật ký kết nối và dữ liệu cảm biến đo đạc mỗi 1.5 giây.

---

## 8. Tài nguyên và liên kết dự án

- **Mã nguồn chính thức trên GitHub:** [IoTSmartClassroom_B23DCAT196](https://github.com/minhcute6109-dot/IoTSmartClassroom_B23DCAT196)
- **Bản thiết kế giao diện UI/UX trên Figma:** [Figma Design File](https://www.figma.com/design/bjGIBXsdJzlBvmrRa8hXwq/IOT?node-id=0-1&t=z2RED8ZvFTu4Vx7b-1)
- **Tài liệu đặc tả Postman API Docs:** [Postman Published Documenter](https://documenter.getpostman.com/view/47640559/2sBYHURzJf)
- **Báo cáo tổng kết đồ án (PDF Google Drive):** [Google Drive Folder](https://drive.google.com/drive/u/2/folders/1ZonyWe0iwdl6QcNq0tvOk49-g9P1SCyg)
- **Báo cáo tổng kết đồ án:** [Bai4 - Copy.docx](file:///D:/Study/PTIT/N4-K1/IOT/Bai4%20-%20Copy.docx)

---
*Bản quyền thuộc về tác giả Nguyễn Anh Minh - B23DCAT196 - PTIT.*
