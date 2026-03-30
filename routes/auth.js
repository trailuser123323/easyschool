import express from "express";
import fs from "fs";
import path from "path";
import multer from "multer";
import { fileURLToPath } from "url";
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

const adminUser = {
  id: 1,
  email: "admin@gmail.com",
  password: "1234",
  role: "admin",
  name: "Admin",
  initials: "AD",
};

const teachers = [
  { id: 2, name: "Priya Ramesh", email: "teacher1@gmail.com", password: "12345", role: "teacher", subject: "Science", class: "9A", initials: "PR", color: "#4f46e5", status: "present", checkin: "8:47 AM", onDuty: true, absent: 2, leave: 2, rate: "91%", lastLogin: null },
  { id: 3, name: "Amit Sharma", email: "amit@school.edu", password: "12345", role: "teacher", subject: "Math", class: "8B", initials: "AS", color: "#0891b2", status: "present", checkin: "8:52 AM", onDuty: true, absent: 1, leave: 1, rate: "95%", lastLogin: null },
  { id: 4, name: "Rekha Nair", email: "rekha@school.edu", password: "12345", role: "teacher", subject: "English", class: "10A", initials: "RN", color: "#d97706", status: "leave", checkin: "–", onDuty: false, absent: 3, leave: 4, rate: "85%", lastLogin: null },
  { id: 5, name: "Suresh Pillai", email: "suresh@school.edu", password: "12345", role: "teacher", subject: "History", class: "7C", initials: "SP", color: "#dc2626", status: "absent", checkin: "–", onDuty: false, absent: 4, leave: 1, rate: "80%", lastLogin: null },
  { id: 6, name: "Meera Joshi", email: "meera@school.edu", password: "12345", role: "teacher", subject: "Physics", class: "11B", initials: "MJ", color: "#059669", status: "present", checkin: "8:39 AM", onDuty: true, absent: 0, leave: 2, rate: "98%", lastLogin: null },
  { id: 7, name: "Kiran Desai", email: "kiran@school.edu", password: "12345", role: "teacher", subject: "Chemistry", class: "12A", initials: "KD", color: "#7c3aed", status: "present", checkin: "8:55 AM", onDuty: false, absent: 1, leave: 3, rate: "93%", lastLogin: null },
  { id: 8, name: "Pooja Kulkarni", email: "pooja@school.edu", password: "12345", role: "teacher", subject: "Biology", class: "9B", initials: "PK", color: "#be185d", status: "absent", checkin: "–", onDuty: false, absent: 5, leave: 2, rate: "78%", lastLogin: null },
  { id: 9, name: "Raj Patil", email: "raj@school.edu", password: "12345", role: "teacher", subject: "Geo", class: "8A", initials: "RP", color: "#0891b2", status: "present", checkin: "8:44 AM", onDuty: true, absent: 2, leave: 1, rate: "90%", lastLogin: null },
];

function formatCheckin(date) {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function serializeTeacher(teacher) {
  const { password, ...userData } = teacher;
  return userData;
}

router.post("/login", (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = email?.trim().toLowerCase();

  if (normalizedEmail === adminUser.email && password === adminUser.password) {
    const { password: _, ...userData } = adminUser;
    return res.json({ token: "admin-token-" + adminUser.id, user: userData });
  }

  const teacher = teachers.find(
    (item) => item.email === normalizedEmail && item.password === password
  );

  if (!teacher) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  teacher.lastLogin = new Date().toISOString();
  teacher.status = "present";
  teacher.checkin = formatCheckin(teacher.lastLogin);

  return res.json({
    token: "teacher-token-" + teacher.id,
    user: serializeTeacher(teacher),
  });
});

router.get("/teachers", (_req, res) => {
  res.json(teachers.map(serializeTeacher));
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

router.put("/teachers/:id", (req, res) => {
  const teacherId = Number(req.params.id);
  const teacher = teachers.find((item) => item.id === teacherId);

  if (!teacher) {
    return res.status(404).json({ message: "Teacher not found." });
  }

  Object.assign(teacher, req.body);
  return res.json(serializeTeacher(teacher));
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
