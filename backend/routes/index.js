import express from "express";
import authRoutes from "./authRoutes.js";
import propertyRoutes from "./propertyRoutes.js";
import userRoutes from "./userRoutes.js";
import ethRateRoutes from "./ethRateRoutes.js";
const router = express.Router();
router.get("/", (req, res) => {
  res.status(200).json({ message: "🏡 Welcome to the GreenEstate API" });
});
router.use("/user", userRoutes);
// Grouped routes
router.use("/auth", authRoutes); // /api/auth/signup, /api/auth/dashboard
router.use("/properties", propertyRoutes);
router.use("/ethrate", ethRateRoutes);
// router.use("/properties", propertyRoutes); // Optional
router.use(function (req, res) {
  res.status(404).json({ message: "Endpoint Not Found" });
});
export default router;
