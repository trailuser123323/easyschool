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

function getTodayKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function isSameCalendarDay(value, date = new Date()) {
  if (!value) return false;

  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return false;

  return getTodayKey(parsed) === getTodayKey(date);
}

function getAttendanceSnapshot(teacher, date = new Date()) {
  const today = getTodayKey(date);
  const records = Array.isArray(teacher?.attendanceRecords) ? teacher.attendanceRecords : [];
  const record = records.find((entry) => entry?.date === today);

  if (!record) {
    return {
      status: "absent",
      checkin: "–",
      checkout: "–",
      hasCheckin: false,
      hasCheckout: false,
    };
  }

  const checkin = record.checkin || "–";
  const checkout = record.checkout || "–";

  return {
    status: record.status || "absent",
    checkin,
    checkout,
    hasCheckin: checkin !== "–",
    hasCheckout: checkout !== "–",
  };
}

function updateAttendanceRecord(teacher, updates) {
  const records = Array.isArray(teacher.attendanceRecords) ? [...teacher.attendanceRecords] : [];
  const today = getTodayKey();
  const index = records.findIndex((record) => record.date === today);
  const baseRecord = index >= 0
    ? { ...records[index] }
    : { date: today, status: "absent", checkin: "–", checkout: "–" };

  if (updates.status) baseRecord.status = updates.status;
  if (updates.checkin) baseRecord.checkin = updates.checkin;
  if (updates.checkout) baseRecord.checkout = updates.checkout;

  if (index >= 0) {
    records[index] = baseRecord;
  } else if (updates.status || updates.checkin || updates.checkout) {
    records.unshift(baseRecord);
  }

  teacher.attendanceRecords = records.slice(0, 180);
}

function serializeTeacher(teacher) {
  const userData = teacher.toObject ? teacher.toObject() : { ...teacher };
  delete userData.password;
  const todayAttendance = getAttendanceSnapshot(userData);

  userData.status = todayAttendance.status;
  userData.checkin = todayAttendance.checkin;
  userData.checkout = todayAttendance.checkout;
  userData.onDuty = todayAttendance.status === "present" ? Boolean(userData.onDuty) : false;
  userData.loginPhoto = todayAttendance.hasCheckin ? userData.loginPhoto || "" : "";
  userData.checkoutPhoto = todayAttendance.hasCheckout ? userData.checkoutPhoto || "" : "";
  userData.lastLogin = todayAttendance.hasCheckin && isSameCalendarDay(userData.lastLogin)
    ? userData.lastLogin
    : null;
  userData.lastCheckout = todayAttendance.hasCheckout && isSameCalendarDay(userData.lastCheckout)
    ? userData.lastCheckout
    : null;

  return userData;
}

function buildInitials(name = "") {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) return "T";
  return parts.map((part) => part[0]?.toUpperCase() || "").join("") || "T";
}

async function seedIfEmpty() {
  const adminUser = await Admin.findOne({ email: "admin@gmail.com" });
  if (!adminUser) {
    await Admin.create({
      name: "Admin",
      email: "admin@gmail.com",
      password: "1234",
      role: "admin",
      initials: "AD",
    });
  }

  const defaultTeachers = [
    {
      name: "Ganeshsir",
      email: "gstar@gmail.com",
      password: "12345",
      role: "teacher",
      subject: "All Rounder",
      class: "–",
      initials: "G",
      color: "#0f766e",
      status: "absent",
      checkin: "–",
      checkout: "–",
      onDuty: false,
      absent: 0,
      leave: 0,
      rate: "0%",
    },
    {
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
    },
    {
      name: "niha",
      email: "niha@gmail.com",
      password: "12345",
      role: "teacher",
      subject: "DSA",
      class: "–",
      initials: "N",
      color: "#2563eb",
      status: "absent",
      checkin: "–",
      checkout: "–",
      onDuty: false,
      absent: 0,
      leave: 0,
      rate: "0%",
    },
    {
      name: "Admin",
      email: "admin@gmail.com",
      password: "12345",
      role: "teacher",
      subject: "General",
      class: "–",
      initials: "AD",
      color: "#7c3aed",
      status: "absent",
      checkin: "–",
      checkout: "–",
      onDuty: false,
      absent: 0,
      leave: 0,
      rate: "0%",
    },
  ];

  for (const teacher of defaultTeachers) {
    const existingTeacher = await Teacher.findOne({ email: teacher.email });
    if (!existingTeacher) {
      await Teacher.create(teacher);
    }
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
    updateAttendanceRecord(teacher, {
      status: teacher.status,
      checkin: teacher.checkin,
    });
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

router.post("/teachers", async (req, res) => {
  const {
    name,
    email,
    password,
    subject = "",
    class: className = "",
    color = "#4f46e5",
  } = req.body || {};

  const trimmedName = name?.trim();
  const normalizedEmail = email?.trim().toLowerCase();
  const trimmedPassword = password?.trim();

  if (!trimmedName || !normalizedEmail || !trimmedPassword) {
    return res.status(400).json({ message: "Name, email, and password are required." });
  }

  try {
    const existingTeacher = await Teacher.findOne({ email: normalizedEmail });
    if (existingTeacher) {
      return res.status(409).json({ message: "A teacher with this email already exists." });
    }

    const teacher = await Teacher.create({
      name: trimmedName,
      email: normalizedEmail,
      password: trimmedPassword,
      role: "teacher",
      subject: subject?.trim() || "General",
      class: className?.trim() || "–",
      initials: buildInitials(trimmedName),
      color,
      status: "absent",
      checkin: "–",
      checkout: "–",
      onDuty: false,
      absent: 0,
      leave: 0,
      rate: "0%",
      timetable: [],
      attendanceRecords: [],
    });

    return res.status(201).json(serializeTeacher(teacher));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
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
    const teacher = await Teacher.findById(req.params.id);

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found." });
    }

    const updates = req.body || {};
    const allowedKeys = [
      "name",
      "subject",
      "class",
      "status",
      "checkin",
      "checkout",
      "onDuty",
      "lastLogin",
      "lastCheckout",
      "loginPhoto",
      "checkoutPhoto",
      "leaveRequests",
      "timetable",
      "attendanceRecords",
    ];

    for (const key of allowedKeys) {
      if (!(key in updates)) continue;

      if (key === "leaveRequests") {
        teacher.leaveRequests = Array.isArray(updates.leaveRequests) ? updates.leaveRequests : [];
        continue;
      }

      if (key === "timetable") {
        teacher.timetable = Array.isArray(updates.timetable) ? updates.timetable : [];
        continue;
      }

      if (key === "attendanceRecords") {
        teacher.attendanceRecords = Array.isArray(updates.attendanceRecords) ? updates.attendanceRecords : teacher.attendanceRecords;
        continue;
      }

      teacher[key] = updates[key];
    }

    if ("checkin" in updates || "checkout" in updates || "status" in updates) {
      updateAttendanceRecord(teacher, updates);
    }

    if ("name" in updates && typeof teacher.name === "string") {
      teacher.initials = buildInitials(teacher.name);
    }

    await teacher.save();

    return res.json(serializeTeacher(teacher));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.delete("/teachers/:id", async (req, res) => {
  try {
    const teacher = await Teacher.findByIdAndDelete(req.params.id);

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found." });
    }

    return res.json({ message: "Teacher deleted successfully." });
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
