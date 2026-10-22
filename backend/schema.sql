-- =====================================================================
-- SCHEMA DATABASE CHO HỆ THỐNG IOT SMART CLASSROOM
-- Hệ thống CHỈ có đúng 5 bảng:
-- 1. Users      - Thông tin người dùng / sinh viên
-- 2. Devices    - Danh mục và trạng thái 3 thiết bị (Đèn, Quạt, Điều hòa)
-- 3. Sensors    - Danh mục 3 cảm biến (Nhiệt độ, Độ ẩm, Ánh sáng)
-- 4. DataSensor - Lịch sử các điểm đo cảm biến
-- 5. Action     - Lịch sử thao tác bật/tắt thiết bị
-- =====================================================================

CREATE DATABASE IF NOT EXISTS iot_smart_classroom CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE iot_smart_classroom;

-- Xóa bảng cũ nếu đã tồn tại để cập nhật cấu trúc mới nhất
DROP TABLE IF EXISTS Action;
DROP TABLE IF EXISTS DataSensor;
DROP TABLE IF EXISTS Sensors;
DROP TABLE IF EXISTS Devices;
DROP TABLE IF EXISTS Users;

-- 1. BẢNG Users
CREATE TABLE IF NOT EXISTS Users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  student_id VARCHAR(20) NOT NULL,
  email VARCHAR(100) NOT NULL,
  github_url VARCHAR(500) DEFAULT 'https://github.com/minhcute6109-dot/IoTSmartClassroom_B23DCAT196',
  figma_url VARCHAR(500) DEFAULT 'https://www.figma.com/design/bjGIBXsdJzlBvmrRa8hXwq/IOT?node-id=0-1&t=z2RED8ZvFTu4Vx7b-1',
  api_doc_url VARCHAR(500) DEFAULT 'https://documenter.getpostman.com/view/47640559/2sBYHURzJf',
  pdf_report_url VARCHAR(500) DEFAULT 'https://drive.google.com/drive/u/2/folders/1ZonyWe0iwdl6QcNq0tvOk49-g9P1SCyg',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. BẢNG Devices (Chỉ có đúng 3 thiết bị)
CREATE TABLE IF NOT EXISTS Devices (
  device_id INT PRIMARY KEY,
  device_name VARCHAR(50) NOT NULL,
  device_type VARCHAR(50) NOT NULL,
  status ENUM('ON', 'OFF') NOT NULL DEFAULT 'OFF',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. BẢNG Sensors (Chỉ có đúng 3 cảm biến)
CREATE TABLE IF NOT EXISTS Sensors (
  sensor_id INT PRIMARY KEY,
  sensor_name VARCHAR(100) NOT NULL,
  sensor_type VARCHAR(50) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. BẢNG DataSensor (Chỉ có 4 cột: data_id, sensor_id, value, recorded_at)
CREATE TABLE IF NOT EXISTS DataSensor (
  data_id INT AUTO_INCREMENT PRIMARY KEY,
  sensor_id INT NOT NULL,
  value DECIMAL(6,2) DEFAULT NULL,
  recorded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sensor_id) REFERENCES Sensors(sensor_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. BẢNG Action
CREATE TABLE IF NOT EXISTS Action (
  action_id INT AUTO_INCREMENT PRIMARY KEY,
  device_id INT NOT NULL,
  user_id INT DEFAULT NULL,
  action ENUM('ON', 'OFF') NOT NULL,
  status ENUM('PENDING', 'SUCCESS', 'FAIL') NOT NULL DEFAULT 'PENDING',
  action_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (device_id) REFERENCES Devices(device_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- DỮ LIỆU KHỞI TẠO (SEED DATA)
-- =====================================================================

-- Nạp tài khoản mẫu cho Users (user_id = 1 là tài khoản mẫu ở giai đoạn development)
INSERT INTO Users (user_id, username, password, name, student_id, email, github_url, figma_url, api_doc_url, pdf_report_url)
VALUES (
  1,
  'minhanh',
  '123456',
  'Nguyễn Anh Minh',
  'B23DCAT196',
  'MinhNA.B23AT196@stu.ptit.edu.vn',
  'https://github.com/minhcute6109-dot/IoTSmartClassroom_B23DCAT196',
  'https://www.figma.com/design/bjGIBXsdJzlBvmrRa8hXwq/IOT?node-id=0-1&t=z2RED8ZvFTu4Vx7b-1',
  'https://documenter.getpostman.com/view/47640559/2sBYHURzJf',
  'https://drive.google.com/drive/u/2/folders/1ZonyWe0iwdl6QcNq0tvOk49-g9P1SCyg'
) ON DUPLICATE KEY UPDATE name = VALUES(name), github_url = VALUES(github_url), figma_url = VALUES(figma_url), api_doc_url = VALUES(api_doc_url), pdf_report_url = VALUES(pdf_report_url);

-- Nạp danh mục 3 thiết bị cho Devices
INSERT INTO Devices (device_id, device_name, device_type, status)
VALUES
  (1, 'Đèn', 'light', 'ON'),
  (2, 'Quạt', 'fan', 'OFF'),
  (3, 'Điều hòa', 'ac', 'OFF')
ON DUPLICATE KEY UPDATE device_name = VALUES(device_name), device_type = VALUES(device_type);

-- Nạp danh mục 3 loại cảm biến cho Sensors
INSERT INTO Sensors (sensor_id, sensor_name, sensor_type, unit)
VALUES
  (1, 'Cảm biến nhiệt độ', 'Nhiệt độ', '°C'),
  (2, 'Cảm biến độ ẩm', 'Độ ẩm', '%'),
  (3, 'Cảm biến ánh sáng', 'Ánh sáng', 'lux')
ON DUPLICATE KEY UPDATE sensor_name = VALUES(sensor_name), unit = VALUES(unit);

-- Nạp dữ liệu đo mẫu cho DataSensor (90 bản ghi)
INSERT INTO DataSensor (sensor_id, value, recorded_at) VALUES  (1, 29.30, '2026-08-16 08:00:00'),  (2, 55.20, '2026-08-16 08:00:00'),  (3, 240.00, '2026-08-16 08:00:00'),  (1, 28.50, '2026-08-16 08:30:00'),  (2, 54.00, '2026-08-16 08:30:00'),  (3, 241.60, '2026-08-16 08:30:00'),  (1, 29.70, '2026-08-16 09:00:00'),  (2, 54.80, '2026-08-16 09:00:00'),  (3, 240.80, '2026-08-16 09:00:00'),  (1, 28.90, '2026-08-16 09:30:00'),  (2, 55.60, '2026-08-16 09:30:00'),  (3, 242.40, '2026-08-16 09:30:00'),  (1, 30.10, '2026-08-16 10:00:00'),  (2, NULL, '2026-08-16 10:00:00'),  (3, 240.40, '2026-08-16 10:00:00'),  (1, 28.50, '2026-08-16 10:30:00'),  (2, 54.80, '2026-08-16 10:30:00'),  (3, 241.20, '2026-08-16 10:30:00'),  (1, 29.30, '2026-08-17 08:00:00'),  (2, 55.60, '2026-08-17 08:00:00'),  (3, 242.00, '2026-08-17 08:00:00'),  (1, 28.90, '2026-08-17 08:30:00'),  (2, 54.40, '2026-08-17 08:30:00'),  (3, 240.00, '2026-08-17 08:30:00'),  (1, 29.70, '2026-08-17 09:00:00'),  (2, 55.20, '2026-08-17 09:00:00'),  (3, 241.60, '2026-08-17 09:00:00'),  (1, 53.50, '2026-08-17 09:30:00'),  (2, 54.00, '2026-08-17 09:30:00'),  (3, 240.80, '2026-08-17 09:30:00'),  (1, 28.50, '2026-08-17 10:00:00'),  (2, 54.80, '2026-08-17 10:00:00'),  (3, 242.40, '2026-08-17 10:00:00'),  (1, 29.30, '2026-08-17 10:30:00'),  (2, 55.60, '2026-08-17 10:30:00'),  (3, 240.40, '2026-08-17 10:30:00'),  (1, 28.90, '2026-08-18 08:00:00'),  (2, 54.40, '2026-08-18 08:00:00'),  (3, 241.20, '2026-08-18 08:00:00'),  (1, 29.70, '2026-08-18 08:30:00'),  (2, 55.20, '2026-08-18 08:30:00'),  (3, -5.00, '2026-08-18 08:30:00'),  (1, 28.50, '2026-08-18 09:00:00'),  (2, 54.00, '2026-08-18 09:00:00'),  (3, 240.00, '2026-08-18 09:00:00'),  (1, 29.30, '2026-08-18 09:30:00'),  (2, 54.80, '2026-08-18 09:30:00'),  (3, 241.60, '2026-08-18 09:30:00'),  (1, 28.90, '2026-08-18 10:00:00'),  (2, 55.60, '2026-08-18 10:00:00'),  (3, 240.80, '2026-08-18 10:00:00'),  (1, 29.70, '2026-08-18 10:30:00'),  (2, 54.40, '2026-08-18 10:30:00'),  (3, 242.40, '2026-08-18 10:30:00'),  (1, 28.50, '2026-08-19 08:00:00'),  (2, 55.20, '2026-08-19 08:00:00'),  (3, 240.40, '2026-08-19 08:00:00'),  (1, 29.30, '2026-08-19 08:30:00'),  (2, 54.00, '2026-08-19 08:30:00'),  (3, 241.20, '2026-08-19 08:30:00'),  (1, 28.90, '2026-08-19 09:00:00'),  (2, 54.80, '2026-08-19 09:00:00'),  (3, 242.00, '2026-08-19 09:00:00'),  (1, 29.70, '2026-08-19 09:30:00'),  (2, 55.60, '2026-08-19 09:30:00'),  (3, 240.00, '2026-08-19 09:30:00'),  (1, 28.50, '2026-08-19 10:00:00'),  (2, 54.40, '2026-08-19 10:00:00'),  (3, 241.60, '2026-08-19 10:00:00'),  (1, 53.50, '2026-08-19 10:30:00'),  (2, 55.20, '2026-08-19 10:30:00'),  (3, 240.80, '2026-08-19 10:30:00'),  (1, 28.90, '2026-08-20 08:00:00'),  (2, 54.00, '2026-08-20 08:00:00'),  (3, 242.40, '2026-08-20 08:00:00'),  (1, 29.70, '2026-08-20 08:30:00'),  (2, 54.80, '2026-08-20 08:30:00'),  (3, 240.40, '2026-08-20 08:30:00'),  (1, 28.50, '2026-08-20 09:00:00'),  (2, 55.60, '2026-08-20 09:00:00'),  (3, 241.20, '2026-08-20 09:00:00'),  (1, 29.30, '2026-08-20 09:30:00'),  (2, 54.40, '2026-08-20 09:30:00'),  (3, 242.00, '2026-08-20 09:30:00'),  (1, 28.90, '2026-08-20 10:00:00'),  (2, 55.20, '2026-08-20 10:00:00'),  (3, 240.00, '2026-08-20 10:00:00'),  (1, 29.70, '2026-08-20 10:30:00'),  (2, 54.00, '2026-08-20 10:30:00'),  (3, 241.60, '2026-08-20 10:30:00');

-- Nạp lịch sử mẫu cho Action (60 bản ghi)
INSERT INTO Action (device_id, user_id, action, status, action_time) VALUES
  (1, 1, 'ON', 'SUCCESS', '2026-08-16 08:00:00'),
  (2, 1, 'OFF', 'FAIL', '2026-08-16 08:07:00'),
  (3, 1, 'ON', 'PENDING', '2026-08-16 08:14:00'),
  (1, 1, 'OFF', 'SUCCESS', '2026-08-16 08:21:00'),
  (2, 1, 'ON', 'SUCCESS', '2026-08-16 08:28:00'),
  (3, 1, 'OFF', 'SUCCESS', '2026-08-16 08:35:00'),
  (1, 1, 'ON', 'SUCCESS', '2026-08-16 08:42:00'),
  (2, 1, 'OFF', 'SUCCESS', '2026-08-16 08:49:00'),
  (3, 1, 'ON', 'SUCCESS', '2026-08-16 08:56:00'),
  (1, 1, 'OFF', 'SUCCESS', '2026-08-16 09:03:00'),
  (2, 1, 'ON', 'SUCCESS', '2026-08-16 09:10:00'),
  (3, 1, 'OFF', 'SUCCESS', '2026-08-16 09:17:00'),
  (1, 1, 'ON', 'SUCCESS', '2026-08-16 09:24:00'),
  (2, 1, 'OFF', 'SUCCESS', '2026-08-16 09:31:00'),
  (3, 1, 'ON', 'SUCCESS', '2026-08-16 09:38:00'),
  (1, 1, 'OFF', 'SUCCESS', '2026-08-16 09:45:00'),
  (2, 1, 'ON', 'SUCCESS', '2026-08-16 09:52:00'),
  (3, 1, 'OFF', 'SUCCESS', '2026-08-16 09:59:00'),
  (1, 1, 'ON', 'SUCCESS', '2026-08-16 10:06:00'),
  (2, 1, 'OFF', 'SUCCESS', '2026-08-16 10:13:00'),
  (3, 1, 'ON', 'SUCCESS', '2026-08-16 10:20:00'),
  (1, 1, 'OFF', 'SUCCESS', '2026-08-16 10:27:00'),
  (2, 1, 'ON', 'SUCCESS', '2026-08-16 10:34:00'),
  (3, 1, 'OFF', 'SUCCESS', '2026-08-16 10:41:00'),
  (1, 1, 'ON', 'SUCCESS', '2026-08-16 10:48:00'),
  (2, 1, 'OFF', 'SUCCESS', '2026-08-16 10:55:00'),
  (3, 1, 'ON', 'SUCCESS', '2026-08-16 11:02:00'),
  (1, 1, 'OFF', 'SUCCESS', '2026-08-16 11:09:00'),
  (2, 1, 'ON', 'SUCCESS', '2026-08-16 11:16:00'),
  (3, 1, 'OFF', 'SUCCESS', '2026-08-16 11:23:00'),
  (1, 1, 'ON', 'SUCCESS', '2026-08-16 11:30:00'),
  (2, 1, 'OFF', 'SUCCESS', '2026-08-16 11:37:00'),
  (3, 1, 'ON', 'SUCCESS', '2026-08-16 11:44:00'),
  (1, 1, 'OFF', 'SUCCESS', '2026-08-16 11:51:00'),
  (2, 1, 'ON', 'SUCCESS', '2026-08-16 11:58:00'),
  (3, 1, 'OFF', 'SUCCESS', '2026-08-16 12:05:00'),
  (1, 1, 'ON', 'SUCCESS', '2026-08-16 12:12:00'),
  (2, 1, 'OFF', 'SUCCESS', '2026-08-16 12:19:00'),
  (3, 1, 'ON', 'SUCCESS', '2026-08-16 12:26:00'),
  (1, 1, 'OFF', 'SUCCESS', '2026-08-16 12:33:00'),
  (2, 1, 'ON', 'SUCCESS', '2026-08-16 12:40:00'),
  (3, 1, 'OFF', 'SUCCESS', '2026-08-16 12:47:00'),
  (1, 1, 'ON', 'SUCCESS', '2026-08-16 12:54:00'),
  (2, 1, 'OFF', 'SUCCESS', '2026-08-16 13:01:00'),
  (3, 1, 'ON', 'SUCCESS', '2026-08-16 13:08:00'),
  (1, 1, 'OFF', 'SUCCESS', '2026-08-16 13:15:00'),
  (2, 1, 'ON', 'SUCCESS', '2026-08-16 13:22:00'),
  (3, 1, 'OFF', 'SUCCESS', '2026-08-16 13:29:00'),
  (1, 1, 'ON', 'SUCCESS', '2026-08-16 13:36:00'),
  (2, 1, 'OFF', 'SUCCESS', '2026-08-16 13:43:00'),
  (3, 1, 'ON', 'SUCCESS', '2026-08-16 13:50:00'),
  (1, 1, 'OFF', 'SUCCESS', '2026-08-16 13:57:00'),
  (2, 1, 'ON', 'SUCCESS', '2026-08-16 14:04:00'),
  (3, 1, 'OFF', 'SUCCESS', '2026-08-16 14:11:00'),
  (1, 1, 'ON', 'SUCCESS', '2026-08-16 14:18:00'),
  (2, 1, 'OFF', 'SUCCESS', '2026-08-16 14:25:00'),
  (3, 1, 'ON', 'SUCCESS', '2026-08-16 14:32:00'),
  (1, 1, 'OFF', 'SUCCESS', '2026-08-16 14:39:00'),
  (2, 1, 'ON', 'SUCCESS', '2026-08-16 14:46:00'),
  (3, 1, 'OFF', 'SUCCESS', '2026-08-16 14:53:00');
