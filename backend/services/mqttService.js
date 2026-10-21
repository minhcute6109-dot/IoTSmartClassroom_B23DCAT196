/**
 * DỊCH VỤ MQTT (ECLIPSE MOSQUITTO) CHO BACKEND
 *
 * Hệ thống sử dụng CHỈ ĐÚNG 3 MQTT TOPIC:
 * 1. Data_Sensors   - Nhận dữ liệu đo nhiệt độ, độ ẩm, ánh sáng từ ESP32 gửi lên (SUBSCRIBE)
 * 2. Device_control  - Gửi lệnh điều khiển bật/tắt thiết bị từ Backend xuống ESP32 (PUBLISH)
 * 3. Device_Response - Nhận phản hồi trạng thái thực tế từ ESP32 sau khi thực thi (SUBSCRIBE)
 *
 * QUY TẮC PHÁT SỰ KIỆN REALTIME SOCKET.IO:
 * - CHỈ emit "sensor_data" SAU KHI INSERT MySQL DataSensor thành công (dùng insertId thực tế, không dùng Date.now()).
 * - Nếu INSERT thất bại -> log lỗi, KHÔNG emit sensor_data, return khỏi hàm.
 * - Device_Response xử lý 2 trường hợp:
 *   + FAIL: Cập nhật Action.status = 'FAIL', KHÔNG update Devices, KHÔNG emit Socket.IO.
 *   + SUCCESS: MySQL Transaction (UPDATE Devices & UPDATE Action status='SUCCESS'), COMMIT thành công -> emit "device_state_changed".
 */

import mqtt from "mqtt"
import { pool } from "../config/db.js"
import {
  emitSensorData,
  emitDeviceStateChanged,
  emitActionUpdated,
} from "./socketService.js"

export const MQTT_TOPICS = Object.freeze({
  DATA_SENSORS: "Data_Sensors",
  DEVICE_CONTROL: "Device_control",
  DEVICE_RESPONSE: "Device_Response",
})

// Danh mục và quy tắc kiểm tra 3 cảm biến
const SENSOR_RULES = {
  1: {
    name: "Cảm biến nhiệt độ",
    type: "Nhiệt độ",
    unit: "°C",
    min: 0,
    max: 50,
  },
  2: {
    name: "Cảm biến độ ẩm",
    type: "Độ ẩm",
    unit: "%",
    min: 20,
    max: 90,
  },
  3: {
    name: "Cảm biến ánh sáng",
    type: "Ánh sáng",
    unit: "lux",
    min: 0,
    max: 1000,
  },
}

const DEVICE_NAMES = {
  1: "Đèn",
  2: "Quạt",
  3: "Điều hòa",
}

let client = null

/**
 * Khởi tạo kết nối MQTT Client tới Broker (Hỗ trợ Mosquitto Local & HiveMQ Cloud TLS)
 */
export function initMqttService() {
  const host = process.env.MQTT_HOST || "localhost"
  const port =
    parseInt(process.env.MQTT_PORT, 10) || (process.env.MQTT_HOST ? 8883 : 1883)
  const isTls =
    port === 8883 ||
    host.includes("hivemq.cloud") ||
    (process.env.MQTT_BROKER_URL &&
      process.env.MQTT_BROKER_URL.startsWith("mqtts://"))

  const protocol = isTls ? "mqtts" : "mqtt"
  const username = process.env.MQTT_USER || process.env.MQTT_USERNAME || ""
  const password = process.env.MQTT_PASS || process.env.MQTT_PASSWORD || ""

  const defaultBrokerUrl = `${protocol}://${host}:${port}`
  const brokerUrl = process.env.MQTT_BROKER_URL || defaultBrokerUrl

  const clientId = `backend_server_${Math.random().toString(16).substring(2, 8)}`

  console.log(
    `⏳ [MQTT Service]: Đang kết nối tới MQTT Broker tại ${brokerUrl} (TLS: ${
      isTls ? "BẬT" : "TẮT"
    })...`,
  )

  const connectOptions = {
    clientId,
    reconnectPeriod: 5000, // Tự động kết nối lại sau 5 giây nếu broker bị ngắt
    connectTimeout: 15000,
  }

  if (username && username !== "[USERNAME_HIVEMQ_CLOUD]") {
    connectOptions.username = username
  }
  if (password && password !== "[PASSWORD_HIVEMQ_CLOUD]") {
    connectOptions.password = password
  }
  if (isTls) {
    connectOptions.rejectUnauthorized = true
  }

  client = mqtt.connect(brokerUrl, connectOptions)

  // 1. Sự kiện kết nối thành công
  client.on("connect", () => {
    console.log("====================================================")
    console.log(
      `✅ [MQTT Service]: Đã kết nối thành công tới MQTT Broker (${
        isTls ? "HiveMQ Cloud TLS" : "Mosquitto Local"
      })!`,
    )
    console.log(`📡 Đang Subscribe 2 topic:`)
    console.log(`   1. [SUB] ${MQTT_TOPICS.DATA_SENSORS}`)
    console.log(`   2. [SUB] ${MQTT_TOPICS.DEVICE_RESPONSE}`)
    console.log(`   3. [PUB SẴN SÀNG] ${MQTT_TOPICS.DEVICE_CONTROL}`)
    console.log("====================================================")

    // Subscribe đúng 2 topic theo quy định
    client.subscribe(
      [MQTT_TOPICS.DATA_SENSORS, MQTT_TOPICS.DEVICE_RESPONSE],
      (err) => {
        if (err) {
          console.error(
            "❌ [MQTT Service]: Lỗi khi subscribe topic:",
            err.message,
          )
        }
      },
    )
  })

  // 2. Sự kiện nhận message từ các topic đã subscribe
  client.on("message", async (topic, message) => {
    try {
      const messageStr = message.toString()
      const payload = JSON.parse(messageStr)

      // Xử lý TOPIC 1: Data_Sensors
      if (topic === MQTT_TOPICS.DATA_SENSORS) {
        await handleDataSensorsMessage(payload)
      }
      // Xử lý TOPIC 3: Device_Response
      else if (topic === MQTT_TOPICS.DEVICE_RESPONSE) {
        await handleDeviceResponseMessage(payload)
      }
    } catch (error) {
      console.error(
        `❌ [MQTT Service]: Lỗi khi xử lý message từ topic '${topic}':`,
        error.message,
      )
    }
  })

  // 3. Xử lý lỗi và mất kết nối (Không để crash Backend)
  client.on("error", (err) => {
    console.error("⚠️ [MQTT Service]: Lỗi kết nối MQTT Broker:", err.message)
  })

  client.on("offline", () => {
    console.warn(
      "⚠️ [MQTT Service]: Mất kết nối tới MQTT Broker. Đang chờ kết nối lại...",
    )
  })

  client.on("reconnect", () => {
    console.log("🔄 [MQTT Service]: Đang thử kết nối lại tới MQTT Broker...")
  })

  return client
}

/**
 * Xử lý dữ liệu từ topic `Data_Sensors`
 * Luồng: ESP32 -> Data_Sensors -> Mosquitto -> Backend -> validate -> INSERT DataSensor -> INSERT thành công -> emit "sensor_data" -> Frontend
 */
async function handleDataSensorsMessage(payload) {
  const { sensor_id, value, recorded_at } = payload || {}
  const numericSensorId = parseInt(sensor_id, 10)

  if (isNaN(numericSensorId) || !SENSOR_RULES[numericSensorId]) {
    console.warn(
      `⚠️ [MQTT Data_Sensors]: sensor_id '${sensor_id}' không tồn tại trong danh mục Sensors. Bỏ qua.`,
    )
    return
  }

  const rule = SENSOR_RULES[numericSensorId]
  const finalValue = value !== undefined && value !== null && !isNaN(Number(value)) ? Number(value) : null

  // Định dạng thời gian ghi nhận (chuẩn giờ local, không 'Z')
  const now = new Date()
  const defaultRecordedAt = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`
  const finalRecordedAt = recorded_at || defaultRecordedAt

  // 1. Thực hiện INSERT vào bảng DataSensor trong MySQL (4 cột chuẩn)
  try {
    const [insertResult] = await pool.query(
      "INSERT INTO DataSensor (sensor_id, value, recorded_at) VALUES (?, ?, ?)",
      [numericSensorId, finalValue, finalRecordedAt],
    )

    const data_id = insertResult.insertId
    console.log(
      `📥 [MQTT Data_Sensors]: Đã lưu điểm đo #${data_id} vào MySQL -> Sensor: ${rule.name} (ID: ${numericSensorId}), Value: ${
        finalValue !== null ? finalValue : "NULL"
      } ${rule.unit}`,
    )

    // 2. CHỈ phát sự kiện Realtime 'sensor_data' sau khi INSERT MySQL THÀNH CÔNG (sử dụng data_id thực tế)
    const socketPayload = {
      data_id,
      sensor_id: numericSensorId,
      sensor_name: rule.name,
      sensor_type: rule.type,
      value: finalValue,
      unit: rule.unit,
      recorded_at: finalRecordedAt,
    }

    emitSensorData(socketPayload)
  } catch (dbError) {
    // Nếu INSERT thất bại: log lỗi, KHÔNG emit sensor_data, return khỏi hàm
    console.error(
      "❌ [MQTT Data_Sensors]: Lỗi khi lưu vào MySQL DataSensor (KHÔNG emit Socket.IO):",
      dbError.message,
    )
    return
  }
}

/**
 * Xử lý xác nhận trạng thái phần cứng từ topic `Device_Response`
 * Payload nhận:
 * - SUCCESS: { "action_id": 123, "device_id": 1, "action_status": "SUCCESS", "device_status": "ON" }
 * - FAIL:    { "action_id": 123, "device_id": 1, "action_status": "FAIL" }
 */
async function handleDeviceResponseMessage(payload) {
  const { action_id, device_id, action_status, device_status } = payload || {}
  const numericActionId = parseInt(action_id, 10)
  const numericDeviceId = parseInt(device_id, 10)
  const normalizedActionStatus = action_status
    ? String(action_status).toUpperCase()
    : ""
  const normalizedDeviceStatus = device_status
    ? String(device_status).toUpperCase()
    : ""

  if (isNaN(numericActionId)) {
    console.warn(
      `⚠️ [MQTT Device_Response]: action_id '${action_id}' không hợp lệ. Bỏ qua.`,
    )
    return
  }

  if (![1, 2, 3].includes(numericDeviceId)) {
    console.warn(
      `⚠️ [MQTT Device_Response]: device_id '${device_id}' không hợp lệ. Bỏ qua.`,
    )
    return
  }

  if (!["SUCCESS", "FAIL"].includes(normalizedActionStatus)) {
    console.warn(
      `⚠️ [MQTT Device_Response]: action_status '${action_status}' không hợp lệ (chỉ nhận SUCCESS hoặc FAIL).`,
    )
    return
  }

  const deviceName = DEVICE_NAMES[numericDeviceId]

  // ==========================================
  // TRƯỜNG HỢP 1: Hardware phản hồi FAIL
  // ==========================================
  if (normalizedActionStatus === "FAIL") {
    try {
      await pool.query(
        'UPDATE Action SET status = "FAIL" WHERE action_id = ?',
        [numericActionId],
      )
      emitActionUpdated({
        action_id: numericActionId,
        device_id: numericDeviceId,
        action: null,
        status: "FAIL",
        response_time: new Date(),
      })
      console.log(
        `⚠️ [MQTT Device_Response]: Hardware phản hồi FAIL cho action_id #${numericActionId} (Thiết bị ${deviceName}). Đã cập nhật Action.status = 'FAIL' và phát event 'action_updated'.`,
      )
    } catch (dbError) {
      console.error(
        "❌ [MQTT Device_Response]: Lỗi khi cập nhật Action FAIL:",
        dbError.message,
      )
    }
    return
  }

  // ==========================================
  // TRƯỜNG HỢP 2: Hardware phản hồi SUCCESS
  // ==========================================
  if (normalizedActionStatus === "SUCCESS") {
    if (!["ON", "OFF"].includes(normalizedDeviceStatus)) {
      console.warn(
        `⚠️ [MQTT Device_Response]: device_status '${device_status}' không hợp lệ (chỉ nhận ON hoặc OFF).`,
      )
      return
    }

    let connection = null
    try {
      // Bắt đầu MySQL Transaction
      connection = await pool.getConnection()
      await connection.beginTransaction()

      // 1. Cập nhật trạng thái thực tế vào bảng Devices
      const [devResult] = await connection.query(
        "UPDATE Devices SET status = ? WHERE device_id = ?",
        [normalizedDeviceStatus, numericDeviceId],
      )

      if (devResult.affectedRows === 0) {
        throw new Error(
          `Không tìm thấy device_id ${numericDeviceId} để cập nhật trạng thái.`,
        )
      }

      // 2. Cập nhật cùng bản ghi Action sang trạng thái 'SUCCESS'
      await connection.query(
        'UPDATE Action SET status = "SUCCESS" WHERE action_id = ?',
        [numericActionId],
      )

      // 3. COMMIT transaction khi cả 2 thao tác thành công
      await connection.commit()

      console.log(
        `✅ [MQTT Device_Response]: Transaction thành công (COMMIT) -> Thiết bị ${deviceName} = ${normalizedDeviceStatus}, Action #${numericActionId} = SUCCESS`,
      )

      // 4. CHỈ phát sự kiện Realtime SAU KHI COMMIT THÀNH CÔNG
      emitDeviceStateChanged({
        device_id: numericDeviceId,
        device_name: deviceName,
        status: normalizedDeviceStatus,
      })
      emitActionUpdated({
        action_id: numericActionId,
        device_id: numericDeviceId,
        action: normalizedDeviceStatus,
        status: "SUCCESS",
        response_time: new Date(),
      })
    } catch (dbError) {
      if (connection) {
        try {
          await connection.rollback()
          console.warn(
            `🔄 [MQTT Device_Response]: Đã ROLLBACK transaction do lỗi: ${dbError.message}`,
          )
        } catch (rollbackErr) {
          console.error(
            `❌ [MQTT Device_Response]: Lỗi khi rollback:`,
            rollbackErr.message,
          )
        }
      }
      console.error(
        "❌ [MQTT Device_Response]: Lỗi Database trong Transaction (KHÔNG emit Socket.IO):",
        dbError.message,
      )
      return
    } finally {
      if (connection) connection.release()
    }
  }
}

/**
 * Gửi lệnh điều khiển thiết bị xuống ESP32 qua topic `Device_control`
 * Payload chuẩn: { "action_id": 123, "device_id": 1, "action": "ON" }
 */
export function publishDeviceControl(actionId, deviceId, action) {
  const numericDeviceId = parseInt(deviceId, 10)
  const normalizedAction = String(action).toUpperCase()

  const payload = JSON.stringify({
    action_id: actionId,
    device_id: numericDeviceId,
    action: normalizedAction,
  })

  return new Promise((resolve) => {
    if (client && client.connected) {
      client.publish(MQTT_TOPICS.DEVICE_CONTROL, payload, { qos: 1 }, (err) => {
        if (err) {
          console.error(
            "❌ [MQTT Device_control]: Lỗi khi publish lệnh điều khiển:",
            err.message,
          )
          resolve(false)
        } else {
          console.log(
            `📤 [MQTT Device_control]: Đã phát lệnh thành công -> ${payload}`,
          )
          resolve(true)
        }
      })
    } else {
      console.warn(
        `⚠️ [MQTT Device_control]: MQTT Client chưa kết nối tới Broker. Lệnh '${payload}' chưa được gửi qua MQTT.`,
      )
      resolve(false)
    }
  })
}
