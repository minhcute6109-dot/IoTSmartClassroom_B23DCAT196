/**
 * CONTROLLER XỬ LÝ LỊCH SỬ THAO TÁC THIẾT BỊ (GET /api/history)
 * Truy vấn dữ liệu thực tế từ 3 bảng `Action` JOIN `Devices` LEFT JOIN `Users` trong MySQL.
 *
 * Response chuẩn SRS / API4:
 * {
 *   "data": [
 *     {
 *       "id": 1,
 *       "device": "Đèn",
 *       "action": "ON",
 *       "status": "SUCCESS",
 *       "time": "2026-08-16 08:00:00"
 *     }
 *   ],
 *   "pagination": { "page": 1, "limit": 10, "total": 60 }
 * }
 */

import { pool } from "../config/db.js"

const VALID_SORT_KEYS = {
  id: "a.action_id",
  device: "d.device_name",
  action: "a.action",
  status: "a.status",
  time: "a.action_time",
}

const VALID_SEARCH_FIELDS = ["device", "action", "status", "all"]
const VALID_SORT_DIRS = ["ASC", "DESC"]

/**
 * GET /api/history
 * Lấy danh sách lịch sử thao tác bật/tắt thiết bị từ MySQL
 */
export async function getHistory(req, res, next) {
  try {
    const rawPage = req.query.page
    const rawLimit = req.query.limit
    const rawSortKey = req.query.sort_key
    const rawSortDir = req.query.sort_dir
    const rawSearchField = req.query.search_field
    const searchValue = (req.query.search_value || "").trim()
    const deviceFilter = (req.query.device || "").trim()
    const actionFilter = (req.query.action || "").trim().toUpperCase()
    const statusFilter = (req.query.status || "").trim().toUpperCase()

    // 1. Kiểm tra tham số page hợp lệ
    const page = rawPage !== undefined ? parseInt(rawPage, 10) : 1
    if (
      isNaN(page) ||
      page < 1 ||
      (rawPage !== undefined && String(page) !== String(rawPage).trim())
    ) {
      return res.status(400).json({
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
        message: `Tham số limit '${rawLimit}' không hợp lệ. Phải là số nguyên dương lớn hơn hoặc bằng 1.`,
      })
    }

    // 3. Kiểm tra tham số sort_key hợp lệ
    const sortKey = rawSortKey ? rawSortKey.trim() : "id"
    if (!VALID_SORT_KEYS[sortKey]) {
      return res.status(400).json({
        message: `Tham số sort_key '${rawSortKey}' không hợp lệ. Chỉ chấp nhận: ${Object.keys(VALID_SORT_KEYS).join(", ")}.`,
      })
    }

    // 4. Kiểm tra tham số sort_dir hợp lệ
    const sortDir = rawSortDir ? rawSortDir.trim().toUpperCase() : "DESC"
    if (!VALID_SORT_DIRS.includes(sortDir)) {
      return res.status(400).json({
        message: `Tham số sort_dir '${rawSortDir}' không hợp lệ. Chỉ chấp nhận 'ASC' hoặc 'DESC'.`,
      })
    }

    // 5. Kiểm tra tham số search_field hợp lệ
    const searchField = rawSearchField
      ? rawSearchField.trim().toLowerCase()
      : "all"
    if (!VALID_SEARCH_FIELDS.includes(searchField)) {
      return res.status(400).json({
        message: `Tham số search_field '${rawSearchField}' không hợp lệ. Chỉ chấp nhận: ${VALID_SEARCH_FIELDS.join(", ")}.`,
      })
    }

    // 6. Xây dựng mệnh đề WHERE tìm kiếm
    const whereConditions = []
    const queryParams = []

    if (deviceFilter) {
      whereConditions.push("d.device_name = ?")
      queryParams.push(deviceFilter)
    }

    if (actionFilter) {
      whereConditions.push("a.action = ?")
      queryParams.push(actionFilter)
    }

    if (statusFilter) {
      if (statusFilter === "ON" || statusFilter === "OFF") {
        whereConditions.push('(a.status = "SUCCESS" AND a.action = ?)')
        queryParams.push(statusFilter)
      } else if (statusFilter === "FAILED") {
        whereConditions.push('a.status = "FAIL"')
      } else if (statusFilter === "PENDING") {
        whereConditions.push('a.status = "PENDING"')
      }
    }

    if (searchValue) {
      const wildcard = `%${searchValue}%`
      if (searchField === "device") {
        whereConditions.push("d.device_name LIKE ?")
        queryParams.push(wildcard)
      } else if (searchField === "action") {
        whereConditions.push("a.action LIKE ?")
        queryParams.push(wildcard)
      } else if (searchField === "status") {
        whereConditions.push("a.status LIKE ?")
        queryParams.push(wildcard)
      } else {
        // Tìm kiếm trên tất cả các trường
        whereConditions.push(
          "(a.action_id LIKE ? OR d.device_name LIKE ? OR a.action LIKE ? OR a.status LIKE ? OR DATE_FORMAT(a.action_time, '%Y-%m-%d %H:%i:%s') LIKE ? OR DATE_FORMAT(a.action_time, '%d/%m/%Y %H:%i:%s') LIKE ?)",
        )
        for (let i = 0; i < 6; i++) {
          queryParams.push(wildcard)
        }
      }
    }

    const whereClause =
      whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : ""

    // 7. Đếm tổng số bản ghi
    const countSql = `
      SELECT COUNT(*) AS total 
      FROM Action a 
      JOIN Devices d ON a.device_id = d.device_id 
      LEFT JOIN Users u ON a.user_id = u.user_id 
      ${whereClause}
    `
    const [countRows] = await pool.query(countSql, queryParams)
    const total = countRows[0]?.total || 0

    // 8. Lấy dữ liệu phân trang và sắp xếp có cột status
    const offset = (page - 1) * limit
    const dbSortColumn = VALID_SORT_KEYS[sortKey]
    const dataSql = `
      SELECT 
        a.action_id AS id, 
        d.device_name AS device, 
        a.action, 
        a.status,
        DATE_FORMAT(a.action_time, '%Y-%m-%d %H:%i:%s') AS time,
        IF(
          a.status = 'PENDING',
          NULL,
          DATE_FORMAT(DATE_ADD(a.action_time, INTERVAL 1 SECOND), '%Y-%m-%d %H:%i:%s')
        ) AS response_time
      FROM Action a 
      JOIN Devices d ON a.device_id = d.device_id 
      LEFT JOIN Users u ON a.user_id = u.user_id 
      ${whereClause}
      ORDER BY ${dbSortColumn} ${sortDir}
      LIMIT ? OFFSET ?
    `

    const [rows] = await pool.query(dataSql, [...queryParams, limit, offset])

    // Trả về JSON theo đúng định dạng SRS với status
    return res.status(200).json({
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
