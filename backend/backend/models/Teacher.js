import mongoose from "mongoose";

const teacherSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, default: "teacher" },
    subject: { type: String, default: "" },
    class: { type: String, default: "" },
    initials: { type: String, default: "T" },
    color: { type: String, default: "#4f46e5" },
    status: { type: String, default: "absent" },
    checkin: { type: String, default: "–" },
    checkout: { type: String, default: "–" },
    onDuty: { type: Boolean, default: false },
    absent: { type: Number, default: 0 },
    leave: { type: Number, default: 0 },
    rate: { type: String, default: "0%" },
    lastLogin: { type: Date, default: null },
    lastCheckout: { type: Date, default: null },
    loginPhoto: { type: String, default: "" },
    checkoutPhoto: { type: String, default: "" },
    timetable: {
      type: [
        {
          month: { type: String, default: "" },
          periods: {
            type: [
              {
                label: { type: String, default: "" },
                timeSlot: { type: String, default: "" },
                subject: { type: String, default: "" },
                room: { type: String, default: "" },
              },
            ],
            default: [],
          },
        },
      ],
      default: [],
    },
    attendanceRecords: {
      type: [
        {
          date: { type: String, default: "" },
          status: { type: String, default: "absent" },
          checkin: { type: String, default: "–" },
          checkout: { type: String, default: "–" },
          loginPhoto: { type: String, default: "" },
          checkoutPhoto: { type: String, default: "" },
        },
      ],
      default: [],
    },
    leaveRequests: {
      type: [
        {
          id: { type: String, default: "" },
          type: { type: String, default: "" },
          dates: { type: String, default: "" },
          status: { type: String, default: "pending" },
          reason: { type: String, default: "" },
          createdAtLabel: { type: String, default: "" },
        },
      ],
      default: [],
    },
    preferences: {
      emailNotifications: { type: Boolean, default: true },
      announcementAlerts: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

export default mongoose.models.Teacher || mongoose.model("Teacher", teacherSchema);
