import { useState, useEffect, useRef } from "react";
import { apiUrl } from "./api";

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const attn = {
  '2025-3-3':{s:'present',i:'8:45 AM',o:'4:00 PM'},'2025-3-4':{s:'present',i:'8:50 AM',o:'4:05 PM'},
  '2025-3-5':{s:'leave',i:'–',o:'–'},'2025-3-6':{s:'present',i:'8:42 AM',o:'4:10 PM'},
  '2025-3-7':{s:'present',i:'8:55 AM',o:'4:00 PM'},'2025-3-10':{s:'present',i:'8:40 AM',o:'4:00 PM'},
  '2025-3-11':{s:'absent',i:'–',o:'–'},'2025-3-12':{s:'leave',i:'–',o:'–'},
  '2025-3-13':{s:'leave',i:'–',o:'–'},'2025-3-14':{s:'present',i:'8:52 AM',o:'4:00 PM'},
  '2025-3-17':{s:'present',i:'8:48 AM',o:'4:00 PM'},'2025-3-18':{s:'present',i:'8:44 AM',o:'4:00 PM'},
  '2025-3-19':{s:'present',i:'8:50 AM',o:'4:00 PM'},'2025-3-20':{s:'absent',i:'–',o:'–'},
  '2025-3-21':{s:'present',i:'8:47 AM',o:'–'}
};

function padZ(n) { return String(n).padStart(2, '0'); }
function fmtTime(d) {
  let h = d.getHours(), m = d.getMinutes(), ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return h + ':' + padZ(m) + ' ' + ap;
}
function fmtDate(d) {
  const dy = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const mo = MONTHS;
  return dy[d.getDay()] + ', ' + d.getDate() + ' ' + mo[d.getMonth()] + ' ' + d.getFullYear();
}

function normaliseTimetable(timetable) {
  return Array.isArray(timetable)
    ? timetable.map((entry) => ({
        date: entry?.date || '',
        day: entry?.day || '',
        timeSlot: entry?.timeSlot || entry?.period || '',
        period: entry?.period || entry?.timeSlot || '',
        subject: entry?.subject || '',
        room: entry?.room || '',
      }))
    : [];
}

function normaliseLeaveRequests(leaveRequests) {
  return Array.isArray(leaveRequests) ? leaveRequests : [];
}

function dataUrlToFile(dataUrl, filename) {
  const [meta, content] = dataUrl.split(',');
  const mimeMatch = meta?.match(/data:(.*?);base64/);
  const mimeType = mimeMatch?.[1] || 'image/jpeg';
  const binary = atob(content || '');
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new File([bytes], filename, { type: mimeType });
}

async function uploadAttendancePhoto(photo, action) {
  if (!photo) return '';

  if (!photo.startsWith('data:')) {
    return photo;
  }

  const formData = new FormData();
  formData.append('photo', dataUrlToFile(photo, `${action}-${Date.now()}.jpg`));

  const response = await fetch(apiUrl('/api/auth/teachers/upload'), {
    method: 'POST',
    body: formData,
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Unable to upload photo.');
  }

  return data.photoUrl || '';
}

// ─── SIDEBAR ───────────────────────────────────────────────
function Sidebar({ activeSection, onNav, onApplyLeave, teacher, onLogout }) {
  const navItems = [
    { id: 'dashboard', icon: '🏠', label: 'Dashboard', group: 'main' },
    { id: 'attendance', icon: '📅', label: 'Attendance', group: 'main' },
    { id: 'timetable', icon: '📋', label: 'Timetable', group: 'main' },
    { id: 'students', icon: '👨‍🎓', label: 'My Students', group: 'main' },
    { id: 'leave', icon: '📝', label: 'Apply Leave', group: 'tools', special: true },
    { id: 'announcements', icon: '📢', label: 'Announcements', group: 'tools' },
    { id: 'settings', icon: '⚙️', label: 'Settings', group: 'tools' },
  ];
  const initials = teacher?.initials || 'T';
  const name     = teacher?.name     || 'Teacher';
  const role     = teacher ? `${teacher.subject} · Class ${teacher.class}` : '';
  return (
    <aside style={styles.sidebar}>
      <div style={styles.logoArea}><div style={styles.portalLabel}>Staff Portal</div></div>
      <div style={styles.teacherPill}>
        <div style={styles.avatar}>{initials}</div>
        <div>
          <div style={styles.teacherName}>{name}</div>
          <div style={styles.teacherRole}>{role}</div>
        </div>
      </div>
      <nav style={styles.nav}>
        <div style={styles.navLbl}>Main</div>
        {navItems.filter(n => n.group === 'main').map(n => (
          <button key={n.id} style={{...styles.navItem, ...(activeSection === n.id ? styles.navItemActive : {})}}
            onClick={() => onNav(n.id)}>
            <span style={styles.navIcon}>{n.icon}</span> {n.label}
          </button>
        ))}
        <div style={styles.navLbl}>Tools</div>
        {navItems.filter(n => n.group === 'tools').map(n => (
          <button key={n.id}
            style={{...styles.navItem, ...(activeSection === n.id ? styles.navItemActive : {})}}
            onClick={() => n.special ? onApplyLeave() : onNav(n.id)}>
            <span style={styles.navIcon}>{n.icon}</span> {n.label}
          </button>
        ))}
        <div style={styles.navLbl}>Account</div>
        <button style={{...styles.navItem, color:'rgba(220,80,80,.8)'}} onClick={onLogout}>
          <span style={styles.navIcon}>🚪</span> Logout
        </button>
      </nav>
      <div style={styles.sidebarFooter}>
        <div style={styles.statusBadge}>
          <div style={styles.statusDot}></div>
          <span style={styles.statusText}>On campus · Active</span>
        </div>
      </div>
    </aside>
  );
}

// ─── STATS ROW ─────────────────────────────────────────────
function StatsRow() {
  const stats = [
    { label: 'Present Days', value: 18, sub: 'Out of 22 working days', color: '#059669' },
    { label: 'Absent Days', value: 2, sub: 'This month', color: '#dc2626' },
    { label: 'Leave Taken', value: 2, sub: '3 leaves remaining', color: '#d97706' },
    { label: 'On-Time Rate', value: '91%', sub: 'avg. 8:47 AM arrival', color: '#2563eb' },
  ];
  return (
    <div style={styles.statsRow}>
      {stats.map((s, i) => (
        <div key={i} style={styles.statCard}>
          <div style={styles.statLabel}>{s.label}</div>
          <div style={{...styles.statValue, color: s.color}}>{s.value}</div>
          <div style={styles.statSub}>{s.sub}</div>
        </div>
      ))}
    </div>
  );
}

// ─── PING TIMER ────────────────────────────────────────────
function PingTimer() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const update = () => {
      const n = new Date();
      setTime((59 - n.getMinutes()) + 'm ' + (60 - n.getSeconds()) + 's');
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);
  return <span style={styles.pingTimer}>{time}</span>;
}

// ─── LOCATION PINGS ────────────────────────────────────────
function LocationPings() {
  const pings = [
    { time: '8:47 AM', status: 'ok', coords: '18.5204° N, 73.8567° E' },
    { time: '9:47 AM', status: 'ok', coords: '18.5204° N, 73.8567° E' },
    { time: '10:47 AM', status: 'ok', coords: '18.5204° N, 73.8567° E' },
    { time: '11:47 AM', status: 'miss', coords: '–', pending: true },
  ];
  return (
    <div style={{ marginTop: 18 }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
        📍 Hourly Location Pings
        <div style={styles.nextPing}>
          <span style={styles.pingLabel}>Next ping in&nbsp;</span>
          <PingTimer />
        </div>
      </div>
      {pings.map((p, i) => (
        <div key={i} style={{ ...styles.locationRow, opacity: p.pending ? 0.5 : 1 }}>
          <span style={styles.locTime}>{p.time}</span>
          <span style={{...styles.locBadge, ...(p.status === 'ok' ? styles.locBadgeOk : styles.locBadgeMiss)}}>
            {p.status === 'ok' ? '✓ Verified' : 'Pending'}
          </span>
          <span style={styles.locCoords}>{p.coords}</span>
          <div style={styles.locPhoto}>{p.pending ? '' : '📷'}</div>
        </div>
      ))}
    </div>
  );
}

// ─── CAMERA MODAL ──────────────────────────────────────────
function CameraModal({ action, onClose, onConfirm, initialPhoto }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const streamRef = useRef(null);
  const [photo, setPhoto] = useState(initialPhoto || "");
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [reading, setReading] = useState(false);
  const title = action === 'checkin' ? 'Check In Verification' : 'Check Out Verification';
  const sub = action === 'checkin'
    ? "Take a photo outside the Principal's office to verify your arrival."
    : 'Take a photo to confirm your departure.';

  useEffect(() => {
    let cancelled = false;

    async function startCamera() {
      if (photo || !navigator.mediaDevices?.getUserMedia) {
        if (!navigator.mediaDevices?.getUserMedia) {
          setCameraError("Camera access is not supported in this browser.");
        }
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });

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
      } catch (error) {
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
    reader.onerror = () => {
      setReading(false);
    };
    reader.readAsDataURL(file);
  }

  function handleCapturePhoto() {
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
    <div style={styles.modalOverlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={styles.modal}>
        <button style={styles.modalClose} onClick={onClose}>✕</button>
        <div style={styles.modalTitle}>{title}</div>
        <div style={styles.modalSub}>{sub}</div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        <div style={styles.cameraPreview}>
          {photo ? (
            <img src={photo} alt={`${action} capture`} style={styles.cameraImage} />
          ) : cameraReady ? (
            <video ref={videoRef} autoPlay playsInline muted style={styles.cameraImage} />
          ) : (
            <div style={styles.cameraPlaceholder}>{reading ? '⏳' : '📷'}</div>
          )}
        </div>
        {cameraError && <div style={styles.cameraError}>{cameraError}</div>}
        <div style={styles.cameraHint}>📍 Location captured automatically · <b>18.5204° N, 73.8567° E</b></div>
        <div style={styles.modalBtns}>
          <button style={styles.modalBtn} onClick={onClose}>Cancel</button>
          {!photo && (
            <button style={styles.modalBtn} onClick={() => fileInputRef.current?.click()}>
              Upload
            </button>
          )}
          <button style={{...styles.modalBtn, ...styles.modalBtnPrimary}} onClick={() => {
            if (!photo) {
              if (cameraReady) {
                handleCapturePhoto();
              } else {
                fileInputRef.current?.click();
              }
              return;
            }
            onConfirm({ time: fmtTime(new Date()), photo });
            onClose();
          }}>
            {photo ? '✅ Confirm' : '📸 Capture Photo'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── CHECK IN / OUT CARD ───────────────────────────────────
function AttendanceCard({ teacher, showToast, onTeacherUpdate }) {
  const teacherId = teacher?.id || teacher?._id;
  const [checkinTime, setCheckinTime] = useState(teacher?.checkin && teacher.checkin !== '–' ? teacher.checkin : null);
  const [checkoutTime, setCheckoutTime] = useState(teacher?.checkout && teacher.checkout !== '–' ? teacher.checkout : null);
  const [checkinPhoto, setCheckinPhoto] = useState(teacher?.loginPhoto || '');
  const [checkoutPhoto, setCheckoutPhoto] = useState(teacher?.checkoutPhoto || '');
  const [onDuty, setOnDuty] = useState(Boolean(teacher?.onDuty));
  const [modal, setModal] = useState(null);
  const [savingAction, setSavingAction] = useState('');

  useEffect(() => {
    setCheckinTime(teacher?.checkin && teacher.checkin !== '–' ? teacher.checkin : null);
    setCheckoutTime(teacher?.checkout && teacher.checkout !== '–' ? teacher.checkout : null);
    setCheckinPhoto(teacher?.loginPhoto || '');
    setCheckoutPhoto(teacher?.checkoutPhoto || '');
    setOnDuty(Boolean(teacher?.onDuty));
  }, [teacher]);

  async function persistAttendance(nextFields) {
    if (!teacherId) return;

    try {
      const response = await fetch(apiUrl(`/api/auth/teachers/${teacherId}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextFields),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || 'Unable to update attendance.');
      }

      onTeacherUpdate?.(data);

      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        if ((parsedUser.id || parsedUser._id) === teacherId) {
          localStorage.setItem('user', JSON.stringify({ ...parsedUser, ...data }));
        }
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <div style={styles.cardTitle}>Today's Attendance Verification</div>
        {onDuty && (
          <div style={styles.dutyBadge}>
            <div style={{...styles.statusDot, width: 6, height: 6}}></div> On Duty
          </div>
        )}
      </div>
      <div style={styles.cardBody}>
        <div style={styles.checkinRow}>
          {[{id:'checkin', icon: checkinTime ? '✅' : '📷', label: checkinTime ? 'Checked In' : 'Check In', time: checkinTime || 'Tap to verify at gate'},
            {id:'checkout', icon: checkoutTime ? '✅' : '🚪', label: checkoutTime ? 'Checked Out' : 'Check Out', time: checkoutTime || 'Not checked out yet'}
          ].map(box => (
            <div key={box.id}
              style={{...styles.checkinBox, ...(box.id==='checkin' && checkinTime ? styles.checkinBoxDone : {}), ...(box.id==='checkout' && checkoutTime ? styles.checkinBoxDone : {})}}
              onClick={() => setModal(box.id)}>
              <span style={{ fontSize: 28, display: 'block', marginBottom: 8, color: (box.id==='checkin'&&checkinTime)||(box.id==='checkout'&&checkoutTime) ? '#059669' : 'inherit' }}>{box.icon}</span>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{box.label}</div>
              <div style={{ fontSize: 12, color: '#6b6b8a', marginTop: 4 }}>{box.time}</div>
            </div>
          ))}
        </div>
        <button
          style={{...styles.dutyBtn, ...(onDuty ? styles.dutyBtnOn : styles.dutyBtnOff)}}
          onClick={async () => {
            const nextOnDuty = !onDuty;
            setOnDuty(nextOnDuty);

            try {
              await persistAttendance({ onDuty: nextOnDuty });
              showToast(nextOnDuty ? '✅' : '🔴', nextOnDuty ? 'You are now marked On Duty' : 'Duty ended');
            } catch (error) {
              setOnDuty(!nextOnDuty);
              showToast('⚠️', error.message || 'Unable to update duty status');
            }
          }}>
          <span>{onDuty ? '✅' : '🟢'}</span> {onDuty ? 'On Duty — Active' : 'Mark On Duty'}
        </button>
        <LocationPings />
      </div>
      {modal && (
        <CameraModal action={modal} onClose={() => setModal(null)} initialPhoto={modal === 'checkin' ? checkinPhoto : checkoutPhoto}
          onConfirm={async ({ time, photo }) => {
            const currentAction = modal;
            const updateTime = currentAction === 'checkin' ? setCheckinTime : setCheckoutTime;
            const updatePhoto = currentAction === 'checkin' ? setCheckinPhoto : setCheckoutPhoto;
            const previousTime = currentAction === 'checkin' ? checkinTime : checkoutTime;
            const previousPhoto = currentAction === 'checkin' ? checkinPhoto : checkoutPhoto;

            updateTime(time);
            updatePhoto(photo);
            setSavingAction(currentAction);

            try {
              const uploadedPhotoUrl = await uploadAttendancePhoto(photo, currentAction);

              if (currentAction === 'checkin') {
                setCheckinPhoto(uploadedPhotoUrl);
                await persistAttendance({
                  checkin: time,
                  lastLogin: new Date().toISOString(),
                  loginPhoto: uploadedPhotoUrl,
                  status: 'present',
                });
              } else {
                setCheckoutPhoto(uploadedPhotoUrl);
                await persistAttendance({
                  checkout: time,
                  lastCheckout: new Date().toISOString(),
                  checkoutPhoto: uploadedPhotoUrl,
                });
              }

              showToast(currentAction === 'checkin' ? '📍' : '👋', (currentAction === 'checkin' ? 'Check-in' : 'Check-out') + ' recorded at ' + time);
            } catch (error) {
              updateTime(previousTime);
              updatePhoto(previousPhoto);
              showToast('⚠️', error.message || 'Unable to save attendance');
            } finally {
              setSavingAction('');
            }
          }} />
      )}
      {savingAction && <div style={styles.savingBanner}>Uploading {savingAction} photo...</div>}
    </div>
  );
}

// ─── ANNOUNCEMENTS ─────────────────────────────────────────
const announcements = [
  { icon: '⚠️', iconType: 'warn', title: 'Staff Meeting — Mandatory', badge: 'New', body: 'All staff to assemble in the conference hall at 2:30 PM today. Attendance is compulsory.', time: 'Today, 9:00 AM · From: Principal' },
  { icon: '📌', iconType: 'info', title: 'Annual Day Rehearsal Schedule', body: 'Rehearsals begin from Monday. Students from Class 6–10 to participate.', time: 'Yesterday · From: Admin Office' },
  { icon: '🔴', iconType: 'alert', title: 'Leave Applications Deadline', body: 'All leave applications for March must be submitted before the 25th.', time: 'Mar 18 · From: Principal' },
];

function AnnouncementList({ items }) {
  return (
    <div style={{ paddingTop: 8 }}>
      {items.map((a, i) => (
        <div key={i} style={{...styles.annItem, ...(i === items.length - 1 ? { borderBottom: 'none' } : {})}}>
          <div style={{...styles.annIcon, ...(a.iconType==='warn'?styles.annIconWarn:a.iconType==='info'?styles.annIconInfo:styles.annIconAlert)}}>{a.icon}</div>
          <div>
            <div style={styles.annTitle}>{a.title}{a.badge && <span style={styles.annBadge}>{a.badge}</span>}</div>
            <div style={styles.annBody}>{a.body}</div>
            <div style={styles.annTime}>{a.time}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── LEAVE CARD ────────────────────────────────────────────
function LeaveCard({ defaultOpen, showToast, teacher, onTeacherUpdate }) {
  const [open, setOpen] = useState(defaultOpen || false);
  useEffect(() => { if (defaultOpen) setOpen(true); }, [defaultOpen]);
  const [form, setForm] = useState({
    type: 'Sick Leave',
    halfDay: 'Full Day',
    fromDate: '',
    toDate: '',
    reason: '',
  });

  function formatLeaveDates(fromDate, toDate) {
    if (!fromDate) return 'Date not set';
    const fromLabel = new Date(`${fromDate}T00:00:00`).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    if (!toDate || toDate === fromDate) return fromLabel;
    const toLabel = new Date(`${toDate}T00:00:00`).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    return `${fromLabel} – ${toLabel}`;
  }

  const leaves = normaliseLeaveRequests(teacher?.leaveRequests).map((request) => ({
    type: request.type,
    dates: request.dates,
    status: request.status === 'approved' ? 'Approved' : request.status === 'rejected' ? 'Rejected' : 'Pending',
    color: request.status === 'approved' ? '#059669' : request.status === 'rejected' ? '#dc2626' : '#d97706',
    bg: request.status === 'approved' ? 'rgba(5,150,105,.1)' : request.status === 'rejected' ? 'rgba(220,38,38,.1)' : 'rgba(217,119,6,.1)',
  }));

  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <div style={styles.cardTitle}>Leave Application</div>
        <span style={{ fontSize: 13, color: '#4f46e5', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setOpen(o => !o)}>+ Apply Now</span>
      </div>
      <div style={styles.cardBody}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e4e2f0' }}>
              {['Type','Date(s)','Status'].map(h => (
                <th key={h} style={{ padding: '8px 0', textAlign: 'left', color: '#6b6b8a', fontWeight: 500, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {leaves.map((l, i) => (
              <tr key={i} style={{ borderBottom: i < leaves.length - 1 ? '1px solid #e4e2f0' : 'none' }}>
                <td style={{ padding: '10px 0' }}>{l.type}</td>
                <td style={{ padding: '10px 0', color: '#6b6b8a' }}>{l.dates}</td>
                <td><span style={{ background: l.bg, color: l.color, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 500 }}>{l.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        {open && (
          <div>
            <div style={{ height: 1, background: '#e4e2f0', margin: '16px 0' }}></div>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>New Leave Request</div>
            <div style={styles.formRow}>
              <div style={styles.fgl}><label style={styles.fglLabel}>Leave Type</label>
                <select style={styles.fglInput} value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}><option>Sick Leave</option><option>Casual Leave</option><option>Personal Leave</option><option>Maternity / Paternity</option><option>Emergency Leave</option></select></div>
              <div style={styles.fgl}><label style={styles.fglLabel}>Half Day?</label>
                <select style={styles.fglInput} value={form.halfDay} onChange={(event) => setForm((current) => ({ ...current, halfDay: event.target.value }))}><option>Full Day</option><option>First Half</option><option>Second Half</option></select></div>
            </div>
            <div style={styles.formRow}>
              <div style={styles.fgl}><label style={styles.fglLabel}>From Date</label><input type="date" style={styles.fglInput} value={form.fromDate} onChange={(event) => setForm((current) => ({ ...current, fromDate: event.target.value }))} /></div>
              <div style={styles.fgl}><label style={styles.fglLabel}>To Date</label><input type="date" style={styles.fglInput} value={form.toDate} onChange={(event) => setForm((current) => ({ ...current, toDate: event.target.value }))} /></div>
            </div>
            <div style={{...styles.fgl, marginBottom: 14}}>
              <label style={styles.fglLabel}>Reason</label>
              <textarea style={{...styles.fglInput, resize: 'vertical', minHeight: 70}} placeholder="Briefly describe the reason..." value={form.reason} onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))} />
            </div>
            <div style={{...styles.fgl, marginBottom: 14}}>
              <label style={styles.fglLabel}>Document (optional)</label>
              <input type="file" accept=".pdf,.jpg,.png" style={styles.fglInput} />
            </div>
            <button style={styles.submitBtn} onClick={async () => {
              if (!form.fromDate || !form.reason.trim()) {
                showToast('⚠️', 'Add dates and a reason before submitting');
                return;
              }

              const nextLeave = {
                type: `${form.type}${form.halfDay !== 'Full Day' ? ` (${form.halfDay})` : ''}`,
                dates: formatLeaveDates(form.fromDate, form.toDate || form.fromDate),
                status: 'Pending',
                color: '#d97706',
                bg: 'rgba(217,119,6,.1)',
              };
              const nextRequest = {
                id: `leave-request-${Date.now()}`,
                type: nextLeave.type,
                dates: nextLeave.dates,
                status: 'pending',
                reason: form.reason.trim(),
                createdAtLabel: 'Just now',
              };

              const nextLeaveRequests = [nextRequest, ...normaliseLeaveRequests(teacher?.leaveRequests)];
              try {
                const response = await fetch(apiUrl(`/api/auth/teachers/${teacher?.id || teacher?._id}`), {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ leaveRequests: nextLeaveRequests }),
                });
                const data = await response.json().catch(() => ({}));
                if (!response.ok) {
                  throw new Error(data.message || 'Unable to submit leave request.');
                }
                onTeacherUpdate?.(data);
                setForm({
                  type: 'Sick Leave',
                  halfDay: 'Full Day',
                  fromDate: '',
                  toDate: '',
                  reason: '',
                });
                showToast('📝', 'Leave request submitted successfully');
                setOpen(false);
              } catch (error) {
                showToast('⚠️', error.message || 'Unable to submit leave request');
              }
            }}>
              Submit Leave Request
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── CALENDAR ──────────────────────────────────────────────
function Calendar() {
  const NOW = new Date();
  const [cY, setCY] = useState(2025);
  const [cM, setCM] = useState(2);
  const [dayDetail, setDayDetail] = useState(null);

  const prevMonth = () => { if (cM === 0) { setCM(11); setCY(y => y - 1); } else setCM(m => m - 1); };
  const nextMonth = () => { if (cM === 11) { setCM(0); setCY(y => y + 1); } else setCM(m => m + 1); };

  const fd = new Date(cY, cM, 1).getDay();
  const dim = new Date(cY, cM + 1, 0).getDate();
  const pd = new Date(cY, cM, 0).getDate();

  const cells = [];
  for (let i = fd - 1; i >= 0; i--) cells.push({ day: pd - i, type: 'other' });
  for (let d = 1; d <= dim; d++) {
    const key = cY + '-' + (cM + 1) + '-' + d;
    const data = attn[key];
    const today = d === NOW.getDate() && cM === NOW.getMonth() && cY === NOW.getFullYear();
    cells.push({ day: d, type: 'current', data, today, key });
  }
  const rem = (7 - (cells.length % 7)) % 7;
  for (let i = 1; i <= rem; i++) cells.push({ day: i, type: 'other' });

  return (
    <div style={{ ...styles.card, position: 'sticky', top: 20 }}>
      <div style={styles.cardHeader}>
        <div style={styles.cardTitle}>Monthly Calendar</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {[['#059669','Present'],['#dc2626','Absent'],['#d97706','Leave']].map(([c,l]) => (
            <span key={l} style={{ fontSize: 11, color: c }}>● {l}</span>
          ))}
        </div>
      </div>
      <div style={styles.cardBody}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>{MONTHS[cM]} {cY}</span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button style={styles.calNav} onClick={prevMonth}>‹</button>
            <button style={styles.calNav} onClick={nextMonth}>›</button>
          </div>
        </div>
        <div style={styles.calGrid}>
          {DS.map(d => <div key={d} style={styles.calDayLabel}>{d}</div>)}
          {cells.map((c, i) => {
            let bg = 'transparent', color = c.type === 'other' ? 'rgba(0,0,0,.2)' : '#1a1a2e';
            let fontWeight = 'normal';
            if (c.today) { bg = '#4f46e5'; color = '#fff'; fontWeight = '600'; }
            else if (c.data) {
              if (c.data.s === 'present') color = '#059669';
              else if (c.data.s === 'absent') color = '#dc2626';
              else color = '#d97706';
              fontWeight = '500';
            }
            const dotColor = c.data ? (c.data.s === 'present' ? '#059669' : c.data.s === 'absent' ? '#dc2626' : '#d97706') : null;
            return (
              <div key={i} style={{ ...styles.calCell, background: bg, color, fontWeight }}
                onClick={() => c.type === 'current' && setDayDetail({ d: c.day, data: c.data, today: c.today })}>
                <span>{c.day}</span>
                {dotColor && !c.today && <div style={{ width: 4, height: 4, borderRadius: '50%', background: dotColor }}></div>}
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ borderTop: '1px solid #e4e2f0', padding: '16px 22px' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#6b6b8a', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 10 }}>Selected Day</div>
        {!dayDetail ? (
          <div style={{ fontSize: 13, color: '#6b6b8a' }}>Click a day to see details</div>
        ) : (
          <div style={{ fontSize: 13 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>{MONTHS[cM]} {dayDetail.d}, {cY}</div>
            {dayDetail.today && !dayDetail.data ? (
              <span style={{ color: '#6b6b8a' }}>Attendance in progress</span>
            ) : dayDetail.data ? (
              <>
                <div style={{ color: dayDetail.data.s==='present'?'#059669':dayDetail.data.s==='absent'?'#dc2626':'#d97706', fontWeight: 500, marginBottom: 6 }}>
                  {dayDetail.data.s==='present'?'✅ Present':dayDetail.data.s==='absent'?'❌ Absent':'🟡 On Leave'}
                </div>
                {dayDetail.data.s === 'present' && (
                  <>
                    <div style={{ fontSize: 12, color: '#6b6b8a' }}>Check-in: <b style={{ color: '#1a1a2e' }}>{dayDetail.data.i}</b></div>
                    <div style={{ fontSize: 12, color: '#6b6b8a' }}>Check-out: <b style={{ color: '#1a1a2e' }}>{dayDetail.data.o}</b></div>
                  </>
                )}
              </>
            ) : <span style={{ color: '#6b6b8a' }}>No record</span>}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── TOAST ─────────────────────────────────────────────────
function Toast({ toast }) {
  return (
    <div style={{
      position: 'fixed', bottom: 28, right: 28, background: '#1a1a2e', color: '#fff',
      borderRadius: 12, padding: '12px 20px', fontSize: 13, fontWeight: 500,
      display: 'flex', alignItems: 'center', gap: 10, zIndex: 9999,
      transition: 'all .3s', pointerEvents: 'none',
      opacity: toast ? 1 : 0, transform: toast ? 'translateY(0)' : 'translateY(10px)',
    }}>
      {toast && <><span>{toast.icon}</span><span>{toast.msg}</span></>}
    </div>
  );
}

// ─── EMPTY SECTION ─────────────────────────────────────────
function EmptySection({ icon, title, msg }) {
  return (
    <div style={styles.card}>
      <div style={styles.emptyState}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>{icon}</div>
        <div style={styles.emptyTitle}>{title}</div>
        <div style={styles.emptyMsg}>{msg}</div>
      </div>
    </div>
  );
}

// ─── DASHBOARD ─────────────────────────────────────────────
function Dashboard({ showToast, openLeave, teacher, onTeacherUpdate }) {
  return (
    <div>
      <div style={styles.topbar}>
        <div>
          <div style={styles.pageTitle}>Dashboard</div>
          <div style={styles.pageSub}>Your attendance overview for today</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={styles.dateChip}>{fmtDate(new Date())}</div>
          <div style={styles.notifBtn}>🔔<div style={styles.notifDot}></div></div>
        </div>
      </div>
      <StatsRow />
      <div style={styles.grid2}>
        <div style={styles.gridLeft}>
          <AttendanceCard teacher={teacher} showToast={showToast} onTeacherUpdate={onTeacherUpdate} />
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={styles.cardTitle}>Announcements</div>
              <span style={{ fontSize: 12, color: '#4f46e5', cursor: 'pointer' }}>View all</span>
            </div>
            <AnnouncementList items={announcements} />
          </div>
          <LeaveCard defaultOpen={openLeave} showToast={showToast} teacher={teacher} onTeacherUpdate={onTeacherUpdate} />
        </div>
        <Calendar />
      </div>
    </div>
  );
}

function TimetableSection({ teacher }) {
  const initialMonth = (() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  })();
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const allTimetable = [...normaliseTimetable(teacher?.timetable)]
    .sort((a, b) => `${a.date || ''}-${a.timeSlot || a.period || ''}`.localeCompare(`${b.date || ''}-${b.timeSlot || b.period || ''}`));
  const monthTimetable = allTimetable
    .filter((entry) => !selectedMonth || (entry.date && entry.date.startsWith(selectedMonth)))
  const timetable = monthTimetable.length > 0 ? monthTimetable : allTimetable;

  return (
    <div>
      <div style={styles.topbar}>
        <div>
          <div style={styles.pageTitle}>Timetable</div>
          <div style={styles.pageSub}>Monthly class schedule</div>
        </div>
        <input type="month" value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)} style={styles.monthInput} />
      </div>
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div style={styles.cardTitle}>Assigned Periods</div>
        </div>
        <div style={styles.cardBody}>
          {monthTimetable.length === 0 && allTimetable.length > 0 && (
            <div style={styles.timetableHint}>No entries for the selected month. Showing all assigned timetable entries instead.</div>
          )}
          {timetable.length > 0 ? (
            <div style={styles.timetableList}>
              {timetable.map((entry, index) => (
                <div key={`${entry.date || entry.day}-${entry.timeSlot || entry.period}-${index}`} style={styles.timetableRow}>
                  <div>
                    <div style={styles.timetableDay}>
                      {entry.date
                        ? new Date(`${entry.date}T00:00:00`).toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'short' })
                        : entry.day}
                    </div>
                    <div style={styles.timetableMeta}>{entry.timeSlot || entry.period} · {entry.subject}</div>
                  </div>
                  <div style={styles.timetableRoom}>{entry.room || 'Room not set'}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={styles.timetableEmpty}>
              No timetable slots were assigned for this month yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LeaveSection({ showToast, teacher, onTeacherUpdate }) {
  return (
    <div>
      <div style={styles.topbar}>
        <div>
          <div style={styles.pageTitle}>Leave Requests</div>
          <div style={styles.pageSub}>Apply for leave and review submitted requests</div>
        </div>
      </div>
      <LeaveCard defaultOpen showToast={showToast} teacher={teacher} onTeacherUpdate={onTeacherUpdate} />
    </div>
  );
}

// ─── APP ───────────────────────────────────────────────────
export default function TeacherDashboard({ teacher, onLogout }) {
  const [teacherState, setTeacherState] = useState(teacher);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [toast, setToast] = useState(null);
  const [openLeave, setOpenLeave] = useState(false);

  useEffect(() => {
    setTeacherState(teacher);
  }, [teacher]);

  function showToast(icon, msg) {
    setToast({ icon, msg });
    setTimeout(() => setToast(null), 3200);
  }

  function handleApplyLeave() {
    setActiveSection('leave');
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
        .status-dot-anim { animation: pulse 2s infinite; }
        input[type="date"], select, textarea, input[type="file"] { font-family: 'DM Sans', sans-serif; }
      `}</style>
      <Sidebar activeSection={activeSection} onNav={setActiveSection} onApplyLeave={handleApplyLeave} teacher={teacherState} onLogout={onLogout} />
      <main style={styles.main}>
        {activeSection === 'dashboard' && <Dashboard showToast={showToast} openLeave={openLeave} teacher={teacherState} onTeacherUpdate={setTeacherState} />}
        {activeSection === 'students' && <><div style={styles.topbar}><div><div style={styles.pageTitle}>My Students</div><div style={styles.pageSub}>Class 9A — Science</div></div></div><EmptySection icon="👨‍🎓" title="Student data coming soon" msg="This section is under development. Your student list, attendance records, and performance data will appear here once the module is ready." /></>}
        {activeSection === 'attendance' && <><div style={styles.topbar}><div><div style={styles.pageTitle}>Attendance</div><div style={styles.pageSub}>Full attendance history</div></div></div><EmptySection icon="📅" title="Full history coming soon" msg="Detailed attendance logs and reports will appear here. Use the dashboard calendar to view monthly records for now." /></>}
        {activeSection === 'timetable' && <TimetableSection teacher={teacherState} />}
        {activeSection === 'leave' && <LeaveSection showToast={showToast} teacher={teacherState} onTeacherUpdate={setTeacherState} />}
        {activeSection === 'announcements' && (
          <><div style={styles.topbar}><div><div style={styles.pageTitle}>Announcements</div><div style={styles.pageSub}>All notices from school management</div></div></div>
          <div style={styles.card}><AnnouncementList items={[...announcements, { icon: '📌', iconType: 'info', title: 'Parent-Teacher Meeting — March 29', body: 'All class teachers must be present. Individual schedules will be shared by the coordinator.', time: 'Mar 15 · From: Admin Office' }]} /></div></>
        )}
        {activeSection === 'settings' && <><div style={styles.topbar}><div><div style={styles.pageTitle}>Settings</div><div style={styles.pageSub}>Account & preferences</div></div></div><EmptySection icon="⚙️" title="Settings coming soon" msg="Profile settings, notification preferences, and password management will be available here." /></>}
      </main>
      <Toast toast={toast} />
    </div>
  );
}

// ─── STYLES ────────────────────────────────────────────────
const styles = {
  shell: { display: 'flex', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif", background: '#f0eff8', color: '#1a1a2e', fontSize: 14 },
  sidebar: { width: 240, flexShrink: 0, background: '#1a1a2e', display: 'flex', flexDirection: 'column', position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 100 },
  logoArea: { padding: '24px 24px 16px', borderBottom: '1px solid rgba(255,255,255,.08)' },
  portalLabel: { fontSize: 11, color: 'rgba(255,255,255,.35)', letterSpacing: '.1em', textTransform: 'uppercase' },
  teacherPill: { margin: '16px 14px', background: 'rgba(255,255,255,.07)', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 },
  avatar: { width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: '#fff', flexShrink: 0 },
  teacherName: { fontSize: 13, fontWeight: 500, color: '#fff' },
  teacherRole: { fontSize: 11, color: 'rgba(255,255,255,.4)' },
  nav: { flex: 1, padding: '8px 12px', overflowY: 'auto' },
  navLbl: { fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.3)', padding: '16px 12px 8px' },
  navItem: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, color: 'rgba(255,255,255,.55)', fontSize: 13, cursor: 'pointer', marginBottom: 2, border: 'none', background: 'none', width: '100%', textAlign: 'left', transition: 'all .15s' },
  navItemActive: { background: 'rgba(79,70,229,.3)', color: '#fff', fontWeight: 500 },
  navIcon: { fontSize: 16, width: 20, textAlign: 'center' },
  sidebarFooter: { padding: 14, borderTop: '1px solid rgba(255,255,255,.08)' },
  statusBadge: { display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(5,150,105,.15)', borderRadius: 8, padding: '8px 12px' },
  statusDot: { width: 8, height: 8, borderRadius: '50%', background: '#059669', animation: 'pulse 2s infinite' },
  statusText: { fontSize: 12, color: 'rgba(255,255,255,.7)' },
  main: { marginLeft: 240, flex: 1, padding: 28 },
  topbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 },
  pageTitle: { fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 600, color: '#1a1a2e' },
  pageSub: { fontSize: 13, color: '#6b6b8a', marginTop: 2 },
  dateChip: { background: '#fff', border: '1px solid #e4e2f0', borderRadius: 10, padding: '8px 14px', fontSize: 13, color: '#6b6b8a' },
  notifBtn: { width: 38, height: 38, borderRadius: 10, background: '#fff', border: '1px solid #e4e2f0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 16, position: 'relative' },
  notifDot: { position: 'absolute', top: 7, right: 7, width: 7, height: 7, borderRadius: '50%', background: '#dc2626', border: '1.5px solid #fff' },
  monthInput: { background: '#fff', border: '1px solid #e4e2f0', borderRadius: 10, padding: '8px 12px', fontSize: 13, color: '#6b6b8a' },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 },
  statCard: { background: '#fff', borderRadius: 16, border: '1px solid #e4e2f0', padding: '18px 20px', position: 'relative', overflow: 'hidden' },
  statLabel: { fontSize: 12, color: '#6b6b8a', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.05em' },
  statValue: { fontFamily: "'Fraunces', serif", fontSize: 32, fontWeight: 700, lineHeight: 1 },
  statSub: { fontSize: 11, color: '#6b6b8a', marginTop: 6 },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, marginBottom: 20 },
  gridLeft: { display: 'flex', flexDirection: 'column', gap: 20 },
  card: { background: '#fff', borderRadius: 16, border: '1px solid #e4e2f0', overflow: 'hidden' },
  cardHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px 14px', borderBottom: '1px solid #e4e2f0' },
  cardTitle: { fontSize: 14, fontWeight: 600, color: '#1a1a2e' },
  cardBody: { padding: '20px 22px' },
  checkinRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 },
  checkinBox: { border: '1.5px dashed #e4e2f0', borderRadius: 10, padding: 16, textAlign: 'center', cursor: 'pointer', transition: 'all .2s' },
  checkinBoxDone: { borderStyle: 'solid', borderColor: '#059669', background: 'rgba(5,150,105,.04)' },
  dutyBtn: { width: '100%', padding: 14, borderRadius: 10, border: 'none', fontSize: 15, fontWeight: 600, cursor: 'pointer', transition: 'all .2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 },
  dutyBtnOff: { background: '#4f46e5', color: '#fff' },
  dutyBtnOn: { background: 'rgba(5,150,105,.12)', color: '#059669', border: '1.5px solid #059669' },
  dutyBadge: { display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(5,150,105,.12)', color: '#059669', borderRadius: 20, padding: '4px 10px', fontSize: 12, fontWeight: 500 },
  savingBanner: { margin: '0 22px 20px', padding: '10px 12px', borderRadius: 10, background: 'rgba(79,70,229,.08)', color: '#4338ca', fontSize: 12, fontWeight: 600, textAlign: 'center' },
  locationRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #e4e2f0' },
  locTime: { fontSize: 12, color: '#6b6b8a', width: 60, flexShrink: 0 },
  locBadge: { fontSize: 12, padding: '3px 10px', borderRadius: 20, fontWeight: 500 },
  locBadgeOk: { background: 'rgba(5,150,105,.1)', color: '#059669' },
  locBadgeMiss: { background: 'rgba(220,38,38,.1)', color: '#dc2626' },
  locCoords: { fontSize: 12, color: '#6b6b8a', fontFamily: 'monospace' },
  locPhoto: { width: 28, height: 28, borderRadius: 6, background: '#f0eff8', border: '1px solid #e4e2f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 },
  nextPing: { display: 'inline-flex', alignItems: 'center', background: 'rgba(37,99,235,.06)', borderRadius: 10, padding: '4px 10px', border: '1px solid rgba(37,99,235,.15)' },
  pingLabel: { fontSize: 12, color: '#2563eb', fontWeight: 500 },
  pingTimer: { fontSize: 13, fontWeight: 600, color: '#2563eb', fontVariantNumeric: 'tabular-nums' },
  annItem: { display: 'flex', gap: 12, padding: '14px 22px', borderBottom: '1px solid #e4e2f0' },
  annIcon: { width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 },
  annIconInfo: { background: 'rgba(37,99,235,.1)' },
  annIconWarn: { background: 'rgba(217,119,6,.1)' },
  annIconAlert: { background: 'rgba(220,38,38,.1)' },
  annTitle: { fontSize: 13, fontWeight: 500, color: '#1a1a2e' },
  annBody: { fontSize: 12, color: '#6b6b8a', marginTop: 3, lineHeight: 1.5 },
  annTime: { fontSize: 11, color: '#6b6b8a', marginTop: 4 },
  annBadge: { fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 500, marginLeft: 8, background: 'rgba(79,70,229,.12)', color: '#4f46e5' },
  formRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 },
  fgl: { display: 'flex', flexDirection: 'column', gap: 6 },
  fglLabel: { fontSize: 12, fontWeight: 500, color: '#6b6b8a', textTransform: 'uppercase', letterSpacing: '.04em' },
  fglInput: { border: '1px solid #e4e2f0', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: '#1a1a2e', background: '#f0eff8', outline: 'none', width: '100%' },
  submitBtn: { background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 500, cursor: 'pointer', width: '100%' },
  calGrid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 },
  calDayLabel: { fontSize: 10, color: '#6b6b8a', textAlign: 'center', fontWeight: 500, letterSpacing: '.05em', padding: '4px 0', textTransform: 'uppercase' },
  calCell: { aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, borderRadius: 8, cursor: 'pointer', flexDirection: 'column', gap: 1 },
  calNav: { width: 28, height: 28, border: '1px solid #e4e2f0', background: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, color: '#6b6b8a' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 },
  modal: { background: '#fff', borderRadius: 16, padding: 28, width: 360, maxWidth: '94vw', position: 'relative' },
  modalTitle: { fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 600, marginBottom: 8 },
  modalSub: { fontSize: 13, color: '#6b6b8a', marginBottom: 20 },
  cameraPreview: { width: '100%', height: 200, background: '#111', borderRadius: 10, marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 },
  cameraImage: { width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 },
  cameraPlaceholder: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 48 },
  cameraError: { fontSize: 12, color: '#dc2626', textAlign: 'center', marginTop: -6, marginBottom: 12 },
  cameraHint: { fontSize: 12, color: '#6b6b8a', textAlign: 'center', marginBottom: 16 },
  modalBtns: { display: 'flex', gap: 10 },
  modalBtn: { flex: 1, padding: 11, borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: '1px solid #e4e2f0', background: '#f0eff8', color: '#1a1a2e' },
  modalBtnPrimary: { background: '#4f46e5', color: '#fff', borderColor: '#4f46e5' },
  timetableList: { display: 'flex', flexDirection: 'column', gap: 12 },
  timetableRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, border: '1px solid #e4e2f0', borderRadius: 12, padding: '14px 16px', background: '#fff' },
  timetableDay: { fontSize: 13, fontWeight: 700, color: '#1a1a2e' },
  timetableMeta: { marginTop: 4, fontSize: 13, color: '#6b6b8a' },
  timetableRoom: { fontSize: 13, fontWeight: 600, color: '#4f46e5' },
  timetableEmpty: { border: '1px dashed #d8d4eb', borderRadius: 12, padding: '18px', background: '#f7f6fd', color: '#6b6b8a', fontSize: 13 },
  timetableHint: { marginBottom: 14, borderRadius: 10, padding: '10px 12px', background: '#eef2ff', color: '#4338ca', fontSize: 12, fontWeight: 600 },
  modalClose: { position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#6b6b8a' },
  emptyState: { textAlign: 'center', padding: '80px 40px' },
  emptyTitle: { fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 600, color: '#1a1a2e', marginBottom: 10 },
  emptyMsg: { fontSize: 14, color: '#6b6b8a', lineHeight: 1.7, maxWidth: 360, margin: '0 auto' },
};
