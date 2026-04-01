import { useEffect, useState } from "react";
import './AdminDashboard.css';
import AdminSidebar from './components/AdminSidebar';
import TeacherTracking from './components/TeacherTracking';
import NoticeBoard from './components/NoticeBoard';
import LeaveRequests from './components/LeaveRequests';
import { apiUrl } from './api';
import { getDateKey, getDelayUntilNextDay, normaliseTeacherForToday } from './attendance';
import { getFallbackTeachers, removeFallbackTeacher, saveFallbackTeachers } from './demoData';

function formatMonthValue(value) {
  const date = value ? new Date(`${value}-01T00:00:00`) : new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function formatEntryDay(entry) {
  if (entry.date) {
    return new Date(`${entry.date}T00:00:00`).toLocaleDateString([], {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
    });
  }

  return entry.day || 'Unscheduled';
}

function normaliseTimetableEntries(timetable) {
  return Array.isArray(timetable)
    ? timetable
        .map((entry) => ({
          date: entry?.date || '',
          day: entry?.day || '',
          timeSlot: entry?.timeSlot || entry?.period || '',
          period: entry?.period || entry?.timeSlot || '',
          subject: entry?.subject || '',
          room: entry?.room || '',
        }))
        .filter((entry) => entry.date || entry.day || entry.timeSlot || entry.subject || entry.room)
    : [];
}

function formatCheckin(lastLogin, fallback = '–') {
  if (!lastLogin) return fallback;
  return new Date(lastLogin).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function normaliseTeacher(teacher, index) {
  const todayTeacher = normaliseTeacherForToday(teacher);

  return {
    id: todayTeacher.id ?? todayTeacher._id ?? index + 1,
    _id: todayTeacher._id || '',
    name: todayTeacher.name,
    email: todayTeacher.email || '',
    initials: todayTeacher.initials || 'T',
    subject: todayTeacher.subject || 'General',
    class: todayTeacher.class || todayTeacher.className || '–',
    status: todayTeacher.status || 'absent',
    checkin: todayTeacher.checkin || formatCheckin(todayTeacher.lastLogin, '–'),
    checkout: todayTeacher.checkout || '–',
    onDuty: Boolean(todayTeacher.onDuty),
    absent: todayTeacher.absent ?? 0,
    leave: todayTeacher.leave ?? 0,
    rate: todayTeacher.rate || '0%',
    color: todayTeacher.color || '#4f46e5',
    lastLogin: todayTeacher.lastLogin || null,
    loginPhoto: todayTeacher.loginPhoto || '',
    checkoutPhoto: todayTeacher.checkoutPhoto || '',
    timetable: normaliseTimetableEntries(todayTeacher.timetable),
    attendanceRecords: Array.isArray(todayTeacher.attendanceRecords) ? todayTeacher.attendanceRecords : [],
    leaveRequests: Array.isArray(todayTeacher.leaveRequests) ? todayTeacher.leaveRequests : [],
    updatedAt: todayTeacher.updatedAt || 0,
  };
}

function getLeaveRequestMeta(status) {
  if (status === 'approved') return { label: 'Approved', color: '#059669', bg: 'rgba(5,150,105,.1)' };
  if (status === 'rejected') return { label: 'Rejected', color: '#dc2626', bg: 'rgba(220,38,38,.1)' };
  return { label: 'Pending', color: '#d97706', bg: 'rgba(217,119,6,.1)' };
}

function mergeTeacherRecords(remoteTeachers, fallbackTeachers) {
  const merged = [...remoteTeachers];

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
    ? [...selectedTeacher.timetable]
        .filter((entry) => !form.month || (entry.date && entry.date.startsWith(form.month)))
        .sort((a, b) => {
          const left = `${a.date || ''}-${a.timeSlot || a.period || ''}`;
          const right = `${b.date || ''}-${b.timeSlot || b.period || ''}`;
          return left.localeCompare(right);
        })
    : [];

  return (
    <div className="accounts-container">
      <div className="accounts-header">
        <h2>Monthly Timetables</h2>
        <p>Assign dated timetable slots for a selected teacher and month.</p>
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
          <label className="form-field">
            <span>Date</span>
            <input name="date" type="date" value={form.date} onChange={onChange} required />
          </label>
          <label className="form-field">
            <span>Time Slot</span>
            <input name="timeSlot" value={form.timeSlot} onChange={onChange} placeholder="09:00 - 09:45" required />
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
              <div key={`${entry.date || entry.day}-${entry.timeSlot || entry.period}-${index}`} className="timetable-row">
                <div className="timetable-main">
                  <div className="timetable-day">{formatEntryDay(entry)}</div>
                  <div className="timetable-meta">{entry.timeSlot || entry.period} · {entry.subject}</div>
                </div>
                <div className="timetable-room">{entry.room || 'Room not set'}</div>
              </div>
            ))
          ) : (
            <div className="timetable-empty">No timetable slots added for the selected month yet.</div>
          )
        ) : (
          <div className="timetable-empty">Select a teacher to review and add monthly timetable slots.</div>
        )}
      </div>
    </div>
  );
}

function TeacherAccounts({ teachers, onDeleteTeacher, deletingTeacherId }) {
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
            <div className="account-actions">
              <button
                type="button"
                className="danger-action"
                disabled={deletingTeacherId === teacher.id}
                onClick={() => onDeleteTeacher(teacher)}
              >
                {deletingTeacherId === teacher.id ? 'Deleting...' : 'Delete'}
              </button>
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
  const [todayKey, setTodayKey] = useState(() => getDateKey());
  const [teacherForm, setTeacherForm] = useState({
    name: '',
    email: '',
    password: '',
    subject: '',
    className: '',
  });
  const [isSavingTeacher, setIsSavingTeacher] = useState(false);
  const [deletingTeacherId, setDeletingTeacherId] = useState('');
  const [timetableForm, setTimetableForm] = useState({
    teacherId: '',
    month: formatMonthValue(),
    date: '',
    timeSlot: '',
    subject: '',
    room: '',
  });
  const [isSavingTimetable, setIsSavingTimetable] = useState(false);

  const [announcements, setAnnouncements] = useState([]);

  const [toast, setToast] = useState({ show: false, msg: '' });
  const leaveRequests = teachers.flatMap((teacher) =>
    (teacher.leaveRequests || []).map((request) => ({
      ...request,
      id: `${teacher.id}:${request.id}`,
      requestId: request.id,
      teacherId: teacher.id,
      name: teacher.name,
      initials: teacher.initials,
      color: teacher.color,
    }))
  );

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

  useEffect(() => {
    let cancelled = false;

    async function loadAnnouncements() {
      try {
        const response = await fetch(apiUrl('/api/auth/announcements'));
        const data = await response.json().catch(() => []);
        if (!response.ok) {
          throw new Error(data.message || 'Unable to load announcements.');
        }

        if (!cancelled) {
          setAnnouncements(Array.isArray(data) ? data : []);
        }
      } catch {
        if (!cancelled) {
          setAnnouncements([]);
        }
      }
    }

    loadAnnouncements();
    const intervalId = setInterval(loadAnnouncements, 5000);
    const handleFocus = () => loadAnnouncements();
    window.addEventListener('focus', handleFocus);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setTodayKey(getDateKey());
    }, getDelayUntilNextDay());

    return () => window.clearTimeout(timeoutId);
  }, [todayKey]);

  useEffect(() => {
    setTeachers((current) => current.map((teacher, index) => normaliseTeacher(teacher, index)));
  }, [todayKey]);

  const showToast = (msg) => {
    setToast({ show: true, msg });
    setTimeout(() => setToast({ show: false, msg: '' }), 3000);
  };

  const handleApproveLeave = async (request) => {
    const teacher = teachers.find((item) => String(item.id) === String(request.teacherId));
    if (!teacher) return;
    const nextLeaveRequests = (teacher.leaveRequests || []).map((item) =>
      item.id === request.requestId ? { ...item, status: 'approved' } : item
    );
    try {
      const response = await fetch(apiUrl(`/api/auth/teachers/${teacher.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leaveRequests: nextLeaveRequests }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'Unable to approve leave request.');
      setTeachers((current) => current.map((item) => String(item.id) === String(teacher.id) ? normaliseTeacher(data, 0) : item));
      showToast('Leave request approved ✅');
    } catch (error) {
      showToast(error.message || 'Unable to approve leave request');
    }
  };

  const handleRejectLeave = async (request) => {
    const teacher = teachers.find((item) => String(item.id) === String(request.teacherId));
    if (!teacher) return;
    const nextLeaveRequests = (teacher.leaveRequests || []).map((item) =>
      item.id === request.requestId ? { ...item, status: 'rejected' } : item
    );
    try {
      const response = await fetch(apiUrl(`/api/auth/teachers/${teacher.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leaveRequests: nextLeaveRequests }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'Unable to reject leave request.');
      setTeachers((current) => current.map((item) => String(item.id) === String(teacher.id) ? normaliseTeacher(data, 0) : item));
      showToast('Leave request rejected ❌');
    } catch (error) {
      showToast(error.message || 'Unable to reject leave request');
    }
  };

  const handleAddAnnouncement = async (title, body) => {
    const response = await fetch(apiUrl('/api/auth/announcements'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, body }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || 'Unable to post announcement.');
    }

    setAnnouncements((current) => [data, ...current]);
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
      setTimetableForm((current) => ({
        ...current,
        teacherId: String(createdTeacher.id),
      }));
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

  const handleDeleteTeacher = async (teacher) => {
    if (!teacher) return;

    const confirmed = window.confirm(`Delete teacher account for ${teacher.name}?`);
    if (!confirmed) return;

    const teacherKey = teacher._id || teacher.id;
    const hasRemoteId = Boolean(teacher._id);

    setDeletingTeacherId(teacher.id);

    try {
      if (hasRemoteId) {
        const response = await fetch(apiUrl(`/api/auth/teachers/${teacherKey}`), {
          method: 'DELETE',
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.message || 'Unable to delete teacher.');
        }
      }

      const nextTeachers = teachers.filter((item) => String(item._id || item.id) !== String(teacherKey));
      setTeachers(nextTeachers);
      removeFallbackTeacher(teacher);
      showToast(hasRemoteId ? 'Teacher deleted ✅' : 'Teacher removed locally ✅');
    } catch (error) {
      showToast(error.message || 'Unable to delete teacher');
    } finally {
      setDeletingTeacherId('');
      setTimetableForm((current) => current.teacherId === String(teacher.id) ? { ...current, teacherId: '' } : current);
    }
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
      date: timetableForm.date,
      day: new Date(`${timetableForm.date}T00:00:00`).toLocaleDateString([], { weekday: 'long' }),
      timeSlot: timetableForm.timeSlot.trim(),
      period: timetableForm.timeSlot.trim(),
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
      setTimetableForm((current) => ({ ...current, date: '', timeSlot: '', subject: '', room: '' }));
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
            <TeacherAccounts
              teachers={teachers}
              onDeleteTeacher={handleDeleteTeacher}
              deletingTeacherId={deletingTeacherId}
            />
          </>
        )}
        {activeSection === 'timetables' && (
          <TimetablePanel
            teachers={teachers}
            form={timetableForm}
            onChange={handleTimetableFormChange}
            onSubmit={handleAddTimetable}
            isSaving={isSavingTimetable}
          />
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
