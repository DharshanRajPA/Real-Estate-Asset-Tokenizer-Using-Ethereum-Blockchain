import express from "express";
import protect from "../middleware/authmiddleware.js";
import { registerUser } from "../controllers/SignUpController.js";
import { loginUser } from "../controllers/SignInController.js";

const router = express.Router();

// Protected dashboard route
router.get("/dashboard", protect, (req, res) => {
  res.json({ message: `Welcome, ${req.user.email}` });
});

// Signup
router.post("/signup", registerUser);
router.post("/signin", loginUser);
export default router;
