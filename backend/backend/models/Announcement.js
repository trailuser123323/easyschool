import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    type: { type: String, default: "info" },
    icon: { type: String, default: "📢" },
    badge: { type: String, default: "" },
    createdBy: { type: String, default: "Admin Office" },
  },
  { timestamps: true }
);

export default mongoose.models.Announcement || mongoose.model("Announcement", announcementSchema);
