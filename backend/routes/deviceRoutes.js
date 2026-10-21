import { Router } from "express"
import {
  getDeviceStates,
  controlDevice,
} from "../controllers/deviceController.js"

const router = Router()

// GET /api/device-states
router.get("/device-states", getDeviceStates)

// POST /api/devices/:device_id/control
router.post("/devices/:device_id/control", controlDevice)

export default router
