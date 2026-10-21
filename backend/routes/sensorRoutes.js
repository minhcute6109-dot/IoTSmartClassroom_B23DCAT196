import { Router } from "express"
import { getSensors } from "../controllers/sensorController.js"

const router = Router()

// GET /api/sensors
router.get("/sensors", getSensors)

export default router
