import express from "express";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import multer from "multer";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";
import Announcement from "../models/Announcement.js";
import Teacher from "../models/Teacher.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, "..", "uploads");

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const JWT_EXPIRES = process.env.JWT_EXPIRES || "24h";

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

function formatAnnouncementTime(date) {
  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function serializeTeacher(teacher) {
  const userData = teacher.toObject ? teacher.toObject() : { ...teacher };
  delete userData.password;
  return userData;
}

function serializeAdmin(admin) {
  const userData = admin.toObject ? admin.toObject() : { ...admin };
  delete userData.password;
  return userData;
}

function serializeAnnouncement(announcement) {
  const data = announcement.toObject ? announcement.toObject() : { ...announcement };
  return {
    id: data._id,
    title: data.title,
    body: data.body,
    type: data.type || "info",
    icon: data.icon || "📢",
    badge: data.badge || "",
    createdBy: data.createdBy || "Admin Office",
    time: formatAnnouncementTime(data.createdAt || new Date()),
  };
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value || "");
}

function validateLoginPayload(req, res, next) {
  const { email, password } = req.body || {};
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

  if (!isValidEmail(normalizedEmail)) {
    return res.status(400).json({ message: "A valid email is required." });
  }

  if (typeof password !== "string" || password.trim().length === 0) {
    return res.status(400).json({ message: "Password is required." });
  }

  req.body.email = normalizedEmail;
  return next();
}

function validateAnnouncementPayload(req, res, next) {
  const title = req.body?.title?.trim();
  const body = req.body?.body?.trim();

  if (!title || title.length < 3) {
    return res.status(400).json({ message: "Title must be at least 3 characters long." });
  }

  if (!body || body.length < 5) {
    return res.status(400).json({ message: "Body must be at least 5 characters long." });
  }

  req.body.title = title;
  req.body.body = body;
  return next();
}

function validateTeacherPayload(req, res, next) {
  const { name, email, password } = req.body || {};
  const trimmedName = typeof name === "string" ? name.trim() : "";
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  const trimmedPassword = typeof password === "string" ? password.trim() : "";

  if (!trimmedName || trimmedName.length < 2) {
    return res.status(400).json({ message: "Name must be at least 2 characters long." });
  }

  if (!isValidEmail(normalizedEmail)) {
    return res.status(400).json({ message: "A valid email is required." });
  }

  if (trimmedPassword.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters long." });
  }

  req.body.name = trimmedName;
  req.body.email = normalizedEmail;
  req.body.password = trimmedPassword;
  return next();
}

function normaliseTeacherTimetable(timetable = []) {
  if (!Array.isArray(timetable)) return [];

  const monthlySchedules = timetable
    .map((entry, index) => {
      if (entry?.month || Array.isArray(entry?.periods)) {
        return {
          month: entry?.month || "",
          periods: Array.isArray(entry?.periods)
            ? entry.periods.slice(0, 3).map((period, periodIndex) => ({
                label: period?.label || `Period ${periodIndex + 1}`,
                timeSlot: period?.timeSlot || "",
                subject: period?.subject || "",
                room: period?.room || "",
              }))
            : [],
        };
      }

      const derivedMonth = entry?.date?.slice(0, 7) || getTodayKey().slice(0, 7);
      return {
        month: derivedMonth,
        periods: [
          {
            label: entry?.label || entry?.period || `Period ${index + 1}`,
            timeSlot: entry?.timeSlot || "",
            subject: entry?.subject || "",
            room: entry?.room || "",
          },
        ],
      };
    })
    .filter((entry) => entry.month);

  const grouped = new Map();
  for (const entry of monthlySchedules) {
    const current = grouped.get(entry.month) || [];
    current.push(...entry.periods);
    grouped.set(entry.month, current);
  }

  return [...grouped.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, periods]) => ({
      month,
      periods: Array.from({ length: 3 }, (_, index) => {
        const period = periods[index] || {};
        return {
          label: period.label || `Period ${index + 1}`,
          timeSlot: period.timeSlot || "",
          subject: period.subject || "",
          room: period.room || "",
        };
      }),
    }));
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
  if ('loginPhoto' in updates) baseRecord.loginPhoto = updates.loginPhoto || '';
  if ('checkoutPhoto' in updates) baseRecord.checkoutPhoto = updates.checkoutPhoto || '';

  if (index >= 0) {
    records[index] = baseRecord;
  } else if (updates.status || updates.checkin || updates.checkout) {
    records.unshift(baseRecord);
  }

  teacher.attendanceRecords = records.slice(0, 90);
}

function createToken(user) {
  return jwt.sign({ userId: String(user._id), role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

async function attachAuthUser(req, _res, next) {
  const header = req.get("authorization") || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return next();
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const model = payload.role === "admin" ? Admin : Teacher;
    const user = await model.findById(payload.userId);
    if (!user) return next();

    req.auth = {
      token,
      role: payload.role,
      userId: payload.userId,
      user,
    };
  } catch (err) {
    // invalid token — ignore and continue as unauthenticated
  }

  return next();
}

function requireAuth(req, res, next) {
  if (!req.auth?.user) {
    return res.status(401).json({ message: "Authentication required." });
  }

  return next();
}

function requireAdmin(req, res, next) {
  if (req.auth?.role !== "admin") {
    return res.status(403).json({ message: "Admin access required." });
  }

  return next();
}

function canModifyTeacher(req, res, next) {
  if (req.auth?.role === "admin") {
    return next();
  }

  if (req.auth?.role === "teacher" && String(req.auth.userId) === String(req.params.id)) {
    return next();
  }

  return res.status(403).json({ message: "You do not have permission to update this teacher." });
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
  if (mongoose.connection.readyState !== 1) {
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Database not ready in time.")), 15000);
      const finish = () => {
        clearTimeout(timeout);
        resolve();
      };

      if (mongoose.connection.readyState === 1) {
        finish();
        return;
      }

      mongoose.connection.once("connected", finish);
      mongoose.connection.once("error", reject);
    });
  }

  const adminCount = await Admin.countDocuments();
  if (adminCount === 0) {
    const pwd = process.env.SEED_ADMIN_PASSWORD || 'changeme1234';
    const hashed = await bcrypt.hash(pwd, 10);
    await Admin.create({
      name: "Admin",
      email: "admin@gmail.com",
      password: hashed,
      role: "admin",
      initials: "AD",
    });
  }

  const teacherCount = await Teacher.countDocuments();
  if (teacherCount === 0) {
    const teacherPwd = process.env.SEED_TEACHER_PASSWORD || 'teacher12345';
    const teacherHashed = await bcrypt.hash(teacherPwd, 10);
    await Teacher.create({
      name: "Priya Ramesh",
      email: "teacher1@gmail.com",
      password: teacherHashed,
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
      timetable: [
        {
          month: getTodayKey().slice(0, 7),
          periods: [
            { label: "Period 1", timeSlot: "09:00 - 09:45", subject: "Science", room: "Lab 2" },
            { label: "Period 2", timeSlot: "10:00 - 10:45", subject: "Class 9A", room: "Room 14" },
            { label: "Period 3", timeSlot: "11:15 - 12:00", subject: "Practical", room: "Lab 1" },
          ],
        },
      ],
      attendanceRecords: [
        { date: getTodayKey(), status: "present", checkin: "8:45 AM", checkout: "–" },
      ],
    });
  }

  const announcementCount = await Announcement.countDocuments();
  if (announcementCount === 0) {
    await Announcement.insertMany([
      {
        title: "Staff Meeting",
        body: "All teachers should report to the conference hall at 2:30 PM.",
        type: "warn",
        icon: "⚠️",
        badge: "New",
        createdBy: "Principal",
      },
      {
        title: "Annual Day Rehearsal",
        body: "Rehearsals begin on Monday for classes 6 to 10.",
        type: "info",
        icon: "📌",
        createdBy: "Admin Office",
      },
    ]);
  }
}

seedIfEmpty().catch((error) => {
  console.error("Seed error:", error);
});

router.post("/login", validateLoginPayload, async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = email?.trim().toLowerCase();

  try {
    const adminUser = await Admin.findOne({ email: normalizedEmail });
    if (adminUser) {
      let match = false;
      if (typeof adminUser.password === 'string' && adminUser.password.startsWith('$2')) {
        match = await bcrypt.compare(password, adminUser.password);
      } else {
        match = adminUser.password === password;
        if (match) {
          // upgrade to hashed password
          adminUser.password = await bcrypt.hash(password, 10);
          await adminUser.save();
        }
      }

      if (!match) return res.status(401).json({ message: 'Invalid email or password.' });

      return res.json({ token: createToken(adminUser), user: serializeAdmin(adminUser) });
    }

    const teacher = await Teacher.findOne({ email: normalizedEmail });
    if (!teacher) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // support legacy plaintext and hashed passwords; upgrade plaintext to hash
    let teacherMatch = false;
    if (typeof teacher.password === 'string' && teacher.password.startsWith('$2')) {
      teacherMatch = await bcrypt.compare(password, teacher.password);
    } else {
      teacherMatch = teacher.password === password;
      if (teacherMatch) {
        teacher.password = await bcrypt.hash(password, 10);
        await teacher.save();
      }
    }

    if (!teacherMatch) {
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
      token: createToken(teacher),
      user: serializeTeacher(teacher),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.use(attachAuthUser);

router.get("/announcements", requireAuth, async (_req, res) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 });
    res.json(announcements.map(serializeAnnouncement));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/announcements", requireAuth, requireAdmin, validateAnnouncementPayload, async (req, res) => {
  const title = req.body?.title?.trim();
  const body = req.body?.body?.trim();

  if (!title || !body) {
    return res.status(400).json({ message: "Title and body are required." });
  }

  try {
    const announcement = await Announcement.create({
      title,
      body,
      type: req.body?.type || "info",
      icon: req.body?.icon || "📢",
      badge: req.body?.badge || "",
      createdBy: req.auth?.user?.name || "Admin Office",
    });

    return res.status(201).json(serializeAnnouncement(announcement));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.put("/announcements/:id", requireAuth, requireAdmin, validateAnnouncementPayload, async (req, res) => {
  if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: "Invalid announcement id." });
  }

  const title = req.body?.title?.trim();
  const body = req.body?.body?.trim();

  if (!title || !body) {
    return res.status(400).json({ message: "Title and body are required." });
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

    return res.json(serializeAnnouncement(announcement));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.delete("/announcements/:id", requireAuth, requireAdmin, async (req, res) => {
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

router.get("/teachers", requireAuth, requireAdmin, async (_req, res) => {
  try {
    const teachers = await Teacher.find().sort({ name: 1 });
    res.json(teachers.map(serializeTeacher));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/teachers/:id", requireAuth, canModifyTeacher, async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found." });
    }

    return res.json(serializeTeacher(teacher));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/teachers", requireAuth, requireAdmin, validateTeacherPayload, async (req, res) => {
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
      password: await bcrypt.hash(trimmedPassword, 10),
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

router.post("/teachers/upload", requireAuth, upload.single("photo"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Photo file is required." });
  }

  const forwardedProto = req.get("x-forwarded-proto");
  const forwardedHost = req.get("x-forwarded-host");
  const protocol = forwardedProto?.split(",")[0]?.trim() || req.protocol;
  const host = forwardedHost?.split(",")[0]?.trim() || req.get("host");
  return res.json({
    photoUrl: `${protocol}://${host}/uploads/${req.file.filename}`,
    photoPath: `/uploads/${req.file.filename}`,
    filename: req.file.filename,
  });
});

router.put("/teachers/:id", requireAuth, canModifyTeacher, async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found." });
    }

    const updates = req.body || {};
    const allowedKeys = req.auth?.role === "admin"
      ? [
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
          "preferences",
          "attendanceRecords",
        ]
      : [
          "name",
          "status",
          "checkin",
          "checkout",
          "onDuty",
          "lastLogin",
          "lastCheckout",
          "loginPhoto",
          "checkoutPhoto",
          "leaveRequests",
          "preferences",
        ];

    for (const key of allowedKeys) {
      if (!(key in updates)) continue;

      if (key === "timetable") {
        teacher.timetable = normaliseTeacherTimetable(updates.timetable);
        continue;
      }

      if (key === "preferences") {
        teacher.preferences = {
          ...(teacher.preferences?.toObject ? teacher.preferences.toObject() : teacher.preferences || {}),
          ...(updates.preferences || {}),
        };
        continue;
      }

      if (key === "leaveRequests") {
        teacher.leaveRequests = Array.isArray(updates.leaveRequests) ? updates.leaveRequests : [];
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

    teacher.timetable = normaliseTeacherTimetable(teacher.timetable);
    await teacher.save();

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
