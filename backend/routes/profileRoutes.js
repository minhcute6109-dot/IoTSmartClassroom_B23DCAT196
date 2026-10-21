import { Router } from "express"
import { getProfile } from "../controllers/profileController.js"

const router = Router()

// GET /api/profile
router.get("/profile", getProfile)

export default router
