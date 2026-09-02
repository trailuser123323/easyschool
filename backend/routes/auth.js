import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import Admin from "../models/Admin.js";
import Announcement from "../models/Announcement.js";
import Teacher from "../models/Teacher.js";
import { issueToken, verifyPassword } from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
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

function formatAnnouncement(announcement) {
  const payload = announcement.toObject ? announcement.toObject() : { ...announcement };
  const createdAt = payload.createdAt ? new Date(payload.createdAt) : new Date();

  return {
    id: String(payload._id),
    title: payload.title,
    body: payload.body,
    icon: payload.icon || "📢",
    type: payload.type || "info",
    time: createdAt.toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }),
    createdAt: createdAt.toISOString(),
  };
}

function ensureDatabaseReady(res) {
  if (mongoose.connection.readyState === 1) {
    return true;
  }

  res.status(503).json({ message: "Database is unavailable. Server data could not be saved." });
  return false;
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

}

if (process.env.MONGO_URI) {
  seedIfEmpty().catch((error) => {
    console.error("Seed error:", error);
  });
}

router.post("/login", async (req, res) => {
  if (!ensureDatabaseReady(res)) return;

  const { email, password } = req.body;
  const normalizedEmail = email?.trim().toLowerCase();

  if (!normalizedEmail || typeof password !== "string" || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  try {
    const adminUser = await Admin.findOne({ email: normalizedEmail });
    if (adminUser) {
      if (!(await verifyPassword(adminUser, password))) {
        return res.status(401).json({ message: "Invalid email or password." });
      }

      const userData = adminUser.toObject();
      delete userData.password;
      return res.json({ token: issueToken(adminUser), user: userData });
    }

    const teacher = await Teacher.findOne({ email: normalizedEmail });
    if (!teacher || !(await verifyPassword(teacher, password))) {
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
      token: issueToken(teacher),
      user: serializeTeacher(teacher),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/teachers", async (_req, res) => {
  if (!ensureDatabaseReady(res)) return;

  try {
    const teachers = await Teacher.find().sort({ name: 1 });
    res.json(teachers.map(serializeTeacher));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/teachers/:id", requireAuth, async (req, res) => {
  if (!ensureDatabaseReady(res)) return;

  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: "Invalid teacher id." });
  }

  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) return res.status(404).json({ message: "Teacher not found." });
    return res.json(serializeTeacher(teacher));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/announcements", async (_req, res) => {
  if (!ensureDatabaseReady(res)) return;

  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 }).limit(50);
    return res.json(announcements.map(formatAnnouncement));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/announcements", async (req, res) => {
  if (!ensureDatabaseReady(res)) return;

  const title = req.body?.title?.trim();
  const body = req.body?.body?.trim();

  if (!title || !body) {
    return res.status(400).json({ message: "Announcement title and body are required." });
  }

  try {
    const announcement = await Announcement.create({
      title,
      body,
      icon: "📢",
      type: "info",
    });

    return res.status(201).json(formatAnnouncement(announcement));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.put("/announcements/:id", async (req, res) => {
  if (!ensureDatabaseReady(res)) return;

  if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: "Invalid announcement id." });
  }

  const title = req.body?.title?.trim();
  const body = req.body?.body?.trim();

  if (!title || !body) {
    return res.status(400).json({ message: "Announcement title and body are required." });
  }

  try {
    const announcement = await Announcement.findByIdAndUpdate(
      req.params.id,
      { title, body },
      { new: true }
    );

    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found." });
    }

    return res.json(formatAnnouncement(announcement));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.delete("/announcements/:id", async (req, res) => {
  if (!ensureDatabaseReady(res)) return;

  if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: "Invalid announcement id." });
  }

  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);

    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found." });
    }

    return res.json({ message: "Announcement deleted successfully." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/teachers", async (req, res) => {
  if (!ensureDatabaseReady(res)) return;

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
  if (!ensureDatabaseReady(res)) return;

  if (!req.file) {
    return res.status(400).json({ message: "Photo file is required." });
  }

  const photoUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;

  return res.json({ photoUrl });
});

router.put("/teachers/:id", requireAuth, async (req, res) => {
  if (!ensureDatabaseReady(res)) return;

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
  if (!ensureDatabaseReady(res)) return;

  try {
    if (!req.params.id || !Teacher.db?.base?.Types?.ObjectId?.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid teacher id." });
    }

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
