import express from "express";
import { fetchEthToInrRate } from "../controllers/fiatETHConversionController.js";

const router = express.Router();
router.get("/eth-inr", fetchEthToInrRate);
export default router;
