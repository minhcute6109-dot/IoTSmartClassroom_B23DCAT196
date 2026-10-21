/**
 * SCRIPT KHỞI TẠO CƠ SỞ DỮ LIỆU MYSQL (init_db.js)
 * Đọc file schema.sql và tự động tạo Database, 5 bảng và nạp seed data.
 */

import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import mysql from "mysql2/promise"
import { dbConfig } from "./config/db.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function initDatabase() {
  console.log("⏳ Đang kết nối tới MySQL Server để khởi tạo Database...")

  let connection = null
  try {
    // 1. Kết nối không cần database trước
    connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      port: dbConfig.port,
      multipleStatements: true,
    })

    const schemaPath = path.join(__dirname, "schema.sql")
    const sqlContent = fs.readFileSync(schemaPath, "utf8")

    console.log("📦 Đang thực thi schema.sql cho 5 bảng...")
    await connection.query(sqlContent)

    console.log("====================================================")
    console.log("✅ Khởi tạo Database và nạp dữ liệu mẫu thành công!")
    console.log("   - Database: iot_smart_classroom")
    console.log("   - 5 Bảng: Users, Devices, Sensors, DataSensor, Action")
    console.log("====================================================")
  } catch (error) {
    console.error("❌ Lỗi khi khởi tạo Database:", error.message)
    if (error.code === "ER_ACCESS_DENIED_ERROR") {
      console.error(
        "   👉 Vui lòng kiểm tra và điền mật khẩu MySQL đúng vào DB_PASSWORD trong file backend/.env.",
      )
    }
    process.exit(1)
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}

initDatabase()
