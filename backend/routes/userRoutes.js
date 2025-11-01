import express from "express";
import { getUserProfile } from "../controllers/userController.js";
import { updateTokensHeld } from "../controllers/updateUserTokensController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// Route to get user profile by ID (with auth middleware)
router.get("/:id", protect, getUserProfile);
router.post("/update-tokens-held", protect, updateTokensHeld);
export default router;
