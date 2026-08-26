import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
  const header = req.get("Authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7).trim() : null;

  if (!token) {
    return res.status(401).json({ success: false, message: "Authorization token is required." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "change_this_secret");
    if (!decoded?.id) throw new Error("Token does not contain a user id.");
    req.user = { id: decoded.id, role: decoded.role, email: decoded.email };
    return next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid or expired authorization token." });
  }
}
