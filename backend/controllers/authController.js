/**
 * CONTROLLER XỬ LÝ XÁC THỰC NGƯỜI DÙNG (backend/controllers/authController.js)
 *
 * Chức năng:
 * - Tiếp nhận yêu cầu đăng nhập: POST /api/auth/login (hoặc POST /api/login)
 * - Xác thực thông tin tài khoản qua CSDL MySQL bảng `Users`
 * - Tạo và ký Token JWT với bí danh JWT_SECRET = 'b23dcat196'
 */

import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import { pool } from "../config/db.js"

const JWT_SECRET = process.env.JWT_SECRET || "b23dcat196"
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h"

export async function login(req, res, next) {
  try {
    const { username, password } = req.body || {}

    // 1. Kiểm tra tham số đầu vào
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.",
      })
    }

    const trimmedUsername = String(username).trim()
    const plainPassword = String(password).trim()

    // 2. Truy vấn tài khoản từ bảng Users trong MySQL
    const [rows] = await pool.query(
      "SELECT user_id, username, password, name, student_id, email FROM Users WHERE username = ? LIMIT 1",
      [trimmedUsername],
    )

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Tên đăng nhập hoặc mật khẩu không chính xác.",
      })
    }

    const user = rows[0]

    // 3. Kiểm tra mật khẩu (hỗ trợ cả hash bcrypt lẫn mật khẩu thô trong dữ liệu seed)
    let isPasswordValid = false
    if (user.password && (user.password.startsWith("$2a$") || user.password.startsWith("$2b$"))) {
      isPasswordValid = await bcrypt.compare(plainPassword, user.password)
    } else {
      isPasswordValid = plainPassword === user.password
    }

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Tên đăng nhập hoặc mật khẩu không chính xác.",
      })
    }

    // 4. Ký tạo Token JWT
    const token = jwt.sign(
      {
        user_id: user.user_id,
        username: user.username,
        student_id: user.student_id,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN },
    )

    // 5. Trả về kết quả xác thực kèm Token cho Frontend/Postman
    return res.status(200).json({
      success: true,
      message: "Đăng nhập thành công.",
      token,
      user: {
        user_id: user.user_id,
        username: user.username,
        name: user.name,
        student_id: user.student_id,
        email: user.email,
      },
    })
  } catch (error) {
    next(error)
  }
}
