import { Router } from "express"
import {
  getDeviceStates,
  controlDevice,
} from "../controllers/deviceController.js"
import { authMiddleware } from "../middlewares/authMiddleware.js"

const router = Router()

// GET /api/device-states (Yêu cầu Token xác thực Bearer)
router.get("/device-states", authMiddleware, getDeviceStates)

// POST /api/devices/:device_id/control (Yêu cầu Token xác thực Bearer)
router.post("/devices/:device_id/control", authMiddleware, controlDevice)

export default router
