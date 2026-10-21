/**
 * Định nghĩa tất cả các kiểu dữ liệu (Types & Interfaces) cho hệ thống IoT Smart Classroom.
 * Tập trung tại một file giúp sinh viên dễ học, dễ tra cứu và bảo trì.
 */

// 1. Điều hướng các trang trong hệ thống

export type Page = "dashboard" | "data-sensor" | "action-history" | "profile"

// 2. Trạng thái bật/tắt của 3 thiết bị phòng học

export interface DeviceState {
  light: boolean // Đèn

  fan: boolean // Quạt

  ac: boolean // Điều hòa
}

// 3. Tên thiết bị và loại hành động

export type DeviceName = "Đèn" | "Quạt" | "Điều hòa"

export type DeviceAction = "ON" | "OFF"

// 4. Một điểm dữ liệu cảm biến dùng để vẽ biểu đồ Realtime trên Dashboard

export interface SensorChartPoint {
  time: string // Chuỗi thời gian định dạng HH:mm:ss

  temp: number // Nhiệt độ (°C)

  humidity: number // Độ ẩm (%)

  light: number // Ánh sáng (lux)
}

// 5. Chất lượng của bản ghi dữ liệu cảm biến

export type SensorQuality = "Hợp lệ" | "Không hợp lệ"

// 6. Cấu trúc một bản ghi dữ liệu cảm biến trong UI Data Sensor

export interface SensorRecord {
  id: number

  sensorName: string

  sensorType: string

  value: number | null

  unit: string

  quality?: SensorQuality

  errorReason?: string // Nguyên nhân nếu dữ liệu không hợp lệ

  datetime: Date
}

// 7. Cấu trúc một bản ghi lịch sử bật/tắt thiết bị trong UI Action History

export type ActionStatus = "ON" | "OFF" | "PENDING" | "FAILED"

export type ActionApiStatus = "PENDING" | "SUCCESS" | "FAIL"

export interface ActionRecord {
  id: number

  device: DeviceName

  action: DeviceAction

  status: ActionStatus

  datetime: Date

  responseTime?: Date | null
}

// 8. Bộ lọc chi tiết cho trang Data Sensor

export interface SensorDetailFilter {
  weekday: string

  day: string

  month: string

  year: string

  hour: string

  minute: string

  second: string

  sensorType: string

  quality: string
}

// 9. Bộ lọc chi tiết cho trang Action History

export interface ActionDetailFilter {
  weekday: string

  day: string

  month: string

  year: string

  hour: string

  minute: string

  second: string

  device: string

  action: string

  status?: string
}

// 10. Thứ tự sắp xếp dữ liệu bảng

export type SortDirection = "asc" | "desc"

// 11. Cấu trúc tài khoản đăng nhập

export interface UserCredential {
  username: string

  password: string
}

// ==========================================

// 12. CÁC KIỂU DỮ LIỆU TỪ BACKEND REST API (SRS)

// ==========================================

export interface DeviceItem {
  device_id: number

  device_name: string

  status: "ON" | "OFF"
}

export interface DeviceStatesResponse {
  devices: DeviceItem[]
}

export interface DeviceControlResponse {
  success: boolean

  action_id: number

  device_id: number

  device_name: string

  action: "ON" | "OFF"

  status: "PENDING" | "FAIL"

  message: string
}

export interface SensorApiRecord {
  data_id: number

  sensor_id: number

  sensor_name: string

  sensor_type: string

  value: number | null

  unit: string

  recorded_at: string

  quality?: "Hợp lệ" | "Không hợp lệ"

  error_message?: string | null
}

export interface SensorsApiResponse {
  success: boolean

  data: SensorApiRecord[]

  pagination: {
    page: number

    limit: number

    total: number
  }
}

export interface HistoryApiRecord {
  id: number

  device: DeviceName

  action: DeviceAction

  status: ActionApiStatus

  time: string

  response_time?: string | null
}

export interface HistoryApiResponse {
  data: HistoryApiRecord[]

  pagination: {
    page: number

    limit: number

    total: number
  }
}

export interface UserProfileResponse {
  user_id: number

  name: string

  student_id: string

  email: string

  username: string

  github_url: string

  figma_url: string

  api_doc_url: string

  pdf_report_url: string
}
