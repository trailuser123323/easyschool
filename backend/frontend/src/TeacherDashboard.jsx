import { useEffect, useRef, useState } from "react";
import { apiUrl, authHeaders } from "./api";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function padZ(n) {
  return String(n).padStart(2, "0");
}

function fmtTime(d) {
  let h = d.getHours();
  const m = d.getMinutes();
  const ap = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${padZ(m)} ${ap}`;
}

function fmtDate(d) {
  const dy = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return `${dy[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function currentMonthValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function normaliseMonthlyTimetable(timetable) {
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

function normaliseLeaveRequests(leaveRequests) {
  return Array.isArray(leaveRequests) ? leaveRequests : [];
}

function normaliseAttendanceRecords(records) {
  return Array.isArray(records)
    ? [...records]
        .map((record) => ({
          date: record?.date || "",
          status: record?.status || "absent",
          checkin: record?.checkin || "–",
          checkout: record?.checkout || "–",
        }))
        .filter((record) => record.date)
        .sort((a, b) => b.date.localeCompare(a.date))
    : [];
}

function buildAttendanceMap(teacher) {
  const map = {};
  for (const record of normaliseAttendanceRecords(teacher?.attendanceRecords)) {
    const parsed = new Date(`${record.date}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) continue;
    map[`${parsed.getFullYear()}-${parsed.getMonth() + 1}-${parsed.getDate()}`] = {
      s: record.status,
      i: record.checkin,
      o: record.checkout,
    };
  }
  return map;
}

function generateStudents(teacher) {
  const classLabel = teacher?.class || "9A";
  const students = ["Aarav", "Maya", "Ishaan", "Diya", "Rohan", "Sneha"];
  return students.map((name, index) => ({
    id: `${classLabel}-${index + 1}`,
    name: `${name} ${String.fromCharCode(75 + index)}`,
    rollNo: `${classLabel}-${index + 1}`,
    attendance: `${94 - index}%`,
    status: index % 4 === 0 ? "Needs follow-up" : "On track",
  }));
}

function computeStats(teacher) {
  const records = normaliseAttendanceRecords(teacher?.attendanceRecords);
  const present = records.filter((record) => record.status === "present").length;
  const absent = records.filter((record) => record.status === "absent").length;
  const leave = records.filter((record) => record.status === "leave").length;
  const total = records.length || 1;
  const rate = `${Math.round((present / total) * 100)}%`;

  return [
    { label: "Present Days", value: present, sub: "Recorded attendance days", color: "#059669" },
    { label: "Absent Days", value: absent, sub: "Requires follow-up", color: "#dc2626" },
    { label: "Leave Taken", value: leave, sub: "Approved and pending", color: "#d97706" },
    { label: "On-Time Rate", value: teacher?.rate || rate, sub: teacher?.checkin && teacher.checkin !== "–" ? `Latest check-in ${teacher.checkin}` : "Waiting for next check-in", color: "#2563eb" },
  ];
}

function dataUrlToFile(dataUrl, filename) {
  const [meta, content] = dataUrl.split(",");
  const mimeMatch = meta?.match(/data:(.*?);base64/);
  const mimeType = mimeMatch?.[1] || "image/jpeg";
  const binary = atob(content || "");
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new File([bytes], filename, { type: mimeType });
}

async function uploadAttendancePhoto(photo, action) {
  if (!photo) return "";
  if (!photo.startsWith("data:")) return photo;

  const formData = new FormData();
  formData.append("photo", dataUrlToFile(photo, `${action}-${Date.now()}.jpg`));

  const response = await fetch(apiUrl("/api/auth/teachers/upload"), {
    method: "POST",
    headers: authHeaders(),
    body: formData,
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Unable to upload photo.");
  }

  return data.photoUrl || "";
}

function Sidebar({ activeSection, onNav, onApplyLeave, teacher, onLogout }) {
  const navItems = [
    { id: "dashboard", icon: "🏠", label: "Dashboard", group: "main" },
    { id: "attendance", icon: "📅", label: "Attendance", group: "main" },
    { id: "timetable", icon: "📋", label: "Timetable", group: "main" },
    { id: "students", icon: "👨‍🎓", label: "My Students", group: "main" },
    { id: "leave", icon: "📝", label: "Apply Leave", group: "tools", special: true },
    { id: "announcements", icon: "📢", label: "Announcements", group: "tools" },
    { id: "settings", icon: "⚙️", label: "Settings", group: "tools" },
  ];

  return (
    <aside style={styles.sidebar}>
      <div style={styles.logoArea}><div style={styles.portalLabel}>Staff Portal</div></div>
      <div style={styles.teacherPill}>
        <div style={styles.avatar}>{teacher?.initials || "T"}</div>
        <div>
          <div style={styles.teacherName}>{teacher?.name || "Teacher"}</div>
          <div style={styles.teacherRole}>{teacher ? `${teacher.subject} · Class ${teacher.class}` : ""}</div>
        </div>
      </div>
      <nav style={styles.nav}>
        <div style={styles.navLbl}>Main</div>
        {navItems.filter((item) => item.group === "main").map((item) => (
          <button key={item.id} style={{ ...styles.navItem, ...(activeSection === item.id ? styles.navItemActive : {}) }} onClick={() => onNav(item.id)}>
            <span style={styles.navIcon}>{item.icon}</span> {item.label}
          </button>
        ))}
        <div style={styles.navLbl}>Tools</div>
        {navItems.filter((item) => item.group === "tools").map((item) => (
          <button
            key={item.id}
            style={{ ...styles.navItem, ...(activeSection === item.id ? styles.navItemActive : {}) }}
            onClick={() => (item.special ? onApplyLeave() : onNav(item.id))}
          >
            <span style={styles.navIcon}>{item.icon}</span> {item.label}
          </button>
        ))}
        <div style={styles.navLbl}>Account</div>
        <button style={{ ...styles.navItem, color: "rgba(220,80,80,.8)" }} onClick={onLogout}>
          <span style={styles.navIcon}>🚪</span> Logout
        </button>
      </nav>
      <div style={styles.sidebarFooter}>
        <div style={styles.statusBadge}>
          <div style={styles.statusDot}></div>
          <span style={styles.statusText}>{teacher?.onDuty ? "On duty · Active" : "Available on campus"}</span>
        </div>
      </div>
    </aside>
  );
}

function StatsRow({ teacher }) {
  const stats = computeStats(teacher);
  return (
    <div style={styles.statsRow}>
      {stats.map((stat) => (
        <div key={stat.label} style={styles.statCard}>
          <div style={styles.statLabel}>{stat.label}</div>
          <div style={{ ...styles.statValue, color: stat.color }}>{stat.value}</div>
          <div style={styles.statSub}>{stat.sub}</div>
        </div>
      ))}
    </div>
  );
}

function PingTimer() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(`${59 - now.getMinutes()}m ${60 - now.getSeconds()}s`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);
  return <span style={styles.pingTimer}>{time}</span>;
}

function LocationPings({ teacher }) {
  const verified = teacher?.checkin && teacher.checkin !== "–";
  const pings = [
    { time: teacher?.checkin || "08:45 AM", status: verified ? "ok" : "miss", coords: verified ? "18.5204° N, 73.8567° E" : "Pending" },
    { time: "10:00 AM", status: verified ? "ok" : "miss", coords: verified ? "18.5204° N, 73.8567° E" : "Pending" },
    { time: "12:00 PM", status: teacher?.onDuty ? "ok" : "miss", coords: teacher?.onDuty ? "18.5204° N, 73.8567° E" : "Pending" },
  ];

  return (
    <div style={{ marginTop: 18 }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
        📍 Hourly Location Pings
        <div style={styles.nextPing}>
          <span style={styles.pingLabel}>Next ping in&nbsp;</span>
          <PingTimer />
        </div>
      </div>
      {pings.map((ping) => (
        <div key={ping.time} style={{ ...styles.locationRow, opacity: ping.status === "ok" ? 1 : 0.6 }}>
          <span style={styles.locTime}>{ping.time}</span>
          <span style={{ ...styles.locBadge, ...(ping.status === "ok" ? styles.locBadgeOk : styles.locBadgeMiss) }}>
            {ping.status === "ok" ? "✓ Verified" : "Pending"}
          </span>
          <span style={styles.locCoords}>{ping.coords}</span>
          <div style={styles.locPhoto}>{ping.status === "ok" ? "📷" : ""}</div>
        </div>
      ))}
    </div>
  );
}

function CameraModal({ action, onClose, onConfirm, initialPhoto }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const streamRef = useRef(null);
  const [photo, setPhoto] = useState(initialPhoto || "");
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [reading, setReading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function startCamera() {
      if (photo || !navigator.mediaDevices?.getUserMedia) {
        if (!navigator.mediaDevices?.getUserMedia) setCameraError("Camera access is not supported in this browser.");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCameraReady(true);
          setCameraError("");
        }
      } catch (_error) {
        setCameraError("Camera permission was blocked. Use Upload instead.");
      }
    }

    startCamera();
    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [photo]);

  function handleFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    setReading(true);
    reader.onload = () => {
      setPhoto(typeof reader.result === "string" ? reader.result : "");
      setReading(false);
    };
    reader.onerror = () => setReading(false);
    reader.readAsDataURL(file);
  }

  function capturePhoto() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    setPhoto(canvas.toDataURL("image/jpeg", 0.92));
  }

  return (
    <div style={styles.modalOverlay} onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div style={styles.modal}>
        <button style={styles.modalClose} onClick={onClose}>✕</button>
        <div style={styles.modalTitle}>{action === "checkin" ? "Check In Verification" : "Check Out Verification"}</div>
        <div style={styles.modalSub}>
          {action === "checkin" ? "Take a photo outside the Principal's office to verify your arrival." : "Take a photo to confirm your departure."}
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} style={{ display: "none" }} />
        <canvas ref={canvasRef} style={{ display: "none" }} />
        <div style={styles.cameraPreview}>
          {photo ? (
            <img src={photo} alt={`${action} capture`} style={styles.cameraImage} />
          ) : cameraReady ? (
            <video ref={videoRef} autoPlay playsInline muted style={styles.cameraImage} />
          ) : (
            <div style={styles.cameraPlaceholder}>{reading ? "⏳" : "📷"}</div>
          )}
        </div>
        {cameraError && <div style={styles.cameraError}>{cameraError}</div>}
        <div style={styles.cameraHint}>📍 Location captured automatically · <b>18.5204° N, 73.8567° E</b></div>
        <div style={styles.modalBtns}>
          <button style={styles.modalBtn} onClick={onClose}>Cancel</button>
          {!photo && <button style={styles.modalBtn} onClick={() => fileInputRef.current?.click()}>Upload</button>}
          <button
            style={{ ...styles.modalBtn, ...styles.modalBtnPrimary }}
            onClick={() => {
              if (!photo) {
                if (cameraReady) capturePhoto();
                else fileInputRef.current?.click();
                return;
              }
              onConfirm({ time: fmtTime(new Date()), photo });
              onClose();
            }}
          >
            {photo ? "✅ Confirm" : "📸 Capture Photo"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AnnouncementList({ items }) {
  return (
    <div style={{ paddingTop: 8 }}>
      {items.map((item, index) => (
        <div key={item.id || `${item.title}-${index}`} style={{ ...styles.annItem, ...(index === items.length - 1 ? { borderBottom: "none" } : {}) }}>
          <div style={{ ...styles.annIcon, ...(item.type === "warn" ? styles.annIconWarn : item.type === "alert" ? styles.annIconAlert : styles.annIconInfo) }}>
            {item.icon || "📢"}
          </div>
          <div>
            <div style={styles.annTitle}>
              {item.title}
              {item.badge && <span style={styles.annBadge}>{item.badge}</span>}
            </div>
            <div style={styles.annBody}>{item.body}</div>
            <div style={styles.annTime}>{item.time}{item.createdBy ? ` · From: ${item.createdBy}` : ""}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function AttendanceCard({ teacher, showToast, onTeacherUpdate }) {
  const teacherId = teacher?.id || teacher?._id;
  const [checkinTime, setCheckinTime] = useState(teacher?.checkin && teacher.checkin !== "–" ? teacher.checkin : null);
  const [checkoutTime, setCheckoutTime] = useState(teacher?.checkout && teacher.checkout !== "–" ? teacher.checkout : null);
  const [checkinPhoto, setCheckinPhoto] = useState(teacher?.loginPhoto || "");
  const [checkoutPhoto, setCheckoutPhoto] = useState(teacher?.checkoutPhoto || "");
  const [onDuty, setOnDuty] = useState(Boolean(teacher?.onDuty));
  const [modal, setModal] = useState(null);
  const [savingAction, setSavingAction] = useState("");

  useEffect(() => {
    setCheckinTime(teacher?.checkin && teacher.checkin !== "–" ? teacher.checkin : null);
    setCheckoutTime(teacher?.checkout && teacher.checkout !== "–" ? teacher.checkout : null);
    setCheckinPhoto(teacher?.loginPhoto || "");
    setCheckoutPhoto(teacher?.checkoutPhoto || "");
    setOnDuty(Boolean(teacher?.onDuty));
  }, [teacher]);

  async function persistAttendance(nextFields) {
    if (!teacherId) return null;
    const response = await fetch(apiUrl(`/api/auth/teachers/${teacherId}`), {
      method: "PUT",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(nextFields),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "Unable to update attendance.");
    onTeacherUpdate?.(data);
    return data;
  }

  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <div style={styles.cardTitle}>Today's Attendance Verification</div>
        {onDuty && <div style={styles.dutyBadge}><div style={{ ...styles.statusDot, width: 6, height: 6 }}></div> On Duty</div>}
      </div>
      <div style={styles.cardBody}>
        <div style={styles.checkinRow}>
          {[
            { id: "checkin", icon: checkinTime ? "✅" : "📷", label: checkinTime ? "Checked In" : "Check In", time: checkinTime || "Tap to verify at gate" },
            { id: "checkout", icon: checkoutTime ? "✅" : "🚪", label: checkoutTime ? "Checked Out" : "Check Out", time: checkoutTime || "Not checked out yet" },
          ].map((box) => (
            <div
              key={box.id}
              style={{ ...styles.checkinBox, ...(box.id === "checkin" && checkinTime ? styles.checkinBoxDone : {}), ...(box.id === "checkout" && checkoutTime ? styles.checkinBoxDone : {}) }}
              onClick={() => setModal(box.id)}
            >
              <span style={{ fontSize: 28, display: "block", marginBottom: 8, color: (box.id === "checkin" && checkinTime) || (box.id === "checkout" && checkoutTime) ? "#059669" : "inherit" }}>
                {box.icon}
              </span>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{box.label}</div>
              <div style={{ fontSize: 12, color: "#6b6b8a", marginTop: 4 }}>{box.time}</div>
            </div>
          ))}
        </div>
        <button
          style={{ ...styles.dutyBtn, ...(onDuty ? styles.dutyBtnOn : styles.dutyBtnOff) }}
          onClick={async () => {
            const nextOnDuty = !onDuty;
            setOnDuty(nextOnDuty);
            try {
              await persistAttendance({ onDuty: nextOnDuty });
              showToast(nextOnDuty ? "✅" : "🔴", nextOnDuty ? "You are now marked On Duty" : "Duty ended");
            } catch (error) {
              setOnDuty(!nextOnDuty);
              showToast("⚠️", error.message || "Unable to update duty status");
            }
          }}
        >
          <span>{onDuty ? "✅" : "🟢"}</span> {onDuty ? "On Duty — Active" : "Mark On Duty"}
        </button>
        <LocationPings teacher={teacher} />
      </div>
      {modal && (
        <CameraModal
          action={modal}
          onClose={() => setModal(null)}
          initialPhoto={modal === "checkin" ? checkinPhoto : checkoutPhoto}
          onConfirm={async ({ time, photo }) => {
            const currentAction = modal;
            const updateTime = currentAction === "checkin" ? setCheckinTime : setCheckoutTime;
            const updatePhoto = currentAction === "checkin" ? setCheckinPhoto : setCheckoutPhoto;
            const previousTime = currentAction === "checkin" ? checkinTime : checkoutTime;
            const previousPhoto = currentAction === "checkin" ? checkinPhoto : checkoutPhoto;
            updateTime(time);
            updatePhoto(photo);
            setSavingAction(currentAction);

            try {
              const uploadedPhotoUrl = await uploadAttendancePhoto(photo, currentAction);
              if (currentAction === "checkin") {
                setCheckinPhoto(uploadedPhotoUrl);
                await persistAttendance({
                  checkin: time,
                  lastLogin: new Date().toISOString(),
                  loginPhoto: uploadedPhotoUrl,
                  status: "present",
                });
              } else {
                setCheckoutPhoto(uploadedPhotoUrl);
                await persistAttendance({
                  checkout: time,
                  lastCheckout: new Date().toISOString(),
                  checkoutPhoto: uploadedPhotoUrl,
                });
              }
              showToast(currentAction === "checkin" ? "📍" : "👋", `${currentAction === "checkin" ? "Check-in" : "Check-out"} recorded at ${time}`);
            } catch (error) {
              updateTime(previousTime);
              updatePhoto(previousPhoto);
              showToast("⚠️", error.message || "Unable to save attendance");
            } finally {
              setSavingAction("");
            }
          }}
        />
      )}
      {savingAction && <div style={styles.savingBanner}>Uploading {savingAction} photo...</div>}
    </div>
  );
}

function LeaveCard({ defaultOpen, showToast, teacher, onTeacherUpdate }) {
  const [open, setOpen] = useState(defaultOpen || false);
  const [form, setForm] = useState({
    type: "Sick Leave",
    halfDay: "Full Day",
    fromDate: "",
    toDate: "",
    reason: "",
  });

  useEffect(() => {
    if (defaultOpen) setOpen(true);
  }, [defaultOpen]);

  function formatLeaveDates(fromDate, toDate) {
    if (!fromDate) return "Date not set";
    const fromLabel = new Date(`${fromDate}T00:00:00`).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
    if (!toDate || toDate === fromDate) return fromLabel;
    const toLabel = new Date(`${toDate}T00:00:00`).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
    return `${fromLabel} – ${toLabel}`;
  }

  const leaves = normaliseLeaveRequests(teacher?.leaveRequests).map((request) => ({
    type: request.type,
    dates: request.dates,
    status: request.status === "approved" ? "Approved" : request.status === "rejected" ? "Rejected" : "Pending",
    color: request.status === "approved" ? "#059669" : request.status === "rejected" ? "#dc2626" : "#d97706",
    bg: request.status === "approved" ? "rgba(5,150,105,.1)" : request.status === "rejected" ? "rgba(220,38,38,.1)" : "rgba(217,119,6,.1)",
  }));

  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <div style={styles.cardTitle}>Leave Application</div>
        <span style={{ fontSize: 13, color: "#4f46e5", cursor: "pointer", textDecoration: "underline" }} onClick={() => setOpen((value) => !value)}>+ Apply Now</span>
      </div>
      <div style={styles.cardBody}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #e4e2f0" }}>
              {["Type", "Date(s)", "Status"].map((heading) => (
                <th key={heading} style={{ padding: "8px 0", textAlign: "left", color: "#6b6b8a", fontWeight: 500, fontSize: 11, textTransform: "uppercase", letterSpacing: ".05em" }}>{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {leaves.map((leave, index) => (
              <tr key={`${leave.type}-${index}`} style={{ borderBottom: index < leaves.length - 1 ? "1px solid #e4e2f0" : "none" }}>
                <td style={{ padding: "10px 0" }}>{leave.type}</td>
                <td style={{ padding: "10px 0", color: "#6b6b8a" }}>{leave.dates}</td>
                <td><span style={{ background: leave.bg, color: leave.color, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 500 }}>{leave.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>

        {open && (
          <div>
            <div style={{ height: 1, background: "#e4e2f0", margin: "16px 0" }}></div>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>New Leave Request</div>
            <div style={styles.formRow}>
              <div style={styles.fgl}>
                <label style={styles.fglLabel}>Leave Type</label>
                <select style={styles.fglInput} value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}>
                  <option>Sick Leave</option>
                  <option>Casual Leave</option>
                  <option>Personal Leave</option>
                  <option>Maternity / Paternity</option>
                  <option>Emergency Leave</option>
                </select>
              </div>
              <div style={styles.fgl}>
                <label style={styles.fglLabel}>Half Day?</label>
                <select style={styles.fglInput} value={form.halfDay} onChange={(event) => setForm((current) => ({ ...current, halfDay: event.target.value }))}>
                  <option>Full Day</option>
                  <option>First Half</option>
                  <option>Second Half</option>
                </select>
              </div>
            </div>
            <div style={styles.formRow}>
              <div style={styles.fgl}><label style={styles.fglLabel}>From Date</label><input type="date" style={styles.fglInput} value={form.fromDate} onChange={(event) => setForm((current) => ({ ...current, fromDate: event.target.value }))} /></div>
              <div style={styles.fgl}><label style={styles.fglLabel}>To Date</label><input type="date" style={styles.fglInput} value={form.toDate} onChange={(event) => setForm((current) => ({ ...current, toDate: event.target.value }))} /></div>
            </div>
            <div style={{ ...styles.fgl, marginBottom: 14 }}>
              <label style={styles.fglLabel}>Reason</label>
              <textarea style={{ ...styles.fglInput, resize: "vertical", minHeight: 70 }} placeholder="Briefly describe the reason..." value={form.reason} onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))} />
            </div>
            <button
              style={styles.submitBtn}
              onClick={async () => {
                if (!form.fromDate || !form.reason.trim()) {
                  showToast("⚠️", "Add dates and a reason before submitting");
                  return;
                }

                const nextRequest = {
                  id: `leave-request-${Date.now()}`,
                  type: `${form.type}${form.halfDay !== "Full Day" ? ` (${form.halfDay})` : ""}`,
                  dates: formatLeaveDates(form.fromDate, form.toDate || form.fromDate),
                  status: "pending",
                  reason: form.reason.trim(),
                  createdAtLabel: "Just now",
                };

                const response = await fetch(apiUrl(`/api/auth/teachers/${teacher?.id || teacher?._id}`), {
                  method: "PUT",
                  headers: authHeaders({ "Content-Type": "application/json" }),
                  body: JSON.stringify({ leaveRequests: [nextRequest, ...normaliseLeaveRequests(teacher?.leaveRequests)] }),
                });
                const data = await response.json().catch(() => ({}));
                if (!response.ok) {
                  showToast("⚠️", data.message || "Unable to submit leave request");
                  return;
                }

                onTeacherUpdate?.(data);
                setForm({ type: "Sick Leave", halfDay: "Full Day", fromDate: "", toDate: "", reason: "" });
                setOpen(false);
                showToast("📝", "Leave request submitted successfully");
              }}
            >
              Submit Leave Request
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Calendar({ teacher }) {
  const now = new Date();
  const [cY, setCY] = useState(now.getFullYear());
  const [cM, setCM] = useState(now.getMonth());
  const [dayDetail, setDayDetail] = useState(null);
  const attendanceMap = buildAttendanceMap(teacher);

  const prevMonth = () => {
    if (cM === 0) {
      setCM(11);
      setCY((year) => year - 1);
    } else {
      setCM((month) => month - 1);
    }
  };
  const nextMonth = () => {
    if (cM === 11) {
      setCM(0);
      setCY((year) => year + 1);
    } else {
      setCM((month) => month + 1);
    }
  };

  const fd = new Date(cY, cM, 1).getDay();
  const dim = new Date(cY, cM + 1, 0).getDate();
  const pd = new Date(cY, cM, 0).getDate();
  const cells = [];

  for (let index = fd - 1; index >= 0; index -= 1) cells.push({ day: pd - index, type: "other" });
  for (let day = 1; day <= dim; day += 1) {
    const key = `${cY}-${cM + 1}-${day}`;
    const data = attendanceMap[key];
    const today = day === now.getDate() && cM === now.getMonth() && cY === now.getFullYear();
    cells.push({ day, type: "current", data, today });
  }
  const remainder = (7 - (cells.length % 7)) % 7;
  for (let index = 1; index <= remainder; index += 1) cells.push({ day: index, type: "other" });

  return (
    <div style={{ ...styles.card, position: "sticky", top: 20 }}>
      <div style={styles.cardHeader}>
        <div style={styles.cardTitle}>Monthly Calendar</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {[["#059669", "Present"], ["#dc2626", "Absent"], ["#d97706", "Leave"]].map(([color, label]) => (
            <span key={label} style={{ fontSize: 11, color }}>● {label}</span>
          ))}
        </div>
      </div>
      <div style={styles.cardBody}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>{MONTHS[cM]} {cY}</span>
          <div style={{ display: "flex", gap: 4 }}>
            <button style={styles.calNav} onClick={prevMonth}>‹</button>
            <button style={styles.calNav} onClick={nextMonth}>›</button>
          </div>
        </div>
        <div style={styles.calGrid}>
          {DS.map((day) => <div key={day} style={styles.calDayLabel}>{day}</div>)}
          {cells.map((cell, index) => {
            let bg = "transparent";
            let color = cell.type === "other" ? "rgba(0,0,0,.2)" : "#1a1a2e";
            let fontWeight = "normal";
            if (cell.today) {
              bg = "#4f46e5";
              color = "#fff";
              fontWeight = "600";
            } else if (cell.data) {
              color = cell.data.s === "present" ? "#059669" : cell.data.s === "absent" ? "#dc2626" : "#d97706";
              fontWeight = "500";
            }

            const dotColor = cell.data ? (cell.data.s === "present" ? "#059669" : cell.data.s === "absent" ? "#dc2626" : "#d97706") : null;
            return (
              <div key={`${cell.type}-${cell.day}-${index}`} style={{ ...styles.calCell, background: bg, color, fontWeight }} onClick={() => cell.type === "current" && setDayDetail({ day: cell.day, data: cell.data, today: cell.today })}>
                <span>{cell.day}</span>
                {dotColor && !cell.today && <div style={{ width: 4, height: 4, borderRadius: "50%", background: dotColor }}></div>}
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ borderTop: "1px solid #e4e2f0", padding: "16px 22px" }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#6b6b8a", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 10 }}>Selected Day</div>
        {!dayDetail ? (
          <div style={{ fontSize: 13, color: "#6b6b8a" }}>Click a day to see details</div>
        ) : (
          <div style={{ fontSize: 13 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>{MONTHS[cM]} {dayDetail.day}, {cY}</div>
            {dayDetail.today && !dayDetail.data ? (
              <span style={{ color: "#6b6b8a" }}>Attendance in progress</span>
            ) : dayDetail.data ? (
              <>
                <div style={{ color: dayDetail.data.s === "present" ? "#059669" : dayDetail.data.s === "absent" ? "#dc2626" : "#d97706", fontWeight: 500, marginBottom: 6 }}>
                  {dayDetail.data.s === "present" ? "✅ Present" : dayDetail.data.s === "absent" ? "❌ Absent" : "🟡 On Leave"}
                </div>
                <div style={{ fontSize: 12, color: "#6b6b8a" }}>Check-in: <b style={{ color: "#1a1a2e" }}>{dayDetail.data.i}</b></div>
                <div style={{ fontSize: 12, color: "#6b6b8a" }}>Check-out: <b style={{ color: "#1a1a2e" }}>{dayDetail.data.o}</b></div>
              </>
            ) : (
              <span style={{ color: "#6b6b8a" }}>No record</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Dashboard({ teacher, announcements, showToast, openLeave, onTeacherUpdate, onOpenAnnouncements }) {
  return (
    <div>
      <div style={styles.topbar}>
        <div>
          <div style={styles.pageTitle}>Dashboard</div>
          <div style={styles.pageSub}>Your attendance overview for today</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={styles.dateChip}>{fmtDate(new Date())}</div>
          <button style={styles.notifBtn} onClick={onOpenAnnouncements}>🔔<div style={styles.notifDot}></div></button>
        </div>
      </div>
      <StatsRow teacher={teacher} />
      <div style={styles.grid2}>
        <div style={styles.gridLeft}>
          <AttendanceCard teacher={teacher} showToast={showToast} onTeacherUpdate={onTeacherUpdate} />
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={styles.cardTitle}>Announcements</div>
              <button style={styles.linkButton} onClick={onOpenAnnouncements}>View all</button>
            </div>
            <AnnouncementList items={announcements.slice(0, 3)} />
          </div>
          <LeaveCard defaultOpen={openLeave} showToast={showToast} teacher={teacher} onTeacherUpdate={onTeacherUpdate} />
        </div>
        <Calendar teacher={teacher} />
      </div>
    </div>
  );
}

function TimetableSection({ teacher }) {
  const [selectedMonth, setSelectedMonth] = useState(currentMonthValue());
  const schedules = normaliseMonthlyTimetable(teacher?.timetable);
  const selectedSchedule = schedules.find((entry) => entry.month === selectedMonth) || schedules[0];

  return (
    <div>
      <div style={styles.topbar}>
        <div>
          <div style={styles.pageTitle}>Timetable</div>
          <div style={styles.pageSub}>Monthly timetable with 3 periods</div>
        </div>
        <input type="month" value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)} style={styles.monthInput} />
      </div>
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div style={styles.cardTitle}>Assigned Periods</div>
        </div>
        <div style={styles.cardBody}>
          {selectedSchedule ? (
            <>
              <div style={styles.timetableHint}>{new Date(`${selectedSchedule.month}-01T00:00:00`).toLocaleDateString([], { month: "long", year: "numeric" })}</div>
              <div style={styles.periodDisplayGrid}>
                {selectedSchedule.periods.map((period) => (
                  <div key={period.label} style={styles.periodDisplayCard}>
                    <div style={styles.periodDisplayLabel}>{period.label}</div>
                    <div style={styles.periodDisplaySubject}>{period.subject || "Subject not set"}</div>
                    <div style={styles.periodDisplayMeta}>{period.timeSlot || "Time not set"}</div>
                    <div style={styles.periodDisplayMeta}>{period.room || "Room not set"}</div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={styles.timetableEmpty}>No timetable slots were assigned for this month yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function AttendanceSection({ teacher }) {
  const records = normaliseAttendanceRecords(teacher?.attendanceRecords);
  return (
    <div>
      <div style={styles.topbar}>
        <div>
          <div style={styles.pageTitle}>Attendance</div>
          <div style={styles.pageSub}>Daily attendance history</div>
        </div>
      </div>
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div style={styles.cardTitle}>Attendance Log</div>
        </div>
        <div style={styles.cardBody}>
          {records.length > 0 ? (
            <div style={styles.recordList}>
              {records.map((record) => (
                <div key={record.date} style={styles.recordRow}>
                  <div>
                    <div style={styles.recordTitle}>{new Date(`${record.date}T00:00:00`).toLocaleDateString([], { weekday: "long", day: "numeric", month: "short" })}</div>
                    <div style={styles.recordMeta}>Check-in {record.checkin} · Check-out {record.checkout}</div>
                  </div>
                  <span style={{ ...styles.recordBadge, ...(record.status === "present" ? styles.locBadgeOk : record.status === "leave" ? styles.recordBadgeLeave : styles.locBadgeMiss) }}>
                    {record.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={styles.timetableEmpty}>No attendance records available yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function StudentsSection({ teacher }) {
  const students = generateStudents(teacher);
  return (
    <div>
      <div style={styles.topbar}>
        <div>
          <div style={styles.pageTitle}>My Students</div>
          <div style={styles.pageSub}>{teacher?.class || "Assigned class"} roster overview</div>
        </div>
      </div>
      <div style={styles.studentGrid}>
        {students.map((student) => (
          <div key={student.id} style={styles.studentCard}>
            <div style={styles.studentHeader}>
              <div>
                <div style={styles.studentName}>{student.name}</div>
                <div style={styles.studentMeta}>Roll No. {student.rollNo}</div>
              </div>
              <div style={styles.studentBadge}>{student.attendance}</div>
            </div>
            <div style={styles.studentMeta}>Subject: {teacher?.subject || "General"}</div>
            <div style={styles.studentStatus}>{student.status}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnnouncementsSection({ announcements }) {
  return (
    <div>
      <div style={styles.topbar}>
        <div>
          <div style={styles.pageTitle}>Announcements</div>
          <div style={styles.pageSub}>All notices from school management</div>
        </div>
      </div>
      <div style={styles.card}>
        <AnnouncementList items={announcements} />
      </div>
    </div>
  );
}

function SettingsSection({ teacher, showToast, onTeacherUpdate }) {
  const [name, setName] = useState(teacher?.name || "");
  const [preferences, setPreferences] = useState({
    emailNotifications: teacher?.preferences?.emailNotifications ?? true,
    announcementAlerts: teacher?.preferences?.announcementAlerts ?? true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(teacher?.name || "");
    setPreferences({
      emailNotifications: teacher?.preferences?.emailNotifications ?? true,
      announcementAlerts: teacher?.preferences?.announcementAlerts ?? true,
    });
  }, [teacher]);

  return (
    <div>
      <div style={styles.topbar}>
        <div>
          <div style={styles.pageTitle}>Settings</div>
          <div style={styles.pageSub}>Account & notification preferences</div>
        </div>
      </div>
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div style={styles.cardTitle}>Profile Settings</div>
        </div>
        <div style={styles.cardBody}>
          <div style={styles.settingsGrid}>
            <div style={styles.fgl}>
              <label style={styles.fglLabel}>Full Name</label>
              <input style={styles.fglInput} value={name} onChange={(event) => setName(event.target.value)} />
            </div>
            <div style={styles.fgl}>
              <label style={styles.fglLabel}>Email</label>
              <input style={{ ...styles.fglInput, opacity: 0.75 }} value={teacher?.email || ""} readOnly />
            </div>
            <div style={styles.fgl}>
              <label style={styles.fglLabel}>Subject</label>
              <input style={{ ...styles.fglInput, opacity: 0.75 }} value={teacher?.subject || ""} readOnly />
            </div>
            <div style={styles.fgl}>
              <label style={styles.fglLabel}>Class</label>
              <input style={{ ...styles.fglInput, opacity: 0.75 }} value={teacher?.class || ""} readOnly />
            </div>
          </div>

          <div style={styles.preferenceList}>
            <button style={styles.toggleRow} onClick={() => setPreferences((current) => ({ ...current, emailNotifications: !current.emailNotifications }))}>
              <span>Email notifications</span>
              <span style={preferences.emailNotifications ? styles.toggleOn : styles.toggleOff}>{preferences.emailNotifications ? "On" : "Off"}</span>
            </button>
            <button style={styles.toggleRow} onClick={() => setPreferences((current) => ({ ...current, announcementAlerts: !current.announcementAlerts }))}>
              <span>Announcement alerts</span>
              <span style={preferences.announcementAlerts ? styles.toggleOn : styles.toggleOff}>{preferences.announcementAlerts ? "On" : "Off"}</span>
            </button>
          </div>

          <button
            style={{ ...styles.submitBtn, marginTop: 16 }}
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              const response = await fetch(apiUrl(`/api/auth/teachers/${teacher?.id || teacher?._id}`), {
                method: "PUT",
                headers: authHeaders({ "Content-Type": "application/json" }),
                body: JSON.stringify({ name: name.trim(), preferences }),
              });
              const data = await response.json().catch(() => ({}));
              setSaving(false);
              if (!response.ok) {
                showToast("⚠️", data.message || "Unable to save settings");
                return;
              }
              onTeacherUpdate?.(data);
              showToast("✅", "Settings updated");
            }}
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Toast({ toast }) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 28,
        right: 28,
        background: "#1a1a2e",
        color: "#fff",
        borderRadius: 12,
        padding: "12px 20px",
        fontSize: 13,
        fontWeight: 500,
        display: "flex",
        alignItems: "center",
        gap: 10,
        zIndex: 9999,
        transition: "all .3s",
        pointerEvents: "none",
        opacity: toast ? 1 : 0,
        transform: toast ? "translateY(0)" : "translateY(10px)",
      }}
    >
      {toast && <><span>{toast.icon}</span><span>{toast.msg}</span></>}
    </div>
  );
}

export default function TeacherDashboard({ teacher, onLogout }) {
  const [teacherState, setTeacherState] = useState(teacher);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [toast, setToast] = useState(null);
  const [openLeave, setOpenLeave] = useState(false);
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    setTeacherState(teacher);
  }, [teacher]);

  useEffect(() => {
    let cancelled = false;

    async function loadAnnouncements() {
      const response = await fetch(apiUrl("/api/auth/announcements"), {
        headers: authHeaders(),
      });
      const data = await response.json().catch(() => []);
      if (!response.ok || cancelled) return;
      setAnnouncements(Array.isArray(data) ? data : []);
    }

    loadAnnouncements();
    return () => {
      cancelled = true;
    };
  }, []);

  function syncTeacherState(nextTeacher) {
    setTeacherState(nextTeacher);
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return;
    try {
      const parsedUser = JSON.parse(storedUser);
      localStorage.setItem("user", JSON.stringify({ ...parsedUser, ...nextTeacher }));
    } catch {
      localStorage.setItem("user", JSON.stringify(nextTeacher));
    }
  }

  function showToast(icon, msg) {
    setToast({ icon, msg });
    setTimeout(() => setToast(null), 3200);
  }

  function handleApplyLeave() {
    setActiveSection("leave");
    setOpenLeave(true);
  }

  return (
    <div style={styles.shell}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Fraunces:wght@600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; }
        button { font-family: 'DM Sans', sans-serif; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        input[type="date"], input[type="month"], select, textarea, input[type="file"] { font-family: 'DM Sans', sans-serif; }
      `}</style>
      <Sidebar activeSection={activeSection} onNav={setActiveSection} onApplyLeave={handleApplyLeave} teacher={teacherState} onLogout={onLogout} />
      <main style={styles.main}>
        {activeSection === "dashboard" && (
          <Dashboard
            teacher={teacherState}
            announcements={announcements}
            showToast={showToast}
            openLeave={openLeave}
            onTeacherUpdate={syncTeacherState}
            onOpenAnnouncements={() => setActiveSection("announcements")}
          />
        )}
        {activeSection === "students" && <StudentsSection teacher={teacherState} />}
        {activeSection === "attendance" && <AttendanceSection teacher={teacherState} />}
        {activeSection === "timetable" && <TimetableSection teacher={teacherState} />}
        {activeSection === "leave" && <LeaveCard defaultOpen showToast={showToast} teacher={teacherState} onTeacherUpdate={syncTeacherState} />}
        {activeSection === "announcements" && <AnnouncementsSection announcements={announcements} />}
        {activeSection === "settings" && <SettingsSection teacher={teacherState} showToast={showToast} onTeacherUpdate={syncTeacherState} />}
      </main>
      <Toast toast={toast} />
    </div>
  );
}

const styles = {
  shell: { display: "flex", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", background: "#f0eff8", color: "#1a1a2e", fontSize: 14 },
  sidebar: { width: 240, flexShrink: 0, background: "#1a1a2e", display: "flex", flexDirection: "column", position: "fixed", left: 0, top: 0, bottom: 0, zIndex: 100 },
  logoArea: { padding: "24px 24px 16px", borderBottom: "1px solid rgba(255,255,255,.08)" },
  portalLabel: { fontSize: 11, color: "rgba(255,255,255,.35)", letterSpacing: ".1em", textTransform: "uppercase" },
  teacherPill: { margin: "16px 14px", background: "rgba(255,255,255,.07)", borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 },
  avatar: { width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #4f46e5, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, color: "#fff", flexShrink: 0 },
  teacherName: { fontSize: 13, fontWeight: 500, color: "#fff" },
  teacherRole: { fontSize: 11, color: "rgba(255,255,255,.4)" },
  nav: { flex: 1, padding: "8px 12px", overflowY: "auto" },
  navLbl: { fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(255,255,255,.3)", padding: "16px 12px 8px" },
  navItem: { display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, color: "rgba(255,255,255,.55)", fontSize: 13, cursor: "pointer", marginBottom: 2, border: "none", background: "none", width: "100%", textAlign: "left" },
  navItemActive: { background: "rgba(79,70,229,.3)", color: "#fff", fontWeight: 500 },
  navIcon: { fontSize: 16, width: 20, textAlign: "center" },
  sidebarFooter: { padding: 14, borderTop: "1px solid rgba(255,255,255,.08)" },
  statusBadge: { display: "flex", alignItems: "center", gap: 8, background: "rgba(5,150,105,.15)", borderRadius: 8, padding: "8px 12px" },
  statusDot: { width: 8, height: 8, borderRadius: "50%", background: "#059669", animation: "pulse 2s infinite" },
  statusText: { fontSize: 12, color: "rgba(255,255,255,.7)" },
  main: { marginLeft: 240, flex: 1, padding: 28 },
  topbar: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 },
  pageTitle: { fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 600, color: "#1a1a2e" },
  pageSub: { fontSize: 13, color: "#6b6b8a", marginTop: 2 },
  dateChip: { background: "#fff", border: "1px solid #e4e2f0", borderRadius: 10, padding: "8px 14px", fontSize: 13, color: "#6b6b8a" },
  notifBtn: { width: 38, height: 38, borderRadius: 10, background: "#fff", border: "1px solid #e4e2f0", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 16, position: "relative" },
  notifDot: { position: "absolute", top: 7, right: 7, width: 7, height: 7, borderRadius: "50%", background: "#dc2626", border: "1.5px solid #fff" },
  monthInput: { background: "#fff", border: "1px solid #e4e2f0", borderRadius: 10, padding: "8px 12px", fontSize: 13, color: "#6b6b8a" },
  statsRow: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 },
  statCard: { background: "#fff", borderRadius: 16, border: "1px solid #e4e2f0", padding: "18px 20px" },
  statLabel: { fontSize: 12, color: "#6b6b8a", marginBottom: 8, textTransform: "uppercase", letterSpacing: ".05em" },
  statValue: { fontFamily: "'Fraunces', serif", fontSize: 32, fontWeight: 700, lineHeight: 1 },
  statSub: { fontSize: 11, color: "#6b6b8a", marginTop: 6 },
  grid2: { display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, marginBottom: 20 },
  gridLeft: { display: "flex", flexDirection: "column", gap: 20 },
  card: { background: "#fff", borderRadius: 16, border: "1px solid #e4e2f0", overflow: "hidden" },
  cardHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px 14px", borderBottom: "1px solid #e4e2f0" },
  cardTitle: { fontSize: 14, fontWeight: 600, color: "#1a1a2e" },
  cardBody: { padding: "20px 22px" },
  checkinRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 },
  checkinBox: { border: "1.5px dashed #e4e2f0", borderRadius: 10, padding: 16, textAlign: "center", cursor: "pointer" },
  checkinBoxDone: { borderStyle: "solid", borderColor: "#059669", background: "rgba(5,150,105,.04)" },
  dutyBtn: { width: "100%", padding: 14, borderRadius: 10, border: "none", fontSize: 15, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 },
  dutyBtnOff: { background: "#4f46e5", color: "#fff" },
  dutyBtnOn: { background: "rgba(5,150,105,.12)", color: "#059669", border: "1.5px solid #059669" },
  dutyBadge: { display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(5,150,105,.12)", color: "#059669", borderRadius: 20, padding: "4px 10px", fontSize: 12, fontWeight: 500 },
  savingBanner: { margin: "0 22px 20px", padding: "10px 12px", borderRadius: 10, background: "rgba(79,70,229,.08)", color: "#4338ca", fontSize: 12, fontWeight: 600, textAlign: "center" },
  locationRow: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #e4e2f0" },
  locTime: { fontSize: 12, color: "#6b6b8a", width: 60, flexShrink: 0 },
  locBadge: { fontSize: 12, padding: "3px 10px", borderRadius: 20, fontWeight: 500 },
  locBadgeOk: { background: "rgba(5,150,105,.1)", color: "#059669" },
  locBadgeMiss: { background: "rgba(220,38,38,.1)", color: "#dc2626" },
  locCoords: { fontSize: 12, color: "#6b6b8a", fontFamily: "monospace" },
  locPhoto: { width: 28, height: 28, borderRadius: 6, background: "#f0eff8", border: "1px solid #e4e2f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 },
  nextPing: { display: "inline-flex", alignItems: "center", background: "rgba(37,99,235,.06)", borderRadius: 10, padding: "4px 10px", border: "1px solid rgba(37,99,235,.15)" },
  pingLabel: { fontSize: 12, color: "#2563eb", fontWeight: 500 },
  pingTimer: { fontSize: 13, fontWeight: 600, color: "#2563eb", fontVariantNumeric: "tabular-nums" },
  annItem: { display: "flex", gap: 12, padding: "14px 22px", borderBottom: "1px solid #e4e2f0" },
  annIcon: { width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 },
  annIconInfo: { background: "rgba(37,99,235,.1)" },
  annIconWarn: { background: "rgba(217,119,6,.1)" },
  annIconAlert: { background: "rgba(220,38,38,.1)" },
  annTitle: { fontSize: 13, fontWeight: 500, color: "#1a1a2e" },
  annBody: { fontSize: 12, color: "#6b6b8a", marginTop: 3, lineHeight: 1.5 },
  annTime: { fontSize: 11, color: "#6b6b8a", marginTop: 4 },
  annBadge: { fontSize: 10, padding: "2px 8px", borderRadius: 20, fontWeight: 500, marginLeft: 8, background: "rgba(79,70,229,.12)", color: "#4f46e5" },
  formRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 },
  fgl: { display: "flex", flexDirection: "column", gap: 6 },
  fglLabel: { fontSize: 12, fontWeight: 500, color: "#6b6b8a", textTransform: "uppercase", letterSpacing: ".04em" },
  fglInput: { border: "1px solid #e4e2f0", borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "#1a1a2e", background: "#f0eff8", outline: "none", width: "100%" },
  submitBtn: { background: "#4f46e5", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 13, fontWeight: 500, cursor: "pointer", width: "100%" },
  calGrid: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 },
  calDayLabel: { fontSize: 10, color: "#6b6b8a", textAlign: "center", fontWeight: 500, letterSpacing: ".05em", padding: "4px 0", textTransform: "uppercase" },
  calCell: { aspectRatio: "1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, borderRadius: 8, cursor: "pointer", flexDirection: "column", gap: 1 },
  calNav: { width: 28, height: 28, border: "1px solid #e4e2f0", background: "none", borderRadius: 6, cursor: "pointer", fontSize: 13, color: "#6b6b8a" },
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 },
  modal: { background: "#fff", borderRadius: 16, padding: 28, width: 360, maxWidth: "94vw", position: "relative" },
  modalTitle: { fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 600, marginBottom: 8 },
  modalSub: { fontSize: 13, color: "#6b6b8a", marginBottom: 20 },
  cameraPreview: { width: "100%", height: 200, background: "#111", borderRadius: 10, marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48 },
  cameraImage: { width: "100%", height: "100%", objectFit: "cover", borderRadius: 10 },
  cameraPlaceholder: { width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 48 },
  cameraError: { fontSize: 12, color: "#dc2626", textAlign: "center", marginTop: -6, marginBottom: 12 },
  cameraHint: { fontSize: 12, color: "#6b6b8a", textAlign: "center", marginBottom: 16 },
  modalBtns: { display: "flex", gap: 10 },
  modalBtn: { flex: 1, padding: 11, borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: "pointer", border: "1px solid #e4e2f0", background: "#f0eff8", color: "#1a1a2e" },
  modalBtnPrimary: { background: "#4f46e5", color: "#fff", borderColor: "#4f46e5" },
  modalClose: { position: "absolute", top: 16, right: 16, background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#6b6b8a" },
  timetableHint: { marginBottom: 14, borderRadius: 10, padding: "10px 12px", background: "#eef2ff", color: "#4338ca", fontSize: 12, fontWeight: 600 },
  timetableEmpty: { border: "1px dashed #d8d4eb", borderRadius: 12, padding: "18px", background: "#f7f6fd", color: "#6b6b8a", fontSize: 13 },
  periodDisplayGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 },
  periodDisplayCard: { border: "1px solid #e4e2f0", borderRadius: 12, padding: "16px 14px", background: "#fff" },
  periodDisplayLabel: { fontSize: 12, fontWeight: 700, color: "#4f46e5", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 10 },
  periodDisplaySubject: { fontSize: 15, fontWeight: 600, color: "#1a1a2e", marginBottom: 6 },
  periodDisplayMeta: { fontSize: 12, color: "#6b6b8a", marginBottom: 4 },
  studentGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 },
  studentCard: { background: "#fff", border: "1px solid #e4e2f0", borderRadius: 16, padding: 18 },
  studentHeader: { display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 10 },
  studentName: { fontSize: 15, fontWeight: 600, color: "#1a1a2e" },
  studentMeta: { fontSize: 12, color: "#6b6b8a" },
  studentBadge: { background: "#eef2ff", color: "#4338ca", padding: "5px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600, height: "fit-content" },
  studentStatus: { marginTop: 12, fontSize: 12, color: "#059669", fontWeight: 600 },
  recordList: { display: "flex", flexDirection: "column", gap: 12 },
  recordRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, border: "1px solid #e4e2f0", borderRadius: 12, padding: "14px 16px" },
  recordTitle: { fontSize: 13, fontWeight: 700, color: "#1a1a2e" },
  recordMeta: { marginTop: 4, fontSize: 12, color: "#6b6b8a" },
  recordBadge: { fontSize: 12, padding: "4px 10px", borderRadius: 999, textTransform: "capitalize", fontWeight: 600 },
  recordBadgeLeave: { background: "rgba(217,119,6,.1)", color: "#d97706" },
  settingsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  preferenceList: { display: "flex", flexDirection: "column", gap: 10, marginTop: 20 },
  toggleRow: { border: "1px solid #e4e2f0", background: "#fff", borderRadius: 10, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", fontSize: 13, color: "#1a1a2e" },
  toggleOn: { background: "rgba(5,150,105,.1)", color: "#059669", borderRadius: 999, padding: "4px 10px", fontSize: 12, fontWeight: 600 },
  toggleOff: { background: "rgba(220,38,38,.1)", color: "#dc2626", borderRadius: 999, padding: "4px 10px", fontSize: 12, fontWeight: 600 },
  linkButton: { fontSize: 12, color: "#4f46e5", cursor: "pointer", background: "none", border: "none" },
};
