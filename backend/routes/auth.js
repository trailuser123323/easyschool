import express from "express";
import fs from "fs";
import path from "path";
import multer from "multer";
import { fileURLToPath } from "url";
import Admin from "../models/Admin.js";
import Teacher from "../models/Teacher.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, "..", "uploads");

fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname || "").toLowerCase() || ".jpg";
    cb(null, `attendance-${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype?.startsWith("image/")) {
      cb(null, true);
      return;
    }

    cb(new Error("Only image uploads are allowed."));
  },
});

function formatCheckin(date) {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function serializeTeacher(teacher) {
  const userData = teacher.toObject ? teacher.toObject() : { ...teacher };
  delete userData.password;
  return userData;
}

async function seedIfEmpty() {
  const adminCount = await Admin.countDocuments();
  if (adminCount === 0) {
    await Admin.create({
      name: "Admin",
      email: "admin@gmail.com",
      password: "1234",
      role: "admin",
      initials: "AD",
    });
  }

  const teacherCount = await Teacher.countDocuments();
  if (teacherCount === 0) {
    await Teacher.create({
      name: "Priya Ramesh",
      email: "teacher1@gmail.com",
      password: "12345",
      role: "teacher",
      subject: "Science",
      class: "9A",
      initials: "PR",
      color: "#4f46e5",
      status: "absent",
      checkin: "–",
      checkout: "–",
      onDuty: false,
      absent: 2,
      leave: 2,
      rate: "91%",
    });
  }
}

seedIfEmpty().catch((error) => {
  console.error("Seed error:", error);
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = email?.trim().toLowerCase();

  try {
    const adminUser = await Admin.findOne({ email: normalizedEmail });
    if (adminUser) {
      if (adminUser.password !== password) {
        return res.status(401).json({ message: "Invalid email or password." });
      }

      const userData = adminUser.toObject();
      delete userData.password;
      return res.json({ token: "admin-token-" + adminUser._id, user: userData });
    }

    const teacher = await Teacher.findOne({ email: normalizedEmail });
    if (!teacher || teacher.password !== password) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    teacher.lastLogin = new Date();
    teacher.checkin = formatCheckin(teacher.lastLogin);
    if (!teacher.status || teacher.status === "absent") {
      teacher.status = "present";
    }
    await teacher.save();

    return res.json({
      token: "teacher-token-" + teacher._id,
      user: serializeTeacher(teacher),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/teachers", async (_req, res) => {
  try {
    const teachers = await Teacher.find().sort({ name: 1 });
    res.json(teachers.map(serializeTeacher));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/teachers/upload", upload.single("photo"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Photo file is required." });
  }

  const baseUrl = `${req.protocol}://${req.get("host")}`;
  return res.json({
    photoUrl: `${baseUrl}/uploads/${req.file.filename}`,
    filename: req.file.filename,
  });
});

router.put("/teachers/:id", async (req, res) => {
  try {
    const teacher = await Teacher.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found." });
    }

    return res.json(serializeTeacher(teacher));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.use((error, _req, res, next) => {
  if (error instanceof multer.MulterError) {
    return res.status(400).json({ message: error.message });
  }

  if (error?.message) {
    return res.status(400).json({ message: error.message });
  }

  return next(error);
});

export default router;
