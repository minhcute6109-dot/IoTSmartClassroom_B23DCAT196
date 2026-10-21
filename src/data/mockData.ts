import type {
  UserCredential,
  SensorChartPoint,
  SensorRecord,
  ActionRecord,
  SensorDetailFilter,
  ActionDetailFilter,
  DeviceName,
} from "../types"

/**
 * 1. Dữ liệu tài khoản đăng nhập mẫu
 */
export const VALID_CREDENTIALS: UserCredential[] = [
  { username: "admin", password: "123456" },
  { username: "minhanh", password: "123456" },
  { username: "B23DCAT196", password: "123456" },
]

/**
 * 2. Bộ lọc rỗng mặc định
 */
export const EMPTY_SENSOR_FILTER: SensorDetailFilter = {
  weekday: "",
  day: "",
  month: "",
  year: "",
  hour: "",
  minute: "",
  second: "",
  sensorType: "",
  quality: "",
}

export const EMPTY_ACTION_FILTER: ActionDetailFilter = {
  weekday: "",
  day: "",
  month: "",
  year: "",
  hour: "",
  minute: "",
  second: "",
  device: "",
  action: "",
}

/**
 * 3. Sinh dữ liệu điểm đo cảm biến cho biểu đồ Dashboard
 */
export function generateSensorChartPoint(index: number): SensorChartPoint {
  const timeDate = new Date(Date.now() - (19 - index) * 5000)
  const timeLabel = timeDate.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })

  return {
    time: timeLabel,
    temp: +(27 + Math.random() * 1.5).toFixed(1),
    humidity: +(53 + Math.random() * 3).toFixed(1),
    light: +(230 + Math.random() * 30).toFixed(1),
  }
}

// 20 điểm dữ liệu khởi đầu cho biểu đồ Realtime
export const INITIAL_CHART_DATA: SensorChartPoint[] = Array.from(
  { length: 20 },
  (_, index) => generateSensorChartPoint(index),
)

/**
 * 4. Cấu hình định nghĩa các loại cảm biến để sinh dữ liệu mẫu
 */
const SENSOR_DEFINITIONS = [
  {
    name: "Cảm biến nhiệt độ",
    type: "Nhiệt độ",
    unit: "°C",
    generateValidValue: () => +(25 + Math.random() * 7).toFixed(1),
    generateInvalidValue: () => +(45 + Math.random() * 15).toFixed(1),
    errorMessages: [
      "Giá trị vượt quá ngưỡng nhiệt độ cho phép (> 40°C).",
      "Cảm biến phát hiện giá trị bất thường, có thể do nhiễu tín hiệu.",
    ],
  },
  {
    name: "Cảm biến độ ẩm",
    type: "Độ ẩm",
    unit: "%",
    generateValidValue: () => +(50 + Math.random() * 20).toFixed(1),
    generateInvalidValue: () => +(100 + Math.random() * 15).toFixed(1),
    errorMessages: [
      "Độ ẩm vượt mức 100%, dữ liệu không hợp lệ về mặt vật lý.",
      "Cảm biến trả về giá trị ngoài dải đo (0–100%).",
    ],
  },
  {
    name: "Cảm biến ánh sáng",
    type: "Ánh sáng",
    unit: "lux",
    generateValidValue: () => +(180 + Math.random() * 150).toFixed(1),
    generateInvalidValue: () => +(-5 + Math.random() * -10).toFixed(1),
    errorMessages: [
      "Giá trị cường độ ánh sáng âm, cảm biến có thể bị lỗi phần cứng.",
      "Dữ liệu ánh sáng bất thường, vượt ra ngoài phạm vi đo lường.",
    ],
  },
]

/**
 * 5. Sinh 90 bản ghi cảm biến mẫu cho trang Data Sensor
 */
export function generateMockSensorData(): SensorRecord[] {
  const records: SensorRecord[] = []
  const baseTime = new Date("2026-08-16T08:00:00")
  let currentId = 1

  for (let day = 0; day < 5; day++) {
    for (let tick = 0; tick < 6; tick++) {
      const recordTime = new Date(
        baseTime.getTime() +
          day * 86400000 +
          tick * 30 * 60000 +
          Math.floor(Math.random() * 60000),
      )

      for (const definition of SENSOR_DEFINITIONS) {
        const isInvalid = Math.random() < 0.07 // 7% tỉ lệ lỗi giả lập
        const randomError =
          definition.errorMessages[
            Math.floor(Math.random() * definition.errorMessages.length)
          ]

        records.push({
          id: currentId++,
          sensorName: definition.name,
          sensorType: definition.type,
          value: isInvalid
            ? definition.generateInvalidValue()
            : definition.generateValidValue(),
          unit: definition.unit,
          quality: isInvalid ? "Không hợp lệ" : "Hợp lệ",
          errorReason: isInvalid ? randomError : undefined,
          datetime: recordTime,
        })
      }
    }
  }

  return records
}

export const MOCK_SENSOR_DATA: SensorRecord[] = generateMockSensorData()

/**
 * 6. Sinh 60 bản ghi thao tác thiết bị mẫu cho trang Action History
 */
export function generateMockActionData(): ActionRecord[] {
  const devices: DeviceName[] = ["Đèn", "Quạt", "Điều hòa"]
  const actions: ActionRecord[] = []
  const baseTime = new Date("2026-08-16T08:00:00")

  for (let i = 0; i < 60; i++) {
    const actionTime = new Date(
      baseTime.getTime() +
        i * 7 * 60 * 1000 +
        Math.floor(Math.random() * 2 * 60 * 1000),
    )

    actions.push({
      id: i + 1,
      device: devices[Math.floor(Math.random() * devices.length)],
      action: Math.random() > 0.45 ? "ON" : "OFF",
      status: Math.random() > 0.45 ? "ON" : "OFF",
      datetime: actionTime,
    })
  }

  return actions
}

export const MOCK_ACTION_DATA: ActionRecord[] = generateMockActionData()
