import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export function issueToken(user) {
  return jwt.sign(
    { id: String(user._id), role: user.role, email: user.email },
    process.env.JWT_SECRET || "change_this_secret",
    { expiresIn: "7d" },
  );
}

export async function verifyPassword(user, password) {
  const isHashed = typeof user.password === "string" && user.password.startsWith("$2");
  const valid = isHashed
    ? await bcrypt.compare(password, user.password)
    : user.password === password;

  if (valid && !isHashed) {
    user.password = await bcrypt.hash(password, 10);
    await user.save();
  }

  return valid;
}
