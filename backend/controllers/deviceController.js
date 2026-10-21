/**
 * CONTROLLER XỬ LÝ TRẠNG THÁI & ĐIỀU KHIỂN THIẾT BỊ
 *
 * Ánh xạ API & MQTT:
 * - GET  /api/device-states -> Lấy danh sách trạng thái 3 thiết bị từ bảng `Devices`
 * - POST /api/devices/:device_id/control ->
 *     1. Kiểm tra device_id và action
 *     2. Kiểm tra device_id tồn tại trong bảng Devices
 *     3. Resolve TOGGLE thành ON/OFF dựa trên trạng thái hiện tại
 *     4. INSERT Action với: action = ON/OFF, status = 'PENDING'
 *     5. Lấy action_id
 *     6. Publish Device_control { action_id, device_id, action }
 *     7. Trả về HTTP 200:
 *        {
 *          "success": true,
 *          "action_id": 123,
 *          "device_id": 1,
 *          "device_name": "Đèn",
 *          "action": "ON",
 *          "status": "PENDING",
 *          "message": "Device command accepted"
 *        }
 *     (KHÔNG cập nhật Devices tại bước này; chỉ cập nhật khi nhận Device_Response SUCCESS)
 */

import { pool } from "../config/db.js"
import { publishDeviceControl } from "../services/mqttService.js"
import { emitActionUpdated } from "../services/socketService.js"

const DEVICE_MAP = {
  1: "Đèn",
  2: "Quạt",
  3: "Điều hòa",
}

/**
 * GET /api/device-states
 * Lấy danh sách trạng thái hiện tại của 3 thiết bị từ bảng `Devices`
 */
export async function getDeviceStates(req, res, next) {
  try {
    const [rows] = await pool.query(
      "SELECT device_id, device_name, status FROM Devices ORDER BY device_id ASC",
    )

    return res.status(200).json({
      devices: rows,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * POST /api/devices/:device_id/control
 * Tiếp nhận yêu cầu điều khiển từ Frontend:
 * Tạo bản ghi Action ở trạng thái PENDING, phát lệnh qua MQTT topic `Device_control`
 */
export async function controlDevice(req, res, next) {
  try {
    const { device_id } = req.params
    const { action } = req.body || {}

    // 1. Kiểm tra device_id bắt buộc là số nguyên thuộc {1, 2, 3}
    const numericDeviceId = parseInt(device_id, 10)
    if (
      isNaN(numericDeviceId) ||
      !DEVICE_MAP[numericDeviceId] ||
      String(numericDeviceId) !== String(device_id).trim()
    ) {
      return res.status(400).json({
        success: false,
        message: `Mã thiết bị '${device_id}' không hợp lệ. Chỉ chấp nhận ID số nguyên: 1 (Đèn), 2 (Quạt), 3 (Điều hòa).`,
      })
    }

    // 2. Kiểm tra action hợp lệ (chỉ chấp nhận 'ON' hoặc 'OFF')
    const normalizedAction = action ? String(action).toUpperCase() : ""
    if (!["ON", "OFF"].includes(normalizedAction)) {
      return res.status(400).json({
        success: false,
        message:
          "Hành động điều khiển không hợp lệ. Chỉ chấp nhận: 'ON' hoặc 'OFF'.",
      })
    }

    // 3. Kiểm tra thiết bị tồn tại trong bảng Devices
    const [deviceRows] = await pool.query(
      "SELECT device_id, device_name, status FROM Devices WHERE device_id = ?",
      [numericDeviceId],
    )

    if (deviceRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: `Không tìm thấy thiết bị với ID ${numericDeviceId} trong cơ sở dữ liệu.`,
      })
    }

    const currentDevice = deviceRows[0]
    const targetAction = normalizedAction

    // 4. INSERT vào bảng Action với trạng thái 'PENDING'
    const [insertResult] = await pool.query(
      'INSERT INTO Action (device_id, user_id, action, status, action_time) VALUES (?, 1, ?, "PENDING", NOW())',
      [numericDeviceId, targetAction],
    )
    const actionId = insertResult.insertId

    // 6. Phát lệnh điều khiển lên MQTT Broker qua topic `Device_control`
    const publishSuccess = await publishDeviceControl(
      actionId,
      numericDeviceId,
      targetAction,
    )

    // Nếu publish MQTT thất bại -> Cập nhật Action.status = 'FAIL' (Edge case 4)
    if (!publishSuccess) {
      try {
        await pool.query(
          'UPDATE Action SET status = "FAIL" WHERE action_id = ?',
          [actionId],
        )
        emitActionUpdated({
          action_id: actionId,
          device_id: numericDeviceId,
          action: targetAction,
          status: "FAIL",
        })
      } catch (updateErr) {
        console.error(
          "❌ [Device Controller]: Lỗi cập nhật FAIL cho Action:",
          updateErr.message,
        )
      }
      return res.status(500).json({
        success: false,
        action_id: actionId,
        device_id: numericDeviceId,
        device_name: currentDevice.device_name,
        action: targetAction,
        status: "FAIL",
        message: "Lỗi khi gửi lệnh điều khiển tới MQTT Broker.",
      })
    }

    // 7. Đặt bộ đếm thời gian 2.5s (2500ms): Nếu sau 2.5s không có phản hồi từ ESP32 -> cập nhật FAIL
    setTimeout(async () => {
      try {
        const [check] = await pool.query(
          "SELECT status FROM Action WHERE action_id = ?",
          [actionId],
        )
        if (check.length > 0 && check[0].status === "PENDING") {
          await pool.query(
            'UPDATE Action SET status = "FAIL" WHERE action_id = ?',
            [actionId],
          )
          console.warn(
            `⏱️ [Device Controller]: Timeout 2.5s - action_id #${actionId} không nhận được phản hồi từ ESP32 -> cập nhật status = 'FAIL'`,
          )
          emitActionUpdated({
            action_id: actionId,
            device_id: numericDeviceId,
            action: targetAction,
            status: "FAIL",
          })
        }
      } catch (timeoutErr) {
        console.error(
          "❌ [Device Controller]: Lỗi timeout update:",
          timeoutErr.message,
        )
      }
    }, 2500)

    // 8. Trả về response xác nhận đã tiếp nhận lệnh ở trạng thái PENDING
    return res.status(200).json({
      success: true,
      action_id: actionId,
      device_id: numericDeviceId,
      device_name: currentDevice.device_name,
      action: targetAction,
      status: "PENDING",
      message: "Device command accepted",
    })
  } catch (error) {
    next(error)
  }
}
