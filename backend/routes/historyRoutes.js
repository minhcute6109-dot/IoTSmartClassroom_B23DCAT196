import { Router } from "express"
import { getHistory } from "../controllers/historyController.js"

const router = Router()

// GET /api/history
router.get("/history", getHistory)

export default router
