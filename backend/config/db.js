/**
 * CẤU HÌNH VÀ KẾT NỐI DATABASE MYSQL (backend/config/db.js)
 *
 * Hệ thống sử dụng ĐÚNG 5 BẢNG:
 * 1. Users      - Thông tin người dùng / sinh viên
 * 2. Devices    - Danh mục và trạng thái 3 thiết bị (Đèn, Quạt, Điều hòa)
 * 3. Sensors    - Danh mục 3 cảm biến (Nhiệt độ, Độ ẩm, Ánh sáng)
 * 4. DataSensor - Lịch sử các điểm đo cảm biến
 * 5. Action     - Lịch sử thao tác bật/tắt thiết bị (có cột status: PENDING / SUCCESS / FAIL)
 *
 * Chỉ sử dụng MySQL thông qua mysql2/promise pool trực tiếp.
 * Không sử dụng mock/fallback database.
 */

import fs from "fs"
import path from "path"
import mysql from "mysql2/promise"

// Tự động nạp .env nếu process.env.DB_PASSWORD chưa có
if (!process.env.DB_PASSWORD) {
  const possiblePaths = [
    path.resolve(process.cwd(), "backend/.env"),
    path.resolve(process.cwd(), ".env"),
    path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([a-zA-Z]:)/, '$1')), "../.env")
  ]
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      try {
        process.loadEnvFile(p)
        break
      } catch (e) {}
    }
  }
}

export const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "iot_smart_classroom",
  port: parseInt(process.env.DB_PORT || "3306", 10),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
}

// Khởi tạo Connection Pool trực tiếp cho MySQL
export const pool = mysql.createPool(dbConfig)

/**
 * Hàm kiểm tra kết nối Database khi khởi động server
 */
export async function testDbConnection() {
  try {
    const connection = await pool.getConnection()
    console.log("✅ [MySQL Database]: Đã kết nối thành công tới MySQL Server!")
    connection.release()
    return true
  } catch (error) {
    console.error(
      "❌ [MySQL Database]: Không thể kết nối tới MySQL Server:",
      error.message,
    )
    console.error(
      "   Vui lòng kiểm tra cấu hình DB_USER, DB_PASSWORD, DB_NAME trong backend/.env và đảm bảo MySQL đang chạy.",
    )
    return false
  }
}
