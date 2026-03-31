import { useEffect, useState } from "react";
import './AdminDashboard.css';
import AdminSidebar from './components/AdminSidebar';
import TeacherTracking from './components/TeacherTracking';
import NoticeBoard from './components/NoticeBoard';
import LeaveRequests from './components/LeaveRequests';
import { apiUrl } from './api';
import { getFallbackTeachers, saveFallbackTeachers } from './demoData';

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function formatCheckin(lastLogin, fallback = '–') {
  if (!lastLogin) return fallback;
  return new Date(lastLogin).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function normaliseTeacher(teacher, index) {
  return {
    id: teacher.id ?? teacher._id ?? index + 1,
    name: teacher.name,
    email: teacher.email || '',
    initials: teacher.initials || 'T',
    subject: teacher.subject || 'General',
    class: teacher.class || teacher.className || '–',
    status: teacher.status || (teacher.lastLogin ? 'present' : 'absent'),
    checkin: formatCheckin(teacher.lastLogin, teacher.checkin || '–'),
    checkout: teacher.checkout || '–',
    onDuty: Boolean(teacher.onDuty),
    absent: teacher.absent ?? 0,
    leave: teacher.leave ?? 0,
    rate: teacher.rate || '0%',
    color: teacher.color || '#4f46e5',
    lastLogin: teacher.lastLogin || null,
    loginPhoto: teacher.loginPhoto || '',
    checkoutPhoto: teacher.checkoutPhoto || '',
    timetable: Array.isArray(teacher.timetable) ? teacher.timetable : [],
    updatedAt: teacher.updatedAt || 0,
  };
}

function mergeTeacherRecords(remoteTeachers, fallbackTeachers) {
  const fallbackByEmail = new Map(
    fallbackTeachers
      .filter((teacher) => teacher?.email)
      .map((teacher) => [teacher.email, teacher])
  );

  const merged = remoteTeachers.map((teacher) => {
    const fallbackTeacher = fallbackByEmail.get(teacher.email);
    if (!fallbackTeacher) return teacher;

    return fallbackTeacher.updatedAt > (teacher.updatedAt || 0)
      ? { ...teacher, ...fallbackTeacher }
      : teacher;
  });

  fallbackTeachers.forEach((teacher) => {
    if (!teacher?.email) return;
    if (!merged.some((item) => item.email === teacher.email)) {
      merged.push(teacher);
    }
  });

  return merged;
}

function buildInitials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'T';
}

function createTeacherRecord(form, index = 0) {
  return normaliseTeacher({
    id: `teacher-${Date.now()}-${index}`,
    name: form.name.trim(),
    email: form.email.trim().toLowerCase(),
    role: 'teacher',
    subject: form.subject.trim() || 'General',
    class: form.className.trim() || '–',
    initials: buildInitials(form.name),
    color: '#4f46e5',
    status: 'absent',
    checkin: '–',
    checkout: '–',
    onDuty: false,
    absent: 0,
    leave: 0,
    rate: '0%',
    updatedAt: Date.now(),
  });
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
            {isSaving ? 'Adding...' : 'Add Teacher'}
          </button>
        </div>
      </form>
    </div>
  );
}

function TimetablePanel({ teachers, form, onChange, onSubmit, isSaving }) {
  const selectedTeacher = teachers.find((teacher) => String(teacher.id) === form.teacherId);
  const sortedEntries = selectedTeacher?.timetable
    ? [...selectedTeacher.timetable].sort((a, b) => {
        const dayDelta = WEEKDAYS.indexOf(a.day) - WEEKDAYS.indexOf(b.day);
        return dayDelta !== 0 ? dayDelta : a.period.localeCompare(b.period);
      })
    : [];

  return (
    <div className="accounts-container">
      <div className="accounts-header">
        <h2>Teacher Timetable</h2>
        <p>Assign period slots for a selected teacher.</p>
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
            <span>Day</span>
            <select name="day" value={form.day} onChange={onChange} required>
              {WEEKDAYS.map((day) => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>Period / Time</span>
            <input name="period" value={form.period} onChange={onChange} placeholder="09:00 - 09:45" required />
          </label>
          <label className="form-field">
            <span>Subject</span>
            <input name="subject" value={form.subject} onChange={onChange} placeholder="Science" required />
          </label>
          <label className="form-field">
            <span>Room</span>
            <input name="room" value={form.room} onChange={onChange} placeholder="Lab 2 / 9A" />
          </label>
        </div>
        <div className="form-actions">
          <button className="primary-action" type="submit" disabled={isSaving || teachers.length === 0}>
            {isSaving ? 'Saving...' : 'Add Timetable Slot'}
          </button>
        </div>
      </form>
      <div className="timetable-list">
        {selectedTeacher ? (
          sortedEntries.length > 0 ? (
            sortedEntries.map((entry, index) => (
              <div key={`${entry.day}-${entry.period}-${index}`} className="timetable-row">
                <div className="timetable-main">
                  <div className="timetable-day">{entry.day}</div>
                  <div className="timetable-meta">{entry.period} · {entry.subject}</div>
                </div>
                <div className="timetable-room">{entry.room || 'Room not set'}</div>
              </div>
            ))
          ) : (
            <div className="timetable-empty">No timetable slots added for this teacher yet.</div>
          )
        ) : (
          <div className="timetable-empty">Select a teacher to review and add timetable slots.</div>
        )}
      </div>
    </div>
  );
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
              <div className="teacher-avatar" style={{ '--teacher-color': teacher.color }}>
                {teacher.initials}
              </div>
              <div>
                <div className="teacher-name">{teacher.name}</div>
                <div className="teacher-subject">{teacher.subject} • {teacher.class}</div>
              </div>
            </div>
            <div className="account-meta">
              <div className="account-label">Email</div>
              <div className="account-value">{teacher.email || 'No email'}</div>
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

export default function AdminDashboard({ user, onLogout }) {
  const [activeSection, setActiveSection] = useState('tracking');
  const [teachers, setTeachers] = useState([]);
  const [teacherForm, setTeacherForm] = useState({
    name: '',
    email: '',
    password: '',
    subject: '',
    className: '',
  });
  const [isSavingTeacher, setIsSavingTeacher] = useState(false);
  const [timetableForm, setTimetableForm] = useState({
    teacherId: '',
    day: 'Monday',
    period: '',
    subject: '',
    room: '',
  });
  const [isSavingTimetable, setIsSavingTimetable] = useState(false);

  const [announcements, setAnnouncements] = useState([
    { id:1, title:'Annual Sports Day Prep',    body:'All PE staff to coordinate with class teachers for student participation lists.', time:'Today, 9:00 AM', icon:'🏆', type:'info' },
    { id:2, title:'Board Exam Schedule Out',   body:'Class 10 & 12 exam timetable published. Ensure supervision duty assignments.', time:'Yesterday',      icon:'📋', type:'warn' },
    { id:3, title:'Parent-Teacher Meet — Mar 29', body:'All class teachers must be present. Schedules will be shared by EOD.', time:'Mar 18',         icon:'👨‍👩‍👦', type:'info' },
  ]);

  const [leaveRequests, setLeaveRequests] = useState([
    { id:1, name:'Priya Ramesh', type:'Casual Leave', dates:'Apr 1', status:'pending', initials:'PR', color:'#4f46e5' },
  ]);

  const [toast, setToast] = useState({ show: false, msg: '' });

  useEffect(() => {
    let cancelled = false;

    async function loadTeachers() {
      try {
        const response = await fetch(apiUrl('/api/auth/teachers'));
        const data = await response.json().catch(() => []);
        if (!response.ok) {
          throw new Error(data.message || 'Unable to load teachers.');
        }

        if (!cancelled) {
          const nextTeachers = Array.isArray(data) && data.length > 0
            ? mergeTeacherRecords(data.map(normaliseTeacher), getFallbackTeachers().map(normaliseTeacher))
            : getFallbackTeachers().map(normaliseTeacher);
          setTeachers(nextTeachers);
          saveFallbackTeachers(nextTeachers);
        }
      } catch {
        if (!cancelled) {
          setTeachers(getFallbackTeachers().map(normaliseTeacher));
        }
      }
    }

    loadTeachers();
    const intervalId = setInterval(loadTeachers, 5000);
    const handleFocus = () => loadTeachers();
    window.addEventListener('focus', handleFocus);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const showToast = (msg) => {
    setToast({ show: true, msg });
    setTimeout(() => setToast({ show: false, msg: '' }), 3000);
  };

  const handleApproveLeave = (id) => {
    setLeaveRequests(prev => prev.map(req => 
      req.id === id ? { ...req, status: 'approved' } : req
    ));
    showToast('Leave request approved ✅');
  };

  const handleRejectLeave = (id) => {
    setLeaveRequests(prev => prev.map(req => 
      req.id === id ? { ...req, status: 'rejected' } : req
    ));
    showToast('Leave request rejected ❌');
  };

  const handleAddAnnouncement = (title, body) => {
    const newAnnouncement = {
      id: announcements.length + 1,
      title,
      body,
      time: 'Just now',
      icon: '📢',
      type: 'info'
    };
    setAnnouncements([newAnnouncement, ...announcements]);
    showToast('Announcement posted ✅');
  };

  const handleTeacherFormChange = ({ target }) => {
    const { name, value } = target;
    setTeacherForm((current) => ({ ...current, [name]: value }));
  };

  const handleAddTeacher = async (event) => {
    event.preventDefault();
    if (isSavingTeacher) return;

    const nextTeacher = createTeacherRecord(teacherForm, teachers.length);
    setIsSavingTeacher(true);

    try {
      const response = await fetch(apiUrl('/api/auth/teachers'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: teacherForm.name.trim(),
          email: teacherForm.email.trim().toLowerCase(),
          password: teacherForm.password.trim(),
          subject: teacherForm.subject.trim(),
          class: teacherForm.className.trim(),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || 'Unable to add teacher.');
      }

      const createdTeacher = normaliseTeacher(data, teachers.length);
      const nextTeachers = [createdTeacher, ...teachers];
      setTeachers(nextTeachers);
      saveFallbackTeachers(nextTeachers);
      setTimetableForm((current) => ({ ...current, teacherId: String(createdTeacher.id) }));
      showToast('Teacher added ✅');
      setTeacherForm({ name: '', email: '', password: '', subject: '', className: '' });
    } catch (error) {
      if (teachers.some((teacher) => teacher.email === nextTeacher.email)) {
        showToast(error.message || 'Unable to add teacher.');
      } else {
        const nextTeachers = [nextTeacher, ...teachers];
        setTeachers(nextTeachers);
        saveFallbackTeachers(nextTeachers);
        showToast('Teacher added locally ⚠️');
        setTeacherForm({ name: '', email: '', password: '', subject: '', className: '' });
      }
    } finally {
      setIsSavingTeacher(false);
    }
  };

  const handleTimetableFormChange = ({ target }) => {
    const { name, value } = target;
    setTimetableForm((current) => ({ ...current, [name]: value }));
  };

  const handleAddTimetable = async (event) => {
    event.preventDefault();
    if (isSavingTimetable) return;

    const teacher = teachers.find((item) => String(item.id) === timetableForm.teacherId);
    if (!teacher) {
      showToast('Select a teacher first.');
      return;
    }

    const nextEntry = {
      day: timetableForm.day,
      period: timetableForm.period.trim(),
      subject: timetableForm.subject.trim(),
      room: timetableForm.room.trim(),
    };
    const nextTimetable = [...(teacher.timetable || []), nextEntry];
    const nextTeacher = normaliseTeacher({ ...teacher, timetable: nextTimetable }, teachers.length);

    setIsSavingTimetable(true);

    try {
      const response = await fetch(apiUrl(`/api/auth/teachers/${teacher.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timetable: nextTimetable }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || 'Unable to save timetable.');
      }

      const updatedTeacher = normaliseTeacher(data, teachers.length);
      const nextTeachers = teachers.map((item) =>
        String(item.id) === String(updatedTeacher.id) ? updatedTeacher : item
      );
      setTeachers(nextTeachers);
      saveFallbackTeachers(nextTeachers);
      showToast('Timetable slot saved ✅');
    } catch (error) {
      const nextTeachers = teachers.map((item) =>
        String(item.id) === String(teacher.id) ? nextTeacher : item
      );
      setTeachers(nextTeachers);
      saveFallbackTeachers(nextTeachers);
      showToast(error.message || 'Timetable saved locally ⚠️');
    } finally {
      setIsSavingTimetable(false);
      setTimetableForm((current) => ({ ...current, period: '', subject: '', room: '' }));
    }
  };

  return (
    <div className="admin-shell">
      <AdminSidebar activeSection={activeSection} onShowSection={setActiveSection} user={user} onLogout={onLogout} />
      <div className="admin-content-wrapper">
        {activeSection === 'tracking' && <TeacherTracking teachers={teachers} />}
        {activeSection === 'teachers' && (
          <>
            <TeacherTracking teachers={teachers} />
            <AddTeacherPanel
              form={teacherForm}
              onChange={handleTeacherFormChange}
              onSubmit={handleAddTeacher}
              isSaving={isSavingTeacher}
            />
            <TimetablePanel
              teachers={teachers}
              form={timetableForm}
              onChange={handleTimetableFormChange}
              onSubmit={handleAddTimetable}
              isSaving={isSavingTimetable}
            />
            <TeacherAccounts teachers={teachers} />
          </>
        )}
        {activeSection === 'notices' && <NoticeBoard announcements={announcements} onAddAnnouncement={handleAddAnnouncement} />}
        {activeSection === 'leaves' && <LeaveRequests requests={leaveRequests} onApprove={handleApproveLeave} onReject={handleRejectLeave} />}
      </div>
      
      <div className={`admin-toast ${toast.show ? 'show' : ''}`}>
        {toast.msg}
      </div>
    </div>
  );
}
