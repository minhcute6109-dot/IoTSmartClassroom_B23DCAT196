/**
 * QUẢN LÝ TRẠNG THÁI PENDING & BỘ NHỚ ĐỆM DASHBOARD (src/services/deviceControlStore.ts)
 *
 * Chức năng:
 * 1. Duy trì trạng thái "ĐANG CHỜ..." (PENDING) của 3 thiết bị độc lập xuyên suốt
 *    khi người dùng chuyển màn hình hoặc bấm F5 tải lại trang.
 * 2. Đặt mốc thời gian hết hạn chính xác 2.5 giây (`expiresAt = Date.now() + 2500`).
 *    Nếu người dùng rời đi hoặc ấn F5 quay lại trong vòng chưa đầy 2.5s, công tắc vẫn tiếp tục hiển thị
 *    "ĐANG CHỜ..." cho tới khi hết đúng 2.5s từ lúc bấm ban đầu.
 * 3. Tự động lắng nghe Socket.IO sự kiện `device_state_changed` và `action_updated`
 *    ở tầng module để cập nhật kịp thời trạng thái.
 * 4. Cung cấp hook `useDevicePending()` cho React components đăng ký reactive state.
 * 5. Lưu cache dữ liệu biểu đồ và số đo cảm biến (sessionStorage) để tránh chớp màn hình khi F5/chuyển tab.
 */

import { useState, useEffect } from "react"
import type { DeviceState, DeviceName, SensorChartPoint } from "../types"
import { controlDevice } from "./api"
import {
  onDeviceStateChanged,
  onActionUpdated,
  type DeviceStateChangedEvent,
  type ActionUpdatedEvent,
} from "./socket"

export const DEVICE_ID_MAP: Record<keyof DeviceState, number> = {
  light: 1,
  fan: 2,
  ac: 3,
}

export const DEVICE_NAME_MAP: Record<keyof DeviceState, DeviceName> = {
  light: "Đèn",
  fan: "Quạt",
  ac: "Điều hòa",
}

interface PendingDeviceInfo {
  isPending: boolean
  expiresAt: number // timestamp Date.now() + 2500
  timer: ReturnType<typeof setTimeout> | null
}

const PENDING_STORAGE_PREFIX = "iot_device_pending_"
const CACHE_KEYS = {
  CHART: "iot_cached_chart_data",
  SENSORS: "iot_cached_latest_sensors",
  DEVICES: "iot_cached_devices",
  LAST_TIME: "iot_cached_last_updated_time",
}

// Danh sách listener đăng ký re-render
const listeners = new Set<() => void>()

function notifyListeners() {
  listeners.forEach((listener) => {
    try {
      listener()
    } catch (e) {
      console.error("[deviceControlStore] Listener error:", e)
    }
  })
}

/**
 * Khởi tạo trạng thái pending ban đầu từ localStorage (Bảo toàn khi F5)
 */
function initPendingState(): Record<keyof DeviceState, PendingDeviceInfo> {
  const state: Record<keyof DeviceState, PendingDeviceInfo> = {
    light: { isPending: false, expiresAt: 0, timer: null },
    fan: { isPending: false, expiresAt: 0, timer: null },
    ac: { isPending: false, expiresAt: 0, timer: null },
  }

  const now = Date.now()
  ;(Object.keys(state) as (keyof DeviceState)[]).forEach((key) => {
    try {
      const savedExpires = localStorage.getItem(`${PENDING_STORAGE_PREFIX}${key}`)
      if (savedExpires) {
        const expiresAt = parseInt(savedExpires, 10)
        if (!isNaN(expiresAt) && expiresAt > now) {
          state[key].isPending = true
          state[key].expiresAt = expiresAt
          const remainingMs = expiresAt - now
          state[key].timer = setTimeout(() => {
            state[key].isPending = false
            state[key].expiresAt = 0
            state[key].timer = null
            try {
              localStorage.removeItem(`${PENDING_STORAGE_PREFIX}${key}`)
            } catch {}
            notifyListeners()
          }, remainingMs)
        } else {
          localStorage.removeItem(`${PENDING_STORAGE_PREFIX}${key}`)
        }
      }
    } catch {}
  })

  return state
}

const pendingState: Record<keyof DeviceState, PendingDeviceInfo> = initPendingState()

// ===== BỘ NHỚ ĐỆM DỮ LIỆU DASHBOARD (Bảo toàn khi F5) =====

function initCachedChartData(): SensorChartPoint[] {
  try {
    const raw = sessionStorage.getItem(CACHE_KEYS.CHART)
    if (raw) return JSON.parse(raw)
  } catch {}
  return []
}

function initCachedLatestSensors(): { temp: number; humidity: number; light: number } {
  try {
    const raw = sessionStorage.getItem(CACHE_KEYS.SENSORS)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { temp: 0, humidity: 0, light: 0 }
}

function initCachedDevices(): DeviceState {
  try {
    const raw = sessionStorage.getItem(CACHE_KEYS.DEVICES)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { light: false, fan: false, ac: false }
}

function initCachedLastUpdatedTime(): string {
  try {
    return sessionStorage.getItem(CACHE_KEYS.LAST_TIME) || ""
  } catch {}
  return ""
}

let cachedChartData: SensorChartPoint[] = initCachedChartData()
let cachedLatestSensors = initCachedLatestSensors()
let cachedDevices: DeviceState = initCachedDevices()
let cachedLastUpdatedTime = initCachedLastUpdatedTime()

/**
 * Kiểm tra xem 1 thiết bị cụ thể có đang trong trạng thái PENDING (< 2.5s) hay không
 */
export function isDevicePending(key: keyof DeviceState): boolean {
  const info = pendingState[key]
  if (!info.isPending) return false

  // Nếu đã quá 2.5 giây mà chưa tắt pending
  if (Date.now() >= info.expiresAt) {
    info.isPending = false
    info.expiresAt = 0
    if (info.timer) {
      clearTimeout(info.timer)
      info.timer = null
    }
    try {
      localStorage.removeItem(`${PENDING_STORAGE_PREFIX}${key}`)
    } catch {}
    return false
  }

  return true
}

/**
 * Lấy map trạng thái pending hiện tại của cả 3 thiết bị
 */
export function getPendingDevicesMap(): Record<keyof DeviceState, boolean> {
  return {
    light: isDevicePending("light"),
    fan: isDevicePending("fan"),
    ac: isDevicePending("ac"),
  }
}

/**
 * Kích hoạt lệnh Bật/Tắt thiết bị và bắt đầu đếm 2.5 giây
 */
export async function triggerDeviceToggle(
  key: keyof DeviceState,
  currentDevices: DeviceState,
) {
  if (isDevicePending(key)) return // Đang trong 2.5s thì không bấm đè

  const deviceId = DEVICE_ID_MAP[key]
  const deviceName = DEVICE_NAME_MAP[key]
  const nextAction = currentDevices[key] ? "OFF" : "ON"

  // 1. Đặt mốc thời gian hết hạn sau đúng 2.5 giây (2500ms)
  const expiresAt = Date.now() + 2500

  if (pendingState[key].timer) {
    clearTimeout(pendingState[key].timer!)
  }

  pendingState[key].isPending = true
  pendingState[key].expiresAt = expiresAt

  try {
    localStorage.setItem(`${PENDING_STORAGE_PREFIX}${key}`, String(expiresAt))
  } catch {}

  // 2. Đặt bộ đếm thời gian 2.5 giây ở tầng Store
  pendingState[key].timer = setTimeout(() => {
    if (pendingState[key].isPending) {
      pendingState[key].isPending = false
      pendingState[key].expiresAt = 0
      pendingState[key].timer = null
      try {
        localStorage.removeItem(`${PENDING_STORAGE_PREFIX}${key}`)
      } catch {}
      console.warn(
        `⏱️ [Store Timeout 2.5s]: Thiết bị ${deviceName} không có phản hồi sau 2.5s -> Giữ nguyên trạng thái (không bật được).`,
      )
      notifyListeners()
    }
  }, 2500)

  notifyListeners()

  // 3. Gửi lệnh qua REST API tới Backend
  try {
    await controlDevice(deviceId, nextAction)
  } catch (err) {
    console.error(
      `[deviceControlStore] Lỗi khi gửi lệnh điều khiển thiết bị ${key}:`,
      err,
    )
  }
}

// 4. Lắng nghe sự kiện Socket.IO Realtime ở tầng Module (Không bao giờ bị unmount khi chuyển trang)
onDeviceStateChanged((event: DeviceStateChangedEvent) => {
  const key: keyof DeviceState =
    event.device_id === 1 ? "light" : event.device_id === 2 ? "fan" : "ac"

  // Hủy bộ đếm 2.5s vì phần cứng đã phản hồi SUCCESS
  if (pendingState[key].timer) {
    clearTimeout(pendingState[key].timer!)
    pendingState[key].timer = null
  }
  pendingState[key].isPending = false
  pendingState[key].expiresAt = 0
  try {
    localStorage.removeItem(`${PENDING_STORAGE_PREFIX}${key}`)
  } catch {}

  // Cập nhật trạng thái thiết bị trong cache
  cachedDevices[key] = event.status === "ON"
  try {
    sessionStorage.setItem(CACHE_KEYS.DEVICES, JSON.stringify(cachedDevices))
  } catch {}

  notifyListeners()
})

onActionUpdated((event: ActionUpdatedEvent) => {
  const key: keyof DeviceState =
    event.device_id === 1 ? "light" : event.device_id === 2 ? "fan" : "ac"

  // Khi có xác nhận FAIL hoặc SUCCESS: hủy trạng thái pending
  if (pendingState[key].timer) {
    clearTimeout(pendingState[key].timer!)
    pendingState[key].timer = null
  }
  pendingState[key].isPending = false
  pendingState[key].expiresAt = 0
  try {
    localStorage.removeItem(`${PENDING_STORAGE_PREFIX}${key}`)
  } catch {}

  notifyListeners()
})

/**
 * React Hook cung cấp reactive state cho pendingDevices
 * Tự động tính toán lại và đặt bộ đếm cho thời gian CÒN LẠI khi component mount.
 */
export function useDevicePending(): Record<keyof DeviceState, boolean> {
  const [pending, setPending] = useState<Record<keyof DeviceState, boolean>>(() =>
    getPendingDevicesMap(),
  )

  useEffect(() => {
    // 1. Cập nhật state ngay khi mount (Ví dụ khi người dùng vừa chuyển lại trang hoặc bấm F5)
    setPending(getPendingDevicesMap())

    // 2. Với các thiết bị đang pending, đặt timer cho đúng khoảng thời gian CÒN LẠI (< 2.5s)
    const remainingTimers: ReturnType<typeof setTimeout>[] = []
    ;(Object.keys(pendingState) as (keyof DeviceState)[]).forEach((key) => {
      if (isDevicePending(key)) {
        const remainingMs = Math.max(0, pendingState[key].expiresAt - Date.now())
        if (remainingMs > 0) {
          const t = setTimeout(() => {
            setPending(getPendingDevicesMap())
          }, remainingMs)
          remainingTimers.push(t)
        }
      }
    })

    // 3. Đăng ký nhận thông báo thay đổi từ Store
    const handleStoreChange = () => {
      setPending(getPendingDevicesMap())
    }
    listeners.add(handleStoreChange)

    return () => {
      listeners.delete(handleStoreChange)
      remainingTimers.forEach((t) => clearTimeout(t))
    }
  }, [])

  return pending
}

// ===== CÁC HÀM QUẢN LÝ BỘ NHỚ ĐỆM DASHBOARD =====

export function getCachedChartData(): SensorChartPoint[] {
  return cachedChartData
}

export function setCachedChartData(data: SensorChartPoint[]) {
  cachedChartData = data
  try {
    sessionStorage.setItem(CACHE_KEYS.CHART, JSON.stringify(data))
  } catch {}
}

export function getCachedLatestSensors(): {
  temp: number
  humidity: number
  light: number
} {
  return cachedLatestSensors
}

export function setCachedLatestSensors(sensors: {
  temp: number
  humidity: number
  light: number
}) {
  cachedLatestSensors = sensors
  try {
    sessionStorage.setItem(CACHE_KEYS.SENSORS, JSON.stringify(sensors))
  } catch {}
}

export function getCachedDevices(): DeviceState {
  return cachedDevices
}

export function setCachedDevices(devices: DeviceState) {
  cachedDevices = devices
  try {
    sessionStorage.setItem(CACHE_KEYS.DEVICES, JSON.stringify(devices))
  } catch {}
}

export function getCachedLastUpdatedTime(): string {
  return cachedLastUpdatedTime
}

export function setCachedLastUpdatedTime(time: string) {
  cachedLastUpdatedTime = time
  try {
    sessionStorage.setItem(CACHE_KEYS.LAST_TIME, time)
  } catch {}
}

/**
 * Xóa sạch toàn bộ cache và trạng thái pending khi đăng xuất
 */
export function clearAllDeviceStoreData() {
  (Object.keys(pendingState) as (keyof DeviceState)[]).forEach((key) => {
    if (pendingState[key].timer) {
      clearTimeout(pendingState[key].timer!)
      pendingState[key].timer = null
    }
    pendingState[key].isPending = false
    pendingState[key].expiresAt = 0
    try {
      localStorage.removeItem(`${PENDING_STORAGE_PREFIX}${key}`)
    } catch {}
  })

  cachedChartData = []
  cachedLatestSensors = { temp: 0, humidity: 0, light: 0 }
  cachedDevices = { light: false, fan: false, ac: false }
  cachedLastUpdatedTime = ""

  try {
    sessionStorage.removeItem(CACHE_KEYS.CHART)
    sessionStorage.removeItem(CACHE_KEYS.SENSORS)
    sessionStorage.removeItem(CACHE_KEYS.DEVICES)
    sessionStorage.removeItem(CACHE_KEYS.LAST_TIME)
  } catch {}

  notifyListeners()
}
