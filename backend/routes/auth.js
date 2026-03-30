import express from "express";
import Teacher from "../models/Teacher.js";
import Admin from "../models/Admin.js";

const router = express.Router();

// ── SEED default admin + teachers if DB is empty ───────────
async function seedIfEmpty() {
  const adminCount = await Admin.countDocuments();
  if (adminCount === 0) {
    await Admin.create({
      name: "Admin",
      email: "admin@gmail.com",
      password: "1234",
      role: "admin",
    });
    console.log("✅ Default admin seeded");
  }

  const teacherCount = await Teacher.countDocuments();
  if (teacherCount === 0) {
    await Teacher.insertMany([
      { name:"Priya Ramesh",   email:"teacher1@gmail.com", password:"12345", subject:"Science",  className:"9A",  initials:"PR", color:"#4f46e5" },
      { name:"Amit Sharma",    email:"amit@school.edu",    password:"12345", subject:"Math",     className:"8B",  initials:"AS", color:"#0891b2" },
      { name:"Rekha Nair",     email:"rekha@school.edu",   password:"12345", subject:"English",  className:"10A", initials:"RN", color:"#d97706" },
      { name:"Suresh Pillai",  email:"suresh@school.edu",  password:"12345", subject:"History",  className:"7C",  initials:"SP", color:"#dc2626" },
      { name:"Meera Joshi",    email:"meera@school.edu",   password:"12345", subject:"Physics",  className:"11B", initials:"MJ", color:"#059669" },
    ]);
    console.log("✅ Default teachers seeded");
  }
}
seedIfEmpty();

// ── POST /api/auth/login ───────────────────────────────────
router.post("/login", async (req, res) => {
  const { email, password, loginPhoto } = req.body;

  try {
    // ── Check admin first ────────────────────────────────
    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (admin) {
      if (admin.password !== password)
        return res.status(401).json({ message: "Invalid password." });

      return res.json({
        token: "admin-token-" + admin._id,
        user: {
          _id:      admin._id,
          name:     admin.name,
          email:    admin.email,
          role:     "admin",
          initials: "AD",
        },
      });
    }

    // ── Check teacher ────────────────────────────────────
    const teacher = await Teacher.findOne({ email: email.toLowerCase() });
    if (!teacher)
      return res.status(401).json({ message: "Invalid email or password." });

    if (teacher.password !== password)
      return res.status(401).json({ message: "Invalid password." });

    // ── Save login photo + timestamp in MongoDB ──────────
    const loginRecord = {
      photo:     loginPhoto || null,
      timestamp: new Date(),
    };

    await Teacher.findByIdAndUpdate(teacher._id, {
      lastLogin: new Date(),
      loginPhoto: loginPhoto || teacher.loginPhoto,   // latest photo (quick access)
      $push: {
        loginHistory: {
          $each:     [loginRecord],
          $slice:    -30,   // keep only last 30 logins per teacher
          $position: 0,
        },
      },
    });

    return res.json({
      token: "teacher-token-" + teacher._id,
      user: {
        _id:        teacher._id,
        name:       teacher.name,
        email:      teacher.email,
        role:       "teacher",
        subject:    teacher.subject,
        class:      teacher.className,
        initials:   teacher.initials,
        color:      teacher.color,
        loginPhoto: loginPhoto || teacher.loginPhoto,
      },
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ── GET /api/auth/teachers  (admin — list all with latest photo) ──
router.get("/teachers", async (req, res) => {
  try {
    // Return all fields except password, but include loginPhoto & lastLogin
    const teachers = await Teacher.find(
      {},
      "-password -loginHistory"   // exclude password & full history for list view
    ).sort({ name: 1 });
    res.json(teachers);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ── GET /api/auth/teachers/:id/history  (login photo history) ─
router.get("/teachers/:id/history", async (req, res) => {
  try {
    const teacher = await Teacher.findById(
      req.params.id,
      "name initials color loginHistory"
    );
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });
    res.json(teacher);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ── POST /api/auth/teachers  (add teacher) ────────────────
router.post("/teachers", async (req, res) => {
  try {
    const { name, email, password, subject, className, color } = req.body;
    const exists = await Teacher.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(400).json({ message: "Email already exists" });

    const parts    = name.trim().split(" ");
    const initials = ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase();

    const teacher = await Teacher.create({
      name,
      email:    email.toLowerCase(),
      password,
      subject,
      className,
      color:    color || "#4f46e5",
      initials,
    });

    const { password: _, ...data } = teacher.toObject();
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ── DELETE /api/auth/teachers/:id ────────────────────────
router.delete("/teachers/:id", async (req, res) => {
  try {
    await Teacher.findByIdAndDelete(req.params.id);
    res.json({ message: "Teacher deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ── PUT /api/auth/teachers/:id  (update status / duty etc.) ─
router.put("/teachers/:id", async (req, res) => {
  try {
    const updated = await Teacher.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, select: "-password -loginHistory" }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;