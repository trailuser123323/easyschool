import express from "express";
const router = express.Router();

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

router.put("/teachers/:id", (req, res) => {
  const teacherId = Number(req.params.id);
  const teacher = teachers.find((item) => item.id === teacherId);

  if (!teacher) {
    return res.status(404).json({ message: "Teacher not found." });
  }

  Object.assign(teacher, req.body);
  return res.json(serializeTeacher(teacher));
});

export default router;
