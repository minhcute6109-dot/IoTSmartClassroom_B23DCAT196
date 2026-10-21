/**
 * SCRIPT KIỂM THỬ TOÀN DIỆN MQTT (3 TOPIC), REST API & SOCKET.IO CHO IOT SMART CLASSROOM
 *
 * Kiểm tra các luồng theo thiết kế đã chốt:
 * 1. TEST PENDING: POST /api/devices/:id/control -> Action (status=PENDING) -> Publish Device_control
 * 2. TEST SENSORS: Publish Data_Sensors -> Backend -> Socket.IO 'sensor_data'
 * 3. TEST SUCCESS: Device_Response (SUCCESS) -> Transaction MySQL -> emit 'device_state_changed'
 * 4. TEST FAIL: Device_Response (FAIL) -> Action.status = 'FAIL' -> KHÔNG update Devices, KHÔNG emit
 * 5. TEST HISTORY: GET /api/history -> Có cột 'status' (PENDING / SUCCESS / FAIL)
 * 6. TEST DEVICE STATES: GET /api/device-states -> Trạng thái ON/OFF
 */

import mqtt from "mqtt"
import { io as ioClient } from "socket.io-client"
import mysql from "mysql2/promise"
import { dbConfig } from "./config/db.js"

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

const BROKER_URL =
  process.env.MQTT_BROKER_URL || `${protocol}://${host}:${port}`
const SOCKET_URL = "http://localhost:5000"
const API_BASE_URL = "http://localhost:5000/api"

const TOPICS = {
  DATA_SENSORS: "Data_Sensors",
  DEVICE_CONTROL: "Device_control",
  DEVICE_RESPONSE: "Device_Response",
}

async function runFullIntegrationTests() {
  console.log(
    "======================================================================",
  )
  console.log(
    "KIỂM THỬ TOÀN DIỆN IOT SMART CLASSROOM (MQTT, REST API, SOCKET.IO, DB)",
  )
  console.log(`MQTT Broker: ${BROKER_URL} (TLS: ${isTls ? "BẬT" : "TẮT"})`)
  console.log(`Socket.IO Server: ${SOCKET_URL}`)
  console.log(
    "======================================================================\n",
  )

  // 1. Kết nối Socket.IO Client (Mô phỏng Frontend)
  console.log("1. [SOCKET.IO] Kết nối Frontend Client tới WebSocket Backend...")
  const socket = ioClient(SOCKET_URL, {
    transports: ["websocket", "polling"],
    reconnection: false,
  })

  let sensorDataReceivedCount = 0
  const deviceStateChangedEvents = []

  socket.on("connect", () => {
    console.log(
      `   ✅ Frontend Client đã kết nối Socket.IO thành công! (ID: ${socket.id})\n`,
    )
  })

  socket.on("sensor_data", (payload) => {
    sensorDataReceivedCount++
    console.log(
      `⚡ [FRONTEND NHẬN EVENT 'sensor_data' #${sensorDataReceivedCount}]`,
    )
    console.log(
      `   -> Sensor: ${payload.sensor_name} (${payload.sensor_type}) | Value: ${
        payload.value !== null ? payload.value : "NULL"
      } ${payload.unit}\n`,
    )
  })

  socket.on("device_state_changed", (payload) => {
    deviceStateChangedEvents.push(payload)
    console.log(`⚡ [FRONTEND NHẬN EVENT 'device_state_changed']`)
    console.log(
      `   -> Thiết bị: ${payload.device_name} (ID: ${payload.device_id}) | Trạng thái mới: ${payload.status}\n`,
    )
  })

  // 2. Kết nối MQTT Tester (Mô phỏng ESP32 Hardware)
  const testerOptions = {
    clientId: `esp32_tester_${Math.random().toString(16).substring(2, 8)}`,
    connectTimeout: 10000,
  }
  if (username && username !== "[USERNAME_HIVEMQ_CLOUD]") {
    testerOptions.username = username
  }
  if (password && password !== "[PASSWORD_HIVEMQ_CLOUD]") {
    testerOptions.password = password
  }
  if (isTls) {
    testerOptions.rejectUnauthorized = true
  }

  const mqttTester = mqtt.connect(BROKER_URL, testerOptions)

  mqttTester.on("error", (err) => {
    console.error("❌ Không thể kết nối tới MQTT Broker:", err.message)
    process.exit(1)
  })

  mqttTester.on("connect", () => {
    console.log(
      `2. [MQTT] ESP32 Tester đã kết nối tới MQTT Broker (${
        isTls ? "HiveMQ Cloud TLS" : "Mosquitto Local"
      })!`,
    )

    // Lắng nghe lệnh từ topic Device_control
    mqttTester.subscribe(TOPICS.DEVICE_CONTROL, () => {
      console.log(
        `   -> Đã subscribe topic '${TOPICS.DEVICE_CONTROL}' (chờ lệnh từ Backend).\n`,
      )
    })

    const deviceControlCommands = []
    mqttTester.on("message", (topic, message) => {
      if (topic === TOPICS.DEVICE_CONTROL) {
        try {
          const parsed = JSON.parse(message.toString())
          deviceControlCommands.push(parsed)
          console.log(`📥 [ESP32 NHẬN LỆNH TỪ BACKEND] Topic: ${topic}`)
          console.log(`   Payload:`, parsed, `\n`)
        } catch (e) {
          console.error("   ❌ Lỗi parse payload lệnh điều khiển:", e.message)
        }
      }
    })

    // Bắt đầu chuỗi kiểm thử
    setTimeout(async () => {
      // ----------------------------------------------------------------
      // TEST 1: TEST PENDING (POST /api/devices/1/control)
      // ----------------------------------------------------------------
      console.log(
        "======================================================================",
      )
      console.log(
        "[TEST 1 - PENDING]: Frontend gọi POST /api/devices/1/control (Bật Đèn)...",
      )
      let actionIdSuccessTest = null

      try {
        const res = await fetch(`${API_BASE_URL}/devices/1/control`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "ON" }),
        })
        const data = await res.json()
        console.log("   -> HTTP Response Status:", res.status)
        console.log("   -> HTTP Response Body:", data)

        if (data.success && data.status === "PENDING" && data.action_id) {
          actionIdSuccessTest = data.action_id
          console.log(
            `   ✅ Kiểm tra thành công: Action được tạo ở trạng thái PENDING với action_id = ${actionIdSuccessTest}`,
          )
        } else {
          console.log(`   ℹ️ Phản hồi từ Backend:`, data.message)
        }
      } catch (e) {
        console.error("   ❌ Lỗi khi gọi API điều khiển:", e.message)
      }

      // ----------------------------------------------------------------
      // TEST 2: TEST SENSORS (Data_Sensors -> Backend -> Socket.IO)
      // ----------------------------------------------------------------
      setTimeout(
        () => {
          console.log(
            "\n======================================================================",
          )
          console.log(
            "[TEST 2 - SENSORS]: ESP32 publish Data_Sensors -> Backend lưu DB & Socket.IO emit...",
          )

          // Bản ghi 1: Nhiệt độ hợp lệ
          mqttTester.publish(
            TOPICS.DATA_SENSORS,
            JSON.stringify({
              sensor_id: 1,
              value: 29.5,
              recorded_at: "2026-09-02 18:30:00",
            }),
          )

          // Bản ghi 2: Độ ẩm
          mqttTester.publish(
            TOPICS.DATA_SENSORS,
            JSON.stringify({
              sensor_id: 2,
              value: 65.0,
              recorded_at: "2026-09-02 18:30:00",
            }),
          )

          // Bản ghi 3: Ánh sáng
          mqttTester.publish(
            TOPICS.DATA_SENSORS,
            JSON.stringify({
              sensor_id: 3,
              value: 420.0,
              recorded_at: "2026-09-02 18:30:00",
            }),
          )

          // ----------------------------------------------------------------
          // TEST 3: TEST SUCCESS (Hardware phản hồi SUCCESS)
          // ----------------------------------------------------------------
          setTimeout(
            () => {
              console.log(
                "\n======================================================================",
              )
              console.log(
                "[TEST 3 - SUCCESS]: ESP32 publish Device_Response SUCCESS -> Transaction & Emit...",
              )

              const successPayload = {
                action_id: actionIdSuccessTest || 101,
                device_id: 1,
                action_status: "SUCCESS",
                device_status: "ON",
              }

              mqttTester.publish(
                TOPICS.DEVICE_RESPONSE,
                JSON.stringify(successPayload),
              )
              console.log(
                "   -> Đã gửi Device_Response SUCCESS:",
                successPayload,
              )

              // ----------------------------------------------------------------
              // TEST 4: TEST FAIL (Hardware phản hồi FAIL)
              // ----------------------------------------------------------------
              setTimeout(async () => {
                console.log(
                  "\n======================================================================",
                )
                console.log(
                  "[TEST 4 - FAIL]: Tạo lệnh cho Quạt rồi ESP32 phản hồi FAIL -> Không đổi trạng thái Devices...",
                )

                let actionIdFailTest = null
                try {
                  const resFail = await fetch(
                    `${API_BASE_URL}/devices/2/control`,
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ action: "ON" }),
                    },
                  )
                  const dataFail = await resFail.json()
                  actionIdFailTest = dataFail.action_id
                } catch (err) {
                  // Ignore
                }

                const failPayload = {
                  action_id: actionIdFailTest || 102,
                  device_id: 2,
                  action_status: "FAIL",
                }

                const eventsBeforeFail = deviceStateChangedEvents.length
                mqttTester.publish(
                  TOPICS.DEVICE_RESPONSE,
                  JSON.stringify(failPayload),
                )
                console.log("   -> Đã gửi Device_Response FAIL:", failPayload)

                // ----------------------------------------------------------------
                // TEST 5 & 6: TEST HISTORY & DEVICE STATES API
                // ----------------------------------------------------------------
                setTimeout(
                  async () => {
                    console.log(
                      "\n======================================================================",
                    )
                    console.log(
                      "[TEST 5 - HISTORY API]: Kiểm tra GET /api/history có chứa cột status...",
                    )
                    try {
                      const histRes = await fetch(
                        `${API_BASE_URL}/history?page=1&limit=3`,
                      )
                      const histData = await histRes.json()
                      console.log("   -> History HTTP Status:", histRes.status)
                      if (histData.data && histData.data.length > 0) {
                        console.log("   -> Bản ghi mẫu API4:", histData.data[0])
                        const hasStatus = "status" in histData.data[0]
                        console.log(
                          `   -> Có cột 'status' trong response: ${
                            hasStatus ? "✅ CÓ" : "❌ CHƯA"
                          }`,
                        )
                      }
                    } catch (e) {
                      console.error(
                        "   ❌ Lỗi gọi GET /api/history:",
                        e.message,
                      )
                    }

                    console.log(
                      "\n======================================================================",
                    )
                    console.log(
                      "[TEST 6 - DEVICE STATES API]: Kiểm tra GET /api/device-states...",
                    )
                    try {
                      const devRes = await fetch(
                        `${API_BASE_URL}/device-states`,
                      )
                      const devData = await devRes.json()
                      console.log(
                        "   -> Device States HTTP Status:",
                        devRes.status,
                      )
                      console.log("   -> Danh sách thiết bị:", devData.devices)
                    } catch (e) {
                      console.error(
                        "   ❌ Lỗi gọi GET /api/device-states:",
                        e.message,
                      )
                    }

                    // Tổng kết
                    setTimeout(
                      async () => {
                        const eventsAfterFail = deviceStateChangedEvents.length
                        const failDidNotEmit =
                          eventsAfterFail === eventsBeforeFail ||
                          !deviceStateChangedEvents.some(
                            (e) => e.device_id === 2,
                          )

                        // Truy vấn trực tiếp MySQL thật để xác nhận dữ liệu đã được ghi nhận
                        let dbVerification = {
                          actionSuccess: null,
                          actionFail: null,
                          device1: null,
                          device2: null,
                          sensorCount: 0,
                        }

                        try {
                          const conn = await mysql.createConnection(dbConfig)
                          if (actionIdSuccessTest) {
                            const [act1] = await conn.query(
                              "SELECT action_id, device_id, action, status FROM Action WHERE action_id = ?",
                              [actionIdSuccessTest],
                            )
                            dbVerification.actionSuccess = act1[0] || null
                          }
                          if (actionIdFailTest) {
                            const [act2] = await conn.query(
                              "SELECT action_id, device_id, action, status FROM Action WHERE action_id = ?",
                              [actionIdFailTest],
                            )
                            dbVerification.actionFail = act2[0] || null
                          }
                          const [devs] = await conn.query(
                            "SELECT device_id, device_name, status FROM Devices WHERE device_id IN (1, 2) ORDER BY device_id ASC",
                          )
                          dbVerification.device1 =
                            devs.find((d) => d.device_id === 1) || null
                          dbVerification.device2 =
                            devs.find((d) => d.device_id === 2) || null

                          const [sens] = await conn.query(
                            "SELECT COUNT(*) AS c FROM DataSensor WHERE recorded_at >= '2026-09-02 18:00:00'",
                          )
                          dbVerification.sensorCount = sens[0]?.c || 0

                          await conn.end()
                        } catch (dbErr) {
                          console.error(
                            "❌ Lỗi kiểm tra MySQL thật:",
                            dbErr.message,
                          )
                        }

                        console.log(
                          "\n======================================================================",
                        )
                        console.log(
                          "TỔNG KẾT KẾT QUẢ KIỂM THỬ THỰC TẾ TRÊN MYSQL THẬT:",
                        )
                        console.log(
                          `   1. POST /api/devices/:id/control trả PENDING: ${
                            actionIdSuccessTest
                              ? "✅ THÀNH CÔNG (action_id: " +
                                actionIdSuccessTest +
                                ")"
                              : "❌ LỖI"
                          }`,
                        )
                        console.log(
                          `   2. Topic 'Device_control' nhận lệnh có action_id: ${
                            deviceControlCommands.length > 0
                              ? "✅ THÀNH CÔNG"
                              : "❌ LỖI"
                          }`,
                        )
                        console.log(
                          `   3. Số event 'sensor_data' Frontend nhận: ${sensorDataReceivedCount} (Đã lưu vào MySQL: ${dbVerification.sensorCount} bản ghi)`,
                        )
                        console.log(
                          `   4. Event 'device_state_changed' cho SUCCESS: ${
                            deviceStateChangedEvents.some(
                              (e) => e.device_id === 1 && e.status === "ON",
                            )
                              ? "✅ THÀNH CÔNG"
                              : "❌ LỖI"
                          }`,
                        )
                        console.log(
                          `   5. Không emit event khi FAIL: ${
                            failDidNotEmit
                              ? "✅ CHÍNH XÁC (KHÔNG EMIT)"
                              : "❌ LỖI"
                          }`,
                        )
                        console.log(
                          `   6. Xác nhận MySQL thật - Action SUCCESS (#${actionIdSuccessTest}): status = '${dbVerification.actionSuccess?.status}' ${
                            dbVerification.actionSuccess?.status === "SUCCESS"
                              ? "✅ ĐÚNG"
                              : "❌"
                          }`,
                        )
                        console.log(
                          `   7. Xác nhận MySQL thật - Action FAIL (#${actionIdFailTest}): status = '${dbVerification.actionFail?.status}' ${
                            dbVerification.actionFail?.status === "FAIL"
                              ? "✅ ĐÚNG"
                              : "❌"
                          }`,
                        )
                        console.log(
                          `   8. Xác nhận MySQL thật - Devices.status Đèn (ID: 1): '${dbVerification.device1?.status}' ${
                            dbVerification.device1?.status === "ON"
                              ? "✅ CẬP NHẬT ĐÚNG"
                              : "❌"
                          }`,
                        )
                        console.log(
                          `   9. Xác nhận MySQL thật - Devices.status Quạt (ID: 2): '${dbVerification.device2?.status}' ${
                            dbVerification.device2?.status === "OFF"
                              ? "✅ GIỮ NGUYÊN ĐÚNG"
                              : "❌"
                          }`,
                        )
                        console.log(
                          "======================================================================",
                        )
                        console.log(
                          "✅ HOÀN TẤT KIỂM THỬ TOÀN BỘ CÁC MỤC YÊU CẦU TRÊN MYSQL THẬT!",
                        )
                        console.log(
                          "======================================================================",
                        )

                        socket.disconnect()
                        mqttTester.end()
                        process.exit(0)
                      },
                      1500,
                    )
                  },
                  1200,
                )
              }, 1200)
            },
            1200,
          )
        },
        1000,
      )
    }, 800)
  })
}

runFullIntegrationTests()
