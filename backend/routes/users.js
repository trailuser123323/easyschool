import express from "express";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/me", requireAuth, (req, res) => {
  res.json({ success: true, data: req.user });
});

export default router;
