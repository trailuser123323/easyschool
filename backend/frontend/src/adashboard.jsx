import { useEffect, useState } from "react";
import "./AdminDashboard.css";
import AdminSidebar from "./components/AdminSidebar";
import TeacherTracking from "./components/TeacherTracking";
import NoticeBoard from "./components/NoticeBoard";
import LeaveRequests from "./components/LeaveRequests";
import { apiUrl, authHeaders } from "./api";

function formatMonthValue(value) {
  const date = value ? new Date(`${value}-01T00:00:00`) : new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthLabel(value) {
  if (!value) return "Month not set";
  return new Date(`${value}-01T00:00:00`).toLocaleDateString([], {
    month: "long",
    year: "numeric",
  });
}

function emptyPeriods() {
  return Array.from({ length: 3 }, (_, index) => ({
    label: `Period ${index + 1}`,
    timeSlot: "",
    subject: "",
    room: "",
  }));
}

function normaliseTimetableEntries(timetable) {
  if (!Array.isArray(timetable)) return [];

  return timetable
    .map((entry) => ({
      month: entry?.month || "",
      periods: Array.from({ length: 3 }, (_, index) => {
        const period = entry?.periods?.[index] || {};
        return {
          label: period?.label || `Period ${index + 1}`,
          timeSlot: period?.timeSlot || "",
          subject: period?.subject || "",
          room: period?.room || "",
        };
      }),
    }))
    .filter((entry) => entry.month);
}

function formatCheckin(lastLogin, fallback = "–") {
  if (!lastLogin) return fallback;
  return new Date(lastLogin).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function normaliseTeacher(teacher, index) {
  return {
    id: teacher.id ?? teacher._id ?? index + 1,
    name: teacher.name,
    email: teacher.email || "",
    initials: teacher.initials || "T",
    subject: teacher.subject || "General",
    class: teacher.class || teacher.className || "–",
    status: teacher.status || (teacher.lastLogin ? "present" : "absent"),
    checkin: formatCheckin(teacher.lastLogin, teacher.checkin || "–"),
    checkout: teacher.checkout || "–",
    onDuty: Boolean(teacher.onDuty),
    absent: teacher.absent ?? 0,
    leave: teacher.leave ?? 0,
    rate: teacher.rate || "0%",
    color: teacher.color || "#4f46e5",
    lastLogin: teacher.lastLogin || null,
    loginPhoto: teacher.loginPhoto || "",
    checkoutPhoto: teacher.checkoutPhoto || "",
    timetable: normaliseTimetableEntries(teacher.timetable),
    attendanceRecords: Array.isArray(teacher.attendanceRecords) ? teacher.attendanceRecords : [],
    leaveRequests: Array.isArray(teacher.leaveRequests) ? teacher.leaveRequests : [],
  };
}

function TeacherAccounts({ teachers }) {
  return (
    <div className="accounts-container">
      <div className="accounts-header">
        <h2>Teacher Accounts</h2>
        <p>Login details and assigned classes for teacher access.</p>
      </div>
      <div className="accounts-list">
        {teachers.map((teacher) => (
          <div key={teacher.id} className="account-row">
            <div className="account-user">
              <div className="teacher-avatar" style={{ "--teacher-color": teacher.color }}>
                {teacher.initials}
              </div>
              <div>
                <div className="teacher-name">{teacher.name}</div>
                <div className="teacher-subject">{teacher.subject} • {teacher.class}</div>
              </div>
            </div>
            <div className="account-meta">
              <div className="account-label">Email</div>
              <div className="account-value">{teacher.email || "No email"}</div>
            </div>
            <div className="account-meta">
              <div className="account-label">Role</div>
              <div className="account-value">Teacher</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AddTeacherPanel({ form, onChange, onSubmit, isSaving }) {
  return (
    <div className="accounts-container">
      <div className="accounts-header">
        <h2>Add Teacher</h2>
        <p>Create a teacher login directly from the admin dashboard.</p>
      </div>
      <form className="add-teacher-form" onSubmit={onSubmit}>
        <div className="add-teacher-grid">
          <label className="form-field">
            <span>Name</span>
            <input name="name" value={form.name} onChange={onChange} placeholder="Priya Ramesh" required />
          </label>
          <label className="form-field">
            <span>Email</span>
            <input name="email" type="email" value={form.email} onChange={onChange} placeholder="teacher@school.com" required />
          </label>
          <label className="form-field">
            <span>Password</span>
            <input name="password" value={form.password} onChange={onChange} placeholder="Set login password" required />
          </label>
          <label className="form-field">
            <span>Subject</span>
            <input name="subject" value={form.subject} onChange={onChange} placeholder="Science" />
          </label>
          <label className="form-field">
            <span>Class</span>
            <input name="className" value={form.className} onChange={onChange} placeholder="9A" />
          </label>
        </div>
        <div className="form-actions">
          <button className="primary-action" type="submit" disabled={isSaving}>
            {isSaving ? "Adding..." : "Add Teacher"}
          </button>
        </div>
      </form>
    </div>
  );
}

function TimetablePanel({ teachers, form, onChange, onPeriodChange, onSubmit, isSaving }) {
  const selectedTeacher = teachers.find((teacher) => String(teacher.id) === form.teacherId);
  const selectedSchedule = selectedTeacher?.timetable?.find((entry) => entry.month === form.month);

  return (
    <div className="accounts-container">
      <div className="accounts-header">
        <h2>Monthly Timetables</h2>
        <p>Assign exactly 3 periods for a selected teacher and month.</p>
      </div>
      <form className="add-teacher-form" onSubmit={onSubmit}>
        <div className="add-teacher-grid">
          <label className="form-field">
            <span>Teacher</span>
            <select name="teacherId" value={form.teacherId} onChange={onChange} required>
              <option value="">Select teacher</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name} · {teacher.subject}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>Month</span>
            <input name="month" type="month" value={form.month} onChange={onChange} required />
          </label>
        </div>

        <div className="period-grid">
          {form.periods.map((period, index) => (
            <div key={period.label} className="period-card">
              <div className="period-title">{period.label}</div>
              <label className="form-field">
                <span>Time Slot</span>
                <input
                  value={period.timeSlot}
                  onChange={(event) => onPeriodChange(index, "timeSlot", event.target.value)}
                  placeholder="09:00 - 09:45"
                />
              </label>
              <label className="form-field">
                <span>Subject</span>
                <input
                  value={period.subject}
                  onChange={(event) => onPeriodChange(index, "subject", event.target.value)}
                  placeholder="Science"
                />
              </label>
              <label className="form-field">
                <span>Room</span>
                <input
                  value={period.room}
                  onChange={(event) => onPeriodChange(index, "room", event.target.value)}
                  placeholder="Lab 2 / 9A"
                />
              </label>
            </div>
          ))}
        </div>

        <div className="form-actions">
          <button className="primary-action" type="submit" disabled={isSaving || teachers.length === 0}>
            {isSaving ? "Saving..." : "Save Monthly Timetable"}
          </button>
        </div>
      </form>

      <div className="timetable-list">
        {selectedTeacher ? (
          selectedSchedule ? (
            <div className="timetable-month-card">
              <div className="timetable-month-title">{formatMonthLabel(selectedSchedule.month)}</div>
              <div className="timetable-period-stack">
                {selectedSchedule.periods.map((period) => (
                  <div key={period.label} className="timetable-row">
                    <div className="timetable-main">
                      <div className="timetable-day">{period.label}</div>
                      <div className="timetable-meta">
                        {period.timeSlot || "Time not set"} · {period.subject || "Subject not set"}
                      </div>
                    </div>
                    <div className="timetable-room">{period.room || "Room not set"}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="timetable-empty">No monthly timetable saved for the selected teacher and month yet.</div>
          )
        ) : (
          <div className="timetable-empty">Select a teacher to review and assign monthly periods.</div>
        )}
      </div>
    </div>
  );
}

export default function AdminDashboard({ user, onLogout }) {
  const [activeSection, setActiveSection] = useState("tracking");
  const [teachers, setTeachers] = useState([]);
  const [teacherForm, setTeacherForm] = useState({
    name: "",
    email: "",
    password: "",
    subject: "",
    className: "",
  });
  const [isSavingTeacher, setIsSavingTeacher] = useState(false);
  const [timetableForm, setTimetableForm] = useState({
    teacherId: "",
    month: formatMonthValue(),
    periods: emptyPeriods(),
  });
  const [isSavingTimetable, setIsSavingTimetable] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [toast, setToast] = useState({ show: false, msg: "" });
  const [lastUpdated, setLastUpdated] = useState("");

  const leaveRequests = teachers.flatMap((teacher) =>
    (teacher.leaveRequests || []).map((request) => ({
      ...request,
      id: `${teacher.id}:${request.id}`,
      requestId: request.id,
      teacherId: teacher.id,
      name: teacher.name,
      initials: teacher.initials,
      color:
        request.status === "approved"
          ? "#059669"
          : request.status === "rejected"
            ? "#dc2626"
            : teacher.color,
    }))
  );

  useEffect(() => {
    let cancelled = false;

    async function loadTeachers() {
      try {
        const response = await fetch(apiUrl("/api/auth/teachers"), {
          headers: authHeaders(),
        });
        const data = await response.json().catch(() => []);
        if (!response.ok) throw new Error(data.message || "Unable to load teachers.");

        if (!cancelled) {
          setTeachers(Array.isArray(data) ? data.map(normaliseTeacher) : []);
          setLastUpdated(
            new Date().toLocaleTimeString([], {
              hour: "numeric",
              minute: "2-digit",
              second: "2-digit",
            })
          );
        }
      } catch (_error) {
        if (!cancelled) setTeachers([]);
      }
    }

    async function loadAnnouncements() {
      try {
        const response = await fetch(apiUrl("/api/auth/announcements"), {
          headers: authHeaders(),
        });
        const data = await response.json().catch(() => []);
        if (!response.ok) throw new Error(data.message || "Unable to load announcements.");
        if (!cancelled) {
          setAnnouncements(Array.isArray(data) ? data : []);
        }
      } catch (_error) {
        if (!cancelled) setAnnouncements([]);
      }
    }

    loadTeachers();
    loadAnnouncements();
    const intervalId = window.setInterval(loadTeachers, 15000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  const showToast = (msg) => {
    setToast({ show: true, msg });
    setTimeout(() => setToast({ show: false, msg: "" }), 3000);
  };

  const handleApproveLeave = async (request) => {
    const teacher = teachers.find((item) => String(item.id) === String(request.teacherId));
    if (!teacher) return;
    const nextLeaveRequests = (teacher.leaveRequests || []).map((item) =>
      item.id === request.requestId ? { ...item, status: "approved" } : item
    );

    try {
      const response = await fetch(apiUrl(`/api/auth/teachers/${teacher.id}`), {
        method: "PUT",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ leaveRequests: nextLeaveRequests }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Unable to approve leave request.");
      setTeachers((current) => current.map((item) => (String(item.id) === String(teacher.id) ? normaliseTeacher(data, 0) : item)));
      showToast("Leave request approved ✅");
    } catch (error) {
      showToast(error.message || "Unable to approve leave request");
    }
  };

  const handleRejectLeave = async (request) => {
    const teacher = teachers.find((item) => String(item.id) === String(request.teacherId));
    if (!teacher) return;
    const nextLeaveRequests = (teacher.leaveRequests || []).map((item) =>
      item.id === request.requestId ? { ...item, status: "rejected" } : item
    );

    try {
      const response = await fetch(apiUrl(`/api/auth/teachers/${teacher.id}`), {
        method: "PUT",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ leaveRequests: nextLeaveRequests }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Unable to reject leave request.");
      setTeachers((current) => current.map((item) => (String(item.id) === String(teacher.id) ? normaliseTeacher(data, 0) : item)));
      showToast("Leave request rejected ❌");
    } catch (error) {
      showToast(error.message || "Unable to reject leave request");
    }
  };

  const handleAddAnnouncement = async (title, body) => {
    try {
      const response = await fetch(apiUrl("/api/auth/announcements"), {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ title, body, icon: "📢", type: "info" }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Unable to post announcement.");
      setAnnouncements((current) => [data, ...current]);
      showToast("Announcement posted ✅");
    } catch (error) {
      showToast(error.message || "Unable to post announcement.");
    }
  };

  const handleTeacherFormChange = ({ target }) => {
    const { name, value } = target;
    setTeacherForm((current) => ({ ...current, [name]: value }));
  };

  const handleAddTeacher = async (event) => {
    event.preventDefault();
    if (isSavingTeacher) return;
    setIsSavingTeacher(true);

    try {
      const response = await fetch(apiUrl("/api/auth/teachers"), {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          name: teacherForm.name.trim(),
          email: teacherForm.email.trim().toLowerCase(),
          password: teacherForm.password.trim(),
          subject: teacherForm.subject.trim(),
          class: teacherForm.className.trim(),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Unable to add teacher.");

      const createdTeacher = normaliseTeacher(data, teachers.length);
      setTeachers((current) => [createdTeacher, ...current]);
      setTimetableForm((current) => ({ ...current, teacherId: String(createdTeacher.id) }));
      setTeacherForm({ name: "", email: "", password: "", subject: "", className: "" });
      showToast("Teacher added ✅");
    } catch (error) {
      showToast(error.message || "Unable to add teacher.");
    } finally {
      setIsSavingTeacher(false);
    }
  };

  const handleTimetableFormChange = ({ target }) => {
    const { name, value } = target;
    setTimetableForm((current) => ({ ...current, [name]: value }));
  };

  const handlePeriodChange = (periodIndex, field, value) => {
    setTimetableForm((current) => ({
      ...current,
      periods: current.periods.map((period, index) => (index === periodIndex ? { ...period, [field]: value } : period)),
    }));
  };

  useEffect(() => {
    const selectedTeacher = teachers.find((teacher) => String(teacher.id) === timetableForm.teacherId);
    const existingSchedule = selectedTeacher?.timetable?.find((entry) => entry.month === timetableForm.month);

    if (existingSchedule) {
      setTimetableForm((current) => ({
        ...current,
        periods: existingSchedule.periods.map((period, index) => ({
          label: period.label || `Period ${index + 1}`,
          timeSlot: period.timeSlot || "",
          subject: period.subject || "",
          room: period.room || "",
        })),
      }));
      return;
    }

    setTimetableForm((current) => ({ ...current, periods: emptyPeriods() }));
  }, [timetableForm.teacherId, timetableForm.month, teachers]);

  const handleAddTimetable = async (event) => {
    event.preventDefault();
    if (isSavingTimetable) return;

    const teacher = teachers.find((item) => String(item.id) === timetableForm.teacherId);
    if (!teacher) {
      showToast("Select a teacher first.");
      return;
    }

    const hasAnyValue = timetableForm.periods.some(
      (period) => period.timeSlot.trim() || period.subject.trim() || period.room.trim()
    );
    if (!hasAnyValue) {
      showToast("Add at least one period before saving.");
      return;
    }

    const nextSchedule = {
      month: timetableForm.month,
      periods: timetableForm.periods.map((period, index) => ({
        label: `Period ${index + 1}`,
        timeSlot: period.timeSlot.trim(),
        subject: period.subject.trim(),
        room: period.room.trim(),
      })),
    };

    const nextTimetable = [
      ...(teacher.timetable || []).filter((entry) => entry.month !== timetableForm.month),
      nextSchedule,
    ].sort((a, b) => a.month.localeCompare(b.month));

    setIsSavingTimetable(true);

    try {
      const response = await fetch(apiUrl(`/api/auth/teachers/${teacher.id}`), {
        method: "PUT",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ timetable: nextTimetable }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Unable to save timetable.");

      const updatedTeacher = normaliseTeacher(data, teachers.length);
      setTeachers((current) => current.map((item) => (String(item.id) === String(updatedTeacher.id) ? updatedTeacher : item)));
      showToast("Monthly timetable saved ✅");
    } catch (error) {
      showToast(error.message || "Unable to save timetable.");
    } finally {
      setIsSavingTimetable(false);
    }
  };

  return (
    <div className="admin-shell">
      <AdminSidebar activeSection={activeSection} onShowSection={setActiveSection} user={user} onLogout={onLogout} />
      <div className="admin-content-wrapper">
        {activeSection === "tracking" && <TeacherTracking teachers={teachers} lastUpdated={lastUpdated} />}
        {activeSection === "teachers" && (
          <>
            <AddTeacherPanel form={teacherForm} onChange={handleTeacherFormChange} onSubmit={handleAddTeacher} isSaving={isSavingTeacher} />
            <TeacherAccounts teachers={teachers} />
          </>
        )}
        {activeSection === "timetables" && (
          <TimetablePanel
            teachers={teachers}
            form={timetableForm}
            onChange={handleTimetableFormChange}
            onPeriodChange={handlePeriodChange}
            onSubmit={handleAddTimetable}
            isSaving={isSavingTimetable}
          />
        )}
        {activeSection === "notices" && <NoticeBoard announcements={announcements} onAddAnnouncement={handleAddAnnouncement} />}
        {activeSection === "leaves" && <LeaveRequests requests={leaveRequests} onApprove={handleApproveLeave} onReject={handleRejectLeave} />}
      </div>

      <div className={`admin-toast ${toast.show ? "show" : ""}`}>{toast.msg}</div>
    </div>
  );
}
