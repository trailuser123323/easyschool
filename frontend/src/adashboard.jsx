import { useEffect, useState } from "react";
import './AdminDashboard.css';
import AdminSidebar from './components/AdminSidebar';
import TeacherTracking from './components/TeacherTracking';
import NoticeBoard from './components/NoticeBoard';
import LeaveRequests from './components/LeaveRequests';
import { apiUrl } from './api';

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
  };
}

export default function AdminDashboard({ user, onLogout }) {
  const [activeSection, setActiveSection] = useState('tracking');
  const [teachers, setTeachers] = useState([]);

  const [announcements, setAnnouncements] = useState([
    { id:1, title:'Annual Sports Day Prep',    body:'All PE staff to coordinate with class teachers for student participation lists.', time:'Today, 9:00 AM', icon:'🏆', type:'info' },
    { id:2, title:'Board Exam Schedule Out',   body:'Class 10 & 12 exam timetable published. Ensure supervision duty assignments.', time:'Yesterday',      icon:'📋', type:'warn' },
    { id:3, title:'Parent-Teacher Meet — Mar 29', body:'All class teachers must be present. Schedules will be shared by EOD.', time:'Mar 18',         icon:'👨‍👩‍👦', type:'info' },
  ]);

  const [leaveRequests, setLeaveRequests] = useState([
    { id:1, name:'Priya Ramesh', type:'Casual Leave', dates:'Apr 1', status:'pending', initials:'PR', color:'#4f46e5' },
  ]);

  const [toast, setToast] = useState({ show: false, msg: '' });
  const [lastUpdated, setLastUpdated] = useState('');

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
          setTeachers(Array.isArray(data) ? data.map(normaliseTeacher) : []);
          setLastUpdated(new Date().toLocaleTimeString([], {
            hour: 'numeric',
            minute: '2-digit',
            second: '2-digit',
          }));
        }
      } catch (_error) {
        if (!cancelled) {
          setTeachers([]);
        }
      }
    }

    loadTeachers();
    const intervalId = window.setInterval(loadTeachers, 15000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
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

  return (
    <div className="admin-shell">
      <AdminSidebar activeSection={activeSection} onShowSection={setActiveSection} user={user} onLogout={onLogout} />
      <div className="admin-content-wrapper">
        {activeSection === 'tracking' && <TeacherTracking teachers={teachers} lastUpdated={lastUpdated} />}
        {activeSection === 'notices' && <NoticeBoard announcements={announcements} onAddAnnouncement={handleAddAnnouncement} />}
        {activeSection === 'leaves' && <LeaveRequests requests={leaveRequests} onApprove={handleApproveLeave} onReject={handleRejectLeave} />}
      </div>
      
      <div className={`admin-toast ${toast.show ? 'show' : ''}`}>
        {toast.msg}
      </div>
    </div>
  );
}
