import { Router } from "express"
import { getSensors } from "../controllers/sensorController.js"
import { authMiddleware } from "../middlewares/authMiddleware.js"

const router = Router()

// GET /api/sensors (Yêu cầu Token xác thực Bearer)
router.get("/sensors", authMiddleware, getSensors)

export default router
