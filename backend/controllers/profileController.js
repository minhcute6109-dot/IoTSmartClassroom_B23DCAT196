/**
 * CONTROLLER XỬ LÝ HỒ SƠ NGƯỜI DÙNG (GET /api/profile)
 * Truy vấn dữ liệu thực tế từ bảng `Users` trong MySQL.
 *
 * Ánh xạ cơ sở dữ liệu:
 * - SELECT user_id, name, student_id, email, username, github_url, figma_url, api_doc_url, pdf_report_url
 *   FROM Users
 *   LIMIT 1
 */

import { pool } from "../config/db.js"

/**
 * GET /api/profile
 * Lấy thông tin tài khoản sinh viên từ bảng `Users`
 */
export async function getProfile(req, res, next) {
  try {
    const [rows] = await pool.query(
      "SELECT user_id, name, student_id, email, username, github_url, figma_url, api_doc_url, pdf_report_url FROM Users LIMIT 1",
    )

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông tin người dùng trong cơ sở dữ liệu.",
      })
    }

    // Trả về JSON đúng 9 trường theo SRS
    return res.status(200).json(rows[0])
  } catch (error) {
    next(error)
  }
}
