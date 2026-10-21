/**
 * CONTROLLER XỬ LÝ DỮ LIỆU CẢM BIẾN (GET /api/sensors)
 * Truy vấn dữ liệu thực tế từ 2 bảng `Sensors` JOIN `DataSensor` trong MySQL.
 *
 * Ánh xạ cơ sở dữ liệu:
 * - SELECT d.data_id, s.sensor_id, s.sensor_name, s.sensor_type, d.value, s.unit, d.recorded_at
 *   FROM DataSensor d
 *   JOIN Sensors s ON d.sensor_id = s.sensor_id
 */

import { pool } from "../config/db.js"

const VALID_SORT_KEYS = {
  data_id: "d.data_id",
  sensor_name: "s.sensor_name",
  sensor_type: "s.sensor_type",
  value: "d.value",
  recorded_at: "d.recorded_at",
}

const VALID_SEARCH_FIELDS = [
  "sensor_name",
  "sensor_type",
  "recorded_at",
  "all",
]
const VALID_SORT_DIRS = ["ASC", "DESC"]

/**
 * GET /api/sensors
 * Lấy danh sách dữ liệu đo cảm biến từ MySQL
 */
export async function getSensors(req, res, next) {
  try {
    const rawPage = req.query.page
    const rawLimit = req.query.limit
    const rawSortKey = req.query.sort_key
    const rawSortDir = req.query.sort_dir
    const rawSearchField = req.query.search_field
    const searchValue = (req.query.search_value || "").trim()
    const sensorType = (req.query.sensor_type || "").trim()

    // 1. Kiểm tra tham số page hợp lệ
    const page = rawPage !== undefined ? parseInt(rawPage, 10) : 1
    if (
      isNaN(page) ||
      page < 1 ||
      (rawPage !== undefined && String(page) !== String(rawPage).trim())
    ) {
      return res.status(400).json({
        success: false,
        message: `Tham số page '${rawPage}' không hợp lệ. Phải là số nguyên dương lớn hơn hoặc bằng 1.`,
      })
    }

    // 2. Kiểm tra tham số limit hợp lệ
    const limit = rawLimit !== undefined ? parseInt(rawLimit, 10) : 10
    if (
      isNaN(limit) ||
      limit < 1 ||
      (rawLimit !== undefined && String(limit) !== String(rawLimit).trim())
    ) {
      return res.status(400).json({
        success: false,
        message: `Tham số limit '${rawLimit}' không hợp lệ. Phải là số nguyên dương lớn hơn hoặc bằng 1.`,
      })
    }

    // 3. Kiểm tra tham số sort_key hợp lệ
    const sortKey = rawSortKey ? rawSortKey.trim() : "data_id"
    if (!VALID_SORT_KEYS[sortKey]) {
      return res.status(400).json({
        success: false,
        message: `Tham số sort_key '${rawSortKey}' không hợp lệ. Chỉ chấp nhận: ${Object.keys(VALID_SORT_KEYS).join(", ")}.`,
      })
    }

    // 4. Kiểm tra tham số sort_dir hợp lệ
    const sortDir = rawSortDir ? rawSortDir.trim().toUpperCase() : "ASC"
    if (!VALID_SORT_DIRS.includes(sortDir)) {
      return res.status(400).json({
        success: false,
        message: `Tham số sort_dir '${rawSortDir}' không hợp lệ. Chỉ chấp nhận 'ASC' hoặc 'DESC'.`,
      })
    }

    // 5. Kiểm tra tham số search_field hợp lệ
    const searchField = rawSearchField
      ? rawSearchField.trim().toLowerCase()
      : "all"
    if (!VALID_SEARCH_FIELDS.includes(searchField)) {
      return res.status(400).json({
        success: false,
        message: `Tham số search_field '${rawSearchField}' không hợp lệ. Chỉ chấp nhận: ${VALID_SEARCH_FIELDS.join(", ")}.`,
      })
    }

    // 6. Xây dựng mệnh đề WHERE tìm kiếm
    const whereConditions = []
    const queryParams = []

    if (sensorType) {
      whereConditions.push("s.sensor_type = ?")
      queryParams.push(sensorType)
    }

    if (searchValue) {
      const wildcard = `%${searchValue}%`
      if (searchField === "sensor_name") {
        whereConditions.push("s.sensor_name LIKE ?")
        queryParams.push(wildcard)
      } else if (searchField === "sensor_type") {
        whereConditions.push("s.sensor_type LIKE ?")
        queryParams.push(wildcard)
      } else if (searchField === "recorded_at") {
        whereConditions.push(
          "(DATE_FORMAT(d.recorded_at, '%Y-%m-%d %H:%i:%s') LIKE ? OR DATE_FORMAT(d.recorded_at, '%d/%m/%Y %H:%i:%s') LIKE ?)",
        )
        queryParams.push(wildcard, wildcard)
      } else {
        // Tìm trên tất cả các trường
        whereConditions.push(
          "(d.data_id LIKE ? OR s.sensor_id LIKE ? OR s.sensor_name LIKE ? OR s.sensor_type LIKE ? OR d.value LIKE ? OR s.unit LIKE ? OR DATE_FORMAT(d.recorded_at, '%Y-%m-%d %H:%i:%s') LIKE ? OR DATE_FORMAT(d.recorded_at, '%d/%m/%Y %H:%i:%s') LIKE ?)",
        )
        for (let i = 0; i < 8; i++) {
          queryParams.push(wildcard)
        }
      }
    }

    const whereClause =
      whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : ""

    // 7. Đếm tổng số bản ghi phù hợp
    const countSql = `
      SELECT COUNT(*) AS total 
      FROM DataSensor d 
      JOIN Sensors s ON d.sensor_id = s.sensor_id 
      ${whereClause}
    `
    const [countRows] = await pool.query(countSql, queryParams)
    const total = countRows[0]?.total || 0

    // 8. Lấy dữ liệu phân trang và sắp xếp
    const offset = (page - 1) * limit
    const dbSortColumn = VALID_SORT_KEYS[sortKey]
    const dataSql = `
      SELECT 
        d.data_id, 
        s.sensor_id, 
        s.sensor_name, 
        s.sensor_type, 
        IF(d.value IS NULL, NULL, CAST(d.value AS DOUBLE)) AS value, 
        s.unit, 
        DATE_FORMAT(d.recorded_at, '%Y-%m-%d %H:%i:%s') AS recorded_at
      FROM DataSensor d 
      JOIN Sensors s ON d.sensor_id = s.sensor_id 
      ${whereClause}
      ORDER BY ${dbSortColumn} ${sortDir}
      LIMIT ? OFFSET ?
    `

    const [rows] = await pool.query(dataSql, [...queryParams, limit, offset])

    // Trả về JSON theo đúng định dạng SRS
    return res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        page,
        limit,
        total,
      },
    })
  } catch (error) {
    next(error)
  }
}
