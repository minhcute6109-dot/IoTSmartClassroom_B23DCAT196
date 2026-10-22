import { Router } from "express"
import { getProfile } from "../controllers/profileController.js"
import { authMiddleware } from "../middlewares/authMiddleware.js"

const router = Router()

// GET /api/profile (Yêu cầu Token xác thực Bearer)
router.get("/profile", authMiddleware, getProfile)

export default router
