import { Router } from "express"
import { login } from "../controllers/authController.js"

const router = Router()

// Đăng ký cả 2 đường dẫn để tương thích linh hoạt:
// POST /api/auth/login và POST /api/login
router.post("/auth/login", login)
router.post("/login", login)

export default router
