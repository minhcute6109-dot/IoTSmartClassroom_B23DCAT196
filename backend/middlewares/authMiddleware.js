/**
 * MIDDLEWARE XÁC THỰC JSON WEB TOKEN (JWT)
 * (backend/middlewares/authMiddleware.js)
 *
 * Kiểm tra tính hợp lệ của Token trong Header:
 * Authorization: Bearer <token>
 *
 * Khóa bí mật mặc định: b23dcat196
 */

import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "b23dcat196"

export function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Truy cập bị từ chối. Vui lòng cung cấp token xác thực (Bearer Token).",
      })
    }

    const token = authHeader.split(" ")[1]

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token xác thực không hợp lệ.",
      })
    }

    // Giải mã và kiểm tra token
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded

    next()
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token xác thực đã hết hạn. Vui lòng đăng nhập lại.",
      })
    }

    return res.status(401).json({
      success: false,
      message: "Token xác thực không hợp lệ hoặc chữ ký không khớp.",
    })
  }
}
