import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.js";

dotenv.config();

const app = express();

// ✅ CORS
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "https://trecords.netlify.app",  // ✅ Netlify frontend
  /\.app\.github\.dev$/,           // ✅ Codespaces preview URLs
  /\.netlify\.app$/,               // ✅ Any future Netlify deployments
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    const allowed = allowedOrigins.some(o =>
      typeof o === "string" ? o === origin : o.test(origin)
    );

    allowed
      ? callback(null, true)
      : callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());

// ✅ MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected ✅"))
  .catch((err) => console.log("MongoDB Error ❌:", err));

// ✅ Routes
app.use("/api/auth", authRoutes);

// ✅ Health check
app.get("/", (req, res) => {
  res.json({ message: "Backend is running!", status: "connected" });
});

// ✅ 404
app.use((req, res) => {
  res.status(404).json({ message: "Route not found ❌" });
});

// ✅ Start
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT} 🚀`);
});at > backend/routes/auth.js << 'EOF'
import express from "express";
const router = express.Router();

const users = [
  { id: 1, email: "admin@gmail.com", password: "1234", role: "admin", name: "Admin" },
  { id: 2, email: "teacher1@gmail.com", password: "12345", role: "teacher", name: "Teacher One" },
];

router.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ message: "Invalid email or password." });
  const { password: _, ...userData } = user;
  res.json({ token: "demo-token-" + user.id, user: userData });
});

export default router;
