/**
 * Các hàm tiện ích dùng chung để định dạng thời gian và dữ liệu hiển thị.
 */

// Danh sách tên thứ trong tuần (Chủ nhật đến Thứ bảy)
export const WEEKDAY_NAMES = [
  "",
  "Chủ nhật",
  "Thứ hai",
  "Thứ ba",
  "Thứ tư",
  "Thứ năm",
  "Thứ sáu",
  "Thứ bảy",
]

/**
 * Định dạng đối tượng Date thành chuỗi chuẩn: DD/MM/YYYY HH:mm:ss
 * Ví dụ: 16/08/2026 08:30:15
 */
export function formatDateTime(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0")
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const year = date.getFullYear()
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  const seconds = String(date.getSeconds()).padStart(2, "0")

  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`
}
