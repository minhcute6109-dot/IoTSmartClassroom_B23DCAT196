import fs from "fs"
import path from "path"
import http from "http"
import express from "express"
import cors from "cors"

// Tự động nạp file .env nếu chưa nạp
if (!process.env.DB_PASSWORD) {
  const possiblePaths = [
    path.resolve(process.cwd(), "backend/.env"),
    path.resolve(process.cwd(), ".env"),
    path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([a-zA-Z]:)/, '$1')), ".env")
  ]
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      try {
        process.loadEnvFile(p)
        console.log(`[Config]: Đã tự động nạp cấu hình từ ${p}`)
        break
      } catch (e) {}
    }
  }
}

import sensorRoutes from "./routes/sensorRoutes.js"
import deviceRoutes from "./routes/deviceRoutes.js"
import historyRoutes from "./routes/historyRoutes.js"
import profileRoutes from "./routes/profileRoutes.js"
import authRoutes from "./routes/authRoutes.js"
import { testDbConnection } from "./config/db.js"
import { initMqttService } from "./services/mqttService.js"
import { initSocketService } from "./services/socketService.js"

const app = express()
const PORT = process.env.PORT || 5000

// 1. Tạo HTTP Server kết hợp Express App và Socket.IO Server
const httpServer = http.createServer(app)

// 2. Cấu hình Middleware
app.use(cors()) // Cho phép Frontend gọi API từ domain/port khác
app.use(express.json()) // Đọc dữ liệu JSON trong body request

// 3. Đăng ký các Route API chính (Đầy đủ 6 endpoint chuẩn bảo mật JWT)
app.use("/api", authRoutes) // POST /api/auth/login & POST /api/login
app.use("/api", sensorRoutes) // GET /api/sensors (Yêu cầu Token)
app.use("/api", deviceRoutes) // GET /api/device-states & POST /api/devices/:device_id/control (Yêu cầu Token)
app.use("/api", historyRoutes) // GET /api/history (Yêu cầu Token)
app.use("/api", profileRoutes) // GET /api/profile (Yêu cầu Token)

// 4. Xử lý đường dẫn không tồn tại (404 Not Found)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Đường dẫn API '${req.method} ${req.originalUrl}' không tồn tại trên hệ thống.`,
  })
})

// 5. Middleware xử lý lỗi toàn cục (Global Error Handler - 500 Internal Server Error)
app.use((err, req, res, next) => {
  console.error("[Server Error]:", err)
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Đã xảy ra lỗi máy chủ nội bộ.",
  })
})

// 6. Khởi tạo Socket.IO và khởi chạy máy chủ
initSocketService(httpServer)

httpServer.listen(PORT, async () => {
  console.log(`====================================================`)
  console.log(`🚀 IoT Smart Classroom Backend Server đang chạy!`)
  console.log(`🌐 REST API: http://localhost:${PORT}`)
  console.log(`⚡ WebSocket / Socket.IO: ws://localhost:${PORT}`)
  console.log(`📡 Danh sách API sẵn sàng:`)
  console.log(`   - GET  http://localhost:${PORT}/api/sensors`)
  console.log(`   - GET  http://localhost:${PORT}/api/device-states`)
  console.log(
    `   - POST http://localhost:${PORT}/api/devices/:device_id/control`,
  )
  console.log(`   - GET  http://localhost:${PORT}/api/history`)
  console.log(`   - GET  http://localhost:${PORT}/api/profile`)
  console.log(`====================================================`)
  await testDbConnection()
  initMqttService()
})

export default app
