import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { create, getOne, list, remove, update } from "../controllers/promptController.js";

const router = express.Router();

router.use(requireAuth);
router.get("/", asyncHandler(list));
router.post("/", asyncHandler(create));
router.get("/:id", asyncHandler(getOne));
router.put("/:id", asyncHandler(update));
router.delete("/:id", asyncHandler(remove));

export default router;
