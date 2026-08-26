import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import promptRoutes from "./routes/prompts.js";
import userRoutes from "./routes/users.js";
import { connectDatabase } from "./config/database.js";
import { errorHandler } from "./middleware/errorHandler.js";

dotenv.config();
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDirectRun = process.argv[1]
  ? import.meta.url === pathToFileURL(process.argv[1]).href
  : false;

app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:5173"],
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

connectDatabase();

app.use("/api/auth", authRoutes);
app.use("/api/prompts", promptRoutes);
app.use("/api/users", userRoutes);
app.get("/", (req, res) => res.json({ message: "Backend is running!", status: "connected" }));
app.use((req, res) => res.status(404).json({ message: "Route not found" }));
app.use(errorHandler);

export function startServer(port = process.env.PORT || 5000) {
  return app.listen(port, "0.0.0.0", () => console.log(`Server running on port ${port} 🚀`));
}

export { app };

if (isDirectRun) {
  startServer();
}
