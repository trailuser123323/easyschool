import express from "express";
const router = express.Router();

const PRIYA_CHECKIN_PHOTO =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 320">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#eff6ff"/>
          <stop offset="100%" stop-color="#dbeafe"/>
        </linearGradient>
      </defs>
      <rect width="480" height="320" fill="url(#bg)"/>
      <rect x="28" y="28" width="424" height="264" rx="24" fill="#ffffff" stroke="#cbd5e1"/>
      <circle cx="142" cy="132" r="54" fill="#4f46e5" opacity="0.12"/>
      <circle cx="142" cy="118" r="28" fill="#4f46e5" opacity="0.88"/>
      <path d="M94 188c12-28 35-42 48-42s36 14 48 42" fill="#4f46e5" opacity="0.88"/>
      <text x="222" y="104" font-size="24" font-family="Arial, sans-serif" fill="#0f172a" font-weight="700">Priya Ramesh</text>
      <text x="222" y="142" font-size="18" font-family="Arial, sans-serif" fill="#475569">Science Teacher • Class 9A</text>
      <text x="222" y="178" font-size="16" font-family="Arial, sans-serif" fill="#64748b">Check-in verified at Principal Office</text>
      <rect x="222" y="202" width="146" height="36" rx="18" fill="#dcfce7"/>
      <text x="295" y="225" text-anchor="middle" font-size="15" font-family="Arial, sans-serif" fill="#166534" font-weight="700">Checked in</text>
      <text x="222" y="264" font-size="14" font-family="Arial, sans-serif" fill="#94a3b8">Demo teacher photo</text>
    </svg>
  `);

const PRIYA_CHECKOUT_PHOTO =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 320">
      <defs>
        <linearGradient id="bg2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#f8fafc"/>
          <stop offset="100%" stop-color="#e2e8f0"/>
        </linearGradient>
      </defs>
      <rect width="480" height="320" fill="url(#bg2)"/>
      <rect x="28" y="28" width="424" height="264" rx="24" fill="#ffffff" stroke="#cbd5e1"/>
      <circle cx="142" cy="132" r="54" fill="#0f766e" opacity="0.12"/>
      <circle cx="142" cy="118" r="28" fill="#0f766e" opacity="0.88"/>
      <path d="M94 188c12-28 35-42 48-42s36 14 48 42" fill="#0f766e" opacity="0.88"/>
      <text x="222" y="104" font-size="24" font-family="Arial, sans-serif" fill="#0f172a" font-weight="700">Priya Ramesh</text>
      <text x="222" y="142" font-size="18" font-family="Arial, sans-serif" fill="#475569">Science Teacher • Class 9A</text>
      <text x="222" y="178" font-size="16" font-family="Arial, sans-serif" fill="#64748b">Check-out verified at school gate</text>
      <rect x="222" y="202" width="156" height="36" rx="18" fill="#ccfbf1"/>
      <text x="300" y="225" text-anchor="middle" font-size="15" font-family="Arial, sans-serif" fill="#115e59" font-weight="700">Checked out</text>
      <text x="222" y="264" font-size="14" font-family="Arial, sans-serif" fill="#94a3b8">Demo teacher photo</text>
    </svg>
  `);

const adminUser = {
  id: 1,
  email: "admin@gmail.com",
  password: "1234",
  role: "admin",
  name: "Admin",
  initials: "AD",
};

const teachers = [
  { id: 2, name: "Priya Ramesh", email: "teacher1@gmail.com", password: "12345", role: "teacher", subject: "Science", class: "9A", initials: "PR", color: "#4f46e5", status: "present", checkin: "8:47 AM", checkout: "4:02 PM", onDuty: true, absent: 2, leave: 2, rate: "91%", lastLogin: null, lastCheckout: null, loginPhoto: PRIYA_CHECKIN_PHOTO, checkoutPhoto: PRIYA_CHECKOUT_PHOTO },
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
