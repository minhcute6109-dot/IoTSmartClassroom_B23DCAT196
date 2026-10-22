/**
 * DỊCH VỤ GIAO TIẾP API VỚI BACKEND (src/services/api.ts)
 *
 * Chịu trách nhiệm duy nhất:
 * - Gọi fetch đến Backend (http://localhost:5000/api)
 * - Tạo và gắn query parameters
 * - Kiểm tra HTTP response status
 * - Parse JSON
 * - Trả dữ liệu kiểu chuẩn cho các component / page của Frontend
 */

import type {
  DeviceStatesResponse,
  DeviceControlResponse,
  SensorsApiResponse,
  HistoryApiResponse,
  UserProfileResponse,
} from "../types"

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"

export const AUTH_TOKEN_KEY = "iot_auth_token"

export interface LoginResponse {
  success: boolean
  message: string
  token: string
  user: {
    user_id: number
    username: string
    name: string
    student_id: string
    email: string
  }
}

/**
 * 0. POST /api/auth/login
 * Đăng nhập và nhận Token JWT
 */
export async function login(username: string, password: string): Promise<LoginResponse> {
  return request<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  })
}

/**
 * Hàm helper xử lý fetch chung, tự động đính kèm Token và parse JSON
 */
async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  const token = typeof window !== "undefined" ? localStorage.getItem(AUTH_TOKEN_KEY) : null

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
    ...options,
  })

  if (!response.ok) {
    let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`

    try {
      const errorJson = await response.json()
      if (errorJson?.message) {
        errorMessage = errorJson.message
      }
    } catch {
      // Bỏ qua nếu không parse được JSON lỗi
    }

    if (response.status === 401 && endpoint !== "/auth/login" && endpoint !== "/login") {
      try {
        localStorage.removeItem(AUTH_TOKEN_KEY)
        localStorage.removeItem("iot_smart_classroom_logged_in")
        window.dispatchEvent(new Event("iot_auth_unauthorized"))
      } catch {}
    }

    throw new Error(errorMessage)
  }

  return response.json() as Promise<T>
}

/**
 * 1. GET /api/device-states
 * Lấy trạng thái hiện tại của tất cả thiết bị
 */

export async function getDeviceStates(): Promise<DeviceStatesResponse> {
  return request<DeviceStatesResponse>("/device-states")
}

/**
 * 2. POST /api/devices/:device_id/control
 * Gửi lệnh điều khiển bật/tắt thiết bị (device_id: 1=Đèn, 2=Quạt, 3=Điều hòa)
 */

export async function controlDevice(
  deviceId: number,

  action: "ON" | "OFF" | "TOGGLE",
): Promise<DeviceControlResponse> {
  return request<DeviceControlResponse>(`/devices/${deviceId}/control`, {
    method: "POST",

    body: JSON.stringify({ action }),
  })
}

/**
 * 3. GET /api/sensors
 * Lấy dữ liệu đo cảm biến kèm phân trang, sắp xếp và tìm kiếm
 */

export interface GetSensorsParams {
  page?: number

  limit?: number

  sort_key?: "data_id" | "sensor_name" | "sensor_type" | "value" | "recorded_at"

  sort_dir?: "ASC" | "DESC"

  search_field?: "sensor_name" | "sensor_type" | "recorded_at" | "all"

  search_value?: string

  sensor_type?: string
}

export async function getSensors(
  params?: GetSensorsParams,
): Promise<SensorsApiResponse> {
  const searchParams = new URLSearchParams()

  if (params?.page !== undefined) searchParams.set("page", String(params.page))

  if (params?.limit !== undefined)
    searchParams.set("limit", String(params.limit))

  if (params?.sort_key) searchParams.set("sort_key", params.sort_key)

  if (params?.sort_dir) searchParams.set("sort_dir", params.sort_dir)

  if (params?.search_field)
    searchParams.set("search_field", params.search_field)

  if (params?.search_value)
    searchParams.set("search_value", params.search_value)

  if (params?.sensor_type) searchParams.set("sensor_type", params.sensor_type)

  const queryString = searchParams.toString()

  const endpoint = queryString ? `/sensors?${queryString}` : "/sensors"

  return request<SensorsApiResponse>(endpoint)
}

/**
 * 4. GET /api/history
 * Lấy lịch sử thao tác bật/tắt thiết bị kèm phân trang và tìm kiếm
 */

export interface GetHistoryParams {
  page?: number

  limit?: number

  sort_key?: "id" | "device" | "action" | "time" | "status"

  sort_dir?: "ASC" | "DESC"

  search_field?: "device" | "action" | "status" | "all"

  search_value?: string

  device?: string

  action?: "ON" | "OFF" | ""

  status?: "ON" | "OFF" | "PENDING" | "FAILED" | ""
}

export async function getHistory(
  params?: GetHistoryParams,
): Promise<HistoryApiResponse> {
  const searchParams = new URLSearchParams()

  if (params?.page !== undefined) searchParams.set("page", String(params.page))

  if (params?.limit !== undefined)
    searchParams.set("limit", String(params.limit))

  if (params?.sort_key) searchParams.set("sort_key", params.sort_key)

  if (params?.sort_dir) searchParams.set("sort_dir", params.sort_dir)

  if (params?.search_field)
    searchParams.set("search_field", params.search_field)

  if (params?.search_value)
    searchParams.set("search_value", params.search_value)

  if (params?.device) searchParams.set("device", params.device)

  if (params?.action) searchParams.set("action", params.action)

  if (params?.status) searchParams.set("status", params.status)

  const queryString = searchParams.toString()

  const endpoint = queryString ? `/history?${queryString}` : "/history"

  return request<HistoryApiResponse>(endpoint)
}

/**
 * 5. GET /api/profile
 * Lấy thông tin hồ sơ người dùng
 */

export async function getProfile(): Promise<UserProfileResponse> {
  return request<UserProfileResponse>("/profile")
}
