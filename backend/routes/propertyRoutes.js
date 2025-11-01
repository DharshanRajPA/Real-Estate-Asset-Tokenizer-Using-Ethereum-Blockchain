import express from "express";
import upload from "../middleware/imageUpload.js";
import { createProperty } from "../controllers/propertyController.js";
import { getAllProperties } from "../controllers/fetchAllPropertyController.js";
import protect from "../middleware/authmiddleware.js";
import { getPropertyById } from "../controllers/getPropertyController.js";
import { updateProperty } from "../controllers/updatePropertyController.js";
import { updateTokenHolders } from "../controllers/updateTokenHolderController.js";
const router = express.Router();

router.post("/addProperty", protect, upload.single("image"), createProperty);
router.get("/allProperties", protect, getAllProperties);
router.get("/property/:id", protect, getPropertyById);
router.put("/:id", protect, upload.single("propertyImage"), updateProperty);
router.post("/update-holders/:propertyId", protect, updateTokenHolders);
export default router;
