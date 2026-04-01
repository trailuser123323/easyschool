import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    icon: { type: String, default: "📢" },
    type: { type: String, default: "info" },
  },
  { timestamps: true }
);

export default mongoose.models.Announcement || mongoose.model("Announcement", announcementSchema);
