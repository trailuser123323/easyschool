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
