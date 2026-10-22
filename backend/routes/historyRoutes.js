import { Router } from "express"
import { getHistory } from "../controllers/historyController.js"
import { authMiddleware } from "../middlewares/authMiddleware.js"

const router = Router()

// GET /api/history (Yêu cầu Token xác thực Bearer)
router.get("/history", authMiddleware, getHistory)

export default router
