/**
 * DỊCH VỤ SOCKET.IO CLIENT CHO FRONTEND (src/services/socket.ts)
 *
 * Quản lý kết nối WebSocket tới Backend và đăng ký lắng nghe đúng 2 sự kiện Realtime:
 * 1. sensor_data           - Nhận điểm dữ liệu cảm biến mới khi Backend nhận từ MQTT Data_Sensors
 * 2. device_state_changed  - Nhận xác nhận trạng thái thiết bị thực tế khi Backend nhận từ MQTT Device_Response
 *
 * QUY TẮC:
 * - Frontend KHÔNG kết nối trực tiếp với MQTT.
 * - Chỉ lắng nghe qua Socket.IO từ Backend.
 */

import { io, Socket } from "socket.io-client"

import type { SensorApiRecord } from "../types"

export interface DeviceStateChangedEvent {
  device_id: number

  device_name: string

  status: "ON" | "OFF"
}

const SOCKET_SERVER_URL = "http://localhost:5000"

// Khởi tạo kết nối Socket.IO Client tới Backend

export const socket: Socket = io(SOCKET_SERVER_URL, {
  autoConnect: true,

  reconnection: true,

  reconnectionDelay: 2000,

  reconnectionAttempts: Infinity,
})

socket.on("connect", () => {
  console.log(
    `⚡ [Socket.IO Client]: Đã kết nối thành công tới Backend (${socket.id})`,
  )
})

socket.on("disconnect", (reason) => {
  console.log(`🔌 [Socket.IO Client]: Đã ngắt kết nối (${reason})`)
})

socket.on("connect_error", (err) => {
  console.warn(
    `⚠️ [Socket.IO Client]: Lỗi kết nối tới Backend Socket.IO:`,

    err.message,
  )
})

/**
 * Đăng ký lắng nghe sự kiện 'sensor_data'
 */

export function onSensorData(callback: (data: SensorApiRecord) => void) {
  socket.on("sensor_data", callback)
}

/**
 * Hủy lắng nghe sự kiện 'sensor_data'
 */

export function offSensorData(callback: (data: SensorApiRecord) => void) {
  socket.off("sensor_data", callback)
}

/**
 * Đăng ký lắng nghe sự kiện 'device_state_changed'
 */

export function onDeviceStateChanged(
  callback: (data: DeviceStateChangedEvent) => void,
) {
  socket.on("device_state_changed", callback)
}

/**
 * Hủy lắng nghe sự kiện 'device_state_changed'
 */

export function offDeviceStateChanged(
  callback: (data: DeviceStateChangedEvent) => void,
) {
  socket.off("device_state_changed", callback)
}

export interface ActionUpdatedEvent {
  action_id: number
  device_id: number
  action: string | null
  status: "SUCCESS" | "FAIL"
  response_time: string | Date
}

export function onActionUpdated(
  callback: (data: ActionUpdatedEvent) => void,
) {
  socket.on("action_updated", callback)
}

export function offActionUpdated(
  callback: (data: ActionUpdatedEvent) => void,
) {
  socket.off("action_updated", callback)
}
