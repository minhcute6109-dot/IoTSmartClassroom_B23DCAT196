/**
 * DỊCH VỤ SOCKET.IO CHO BACKEND (REALTIME SERVICE)
 *
 * Quản lý kết nối WebSocket và phát đúng 2 sự kiện Realtime xuống Frontend:
 * 1. sensor_data           - Phát khi có dữ liệu cảm biến mới từ Data_Sensors (đã lưu DB)
 * 2. device_state_changed  - Phát khi phần cứng xác nhận chuyển trạng thái từ Device_Response (đã lưu DB)
 *
 * QUY TẮC:
 * - Tuyệt đối không tự tạo thêm event khác.
 * - Chỉ phát event sau khi ghi/cập nhật MySQL thành công.
 */

import { Server } from "socket.io"

let io = null

/**
 * Khởi tạo Socket.IO Server gắn với HTTP Server của Express
 */
export function initSocketService(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: "*", // Cho phép kết nối từ Frontend React
      methods: ["GET", "POST"],
    },
  })

  io.on("connection", (socket) => {
    console.log(
      `🔌 [Socket.IO]: Frontend Client đã kết nối (Socket ID: ${socket.id})`,
    )

    socket.on("disconnect", (reason) => {
      console.log(`🔌 [Socket.IO]: Frontend Client đã ngắt kết nối (${reason})`)
    })
  })

  console.log(
    "✅ [Socket.IO Service]: Đã khởi tạo Socket.IO Server sẵn sàng phát 2 event (sensor_data, device_state_changed)!",
  )
  return io
}

/**
 * Phát sự kiện 'sensor_data' xuống Frontend Dashboard
 * Payload: { data_id, sensor_id, sensor_name, sensor_type, value, unit, recorded_at, quality, error_message }
 */
export function emitSensorData(payload) {
  if (!io) {
    console.warn(
      "⚠️ [Socket.IO]: Server chưa được khởi tạo, không thể emit sensor_data.",
    )
    return
  }

  io.emit("sensor_data", payload)
  console.log(
    `⚡ [Socket.IO Realtime]: Đã emit 'sensor_data' -> Sensor: ${payload.sensor_name}, Value: ${
      payload.value !== null ? payload.value : "NULL"
    } ${payload.unit || ""}\n`,
  )
}

/**
 * Phát sự kiện 'device_state_changed' xuống Frontend Dashboard
 * Payload: { device_id, device_name, status }
 */
export function emitDeviceStateChanged(payload) {
  if (!io) {
    console.warn(
      "⚠️ [Socket.IO]: Server chưa được khởi tạo, không thể emit device_state_changed.",
    )
    return
  }

  io.emit("device_state_changed", payload)
  console.log(
    `⚡ [Socket.IO Realtime]: Đã emit 'device_state_changed' -> Thiết bị: ${payload.device_name} (ID: ${payload.device_id}) = ${payload.status}`,
  )
}

/**
 * Phát sự kiện 'action_updated' khi một lệnh điều khiển được cập nhật trạng thái (SUCCESS, FAIL)
 * Payload: { action_id, device_id, action, status, response_time }
 */
export function emitActionUpdated(payload) {
  if (!io) return
  io.emit("action_updated", payload)
  console.log(
    `⚡ [Socket.IO Realtime]: Đã emit 'action_updated' -> Action #${payload.action_id} (${payload.action}) = ${payload.status}`,
  )
}
