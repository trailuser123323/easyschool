import { useEffect, useState } from "react";
import './AdminDashboard.css';
import AdminSidebar from './components/AdminSidebar';
import TeacherTracking from './components/TeacherTracking';
import NoticeBoard from './components/NoticeBoard';
import LeaveRequests from './components/LeaveRequests';
import { apiUrl } from './api';

const FALLBACK_TEACHERS = [
  { id:1, name:'Priya Ramesh',   initials:'PR', subject:'Science',  class:'9A', status:'present', checkin:'8:47 AM', onDuty:true,  absent:2, leave:2, rate:'91%', color:'#4f46e5', loginPhoto:'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20viewBox%3D%220%200%20480%20320%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22bg%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%221%22%20y2%3D%221%22%3E%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%23eff6ff%22/%3E%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%23dbeafe%22/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect%20width%3D%22480%22%20height%3D%22320%22%20fill%3D%22url(%23bg)%22/%3E%3Crect%20x%3D%2228%22%20y%3D%2228%22%20width%3D%22424%22%20height%3D%22264%22%20rx%3D%2224%22%20fill%3D%22%23ffffff%22%20stroke%3D%22%23cbd5e1%22/%3E%3Ccircle%20cx%3D%22142%22%20cy%3D%22132%22%20r%3D%2254%22%20fill%3D%22%234f46e5%22%20opacity%3D%220.12%22/%3E%3Ccircle%20cx%3D%22142%22%20cy%3D%22118%22%20r%3D%2228%22%20fill%3D%22%234f46e5%22%20opacity%3D%220.88%22/%3E%3Cpath%20d%3D%22M94%20188c12-28%2035-42%2048-42s36%2014%2048%2042%22%20fill%3D%22%234f46e5%22%20opacity%3D%220.88%22/%3E%3Ctext%20x%3D%22222%22%20y%3D%22104%22%20font-size%3D%2224%22%20font-family%3D%22Arial%2C%20sans-serif%22%20fill%3D%22%230f172a%22%20font-weight%3D%22700%22%3EPriya%20Ramesh%3C/text%3E%3Ctext%20x%3D%22222%22%20y%3D%22142%22%20font-size%3D%2218%22%20font-family%3D%22Arial%2C%20sans-serif%22%20fill%3D%22%23475569%22%3EScience%20Teacher%20%E2%80%A2%20Class%209A%3C/text%3E%3Ctext%20x%3D%22222%22%20y%3D%22178%22%20font-size%3D%2216%22%20font-family%3D%22Arial%2C%20sans-serif%22%20fill%3D%22%2364758b%22%3ECheck-in%20verified%20at%20Principal%20Office%3C/text%3E%3Crect%20x%3D%22222%22%20y%3D%22202%22%20width%3D%22146%22%20height%3D%2236%22%20rx%3D%2218%22%20fill%3D%22%23dcfce7%22/%3E%3Ctext%20x%3D%22295%22%20y%3D%22225%22%20text-anchor%3D%22middle%22%20font-size%3D%2215%22%20font-family%3D%22Arial%2C%20sans-serif%22%20fill%3D%22%23166534%22%20font-weight%3D%22700%22%3EChecked%20in%3C/text%3E%3Ctext%20x%3D%22222%22%20y%3D%22264%22%20font-size%3D%2214%22%20font-family%3D%22Arial%2C%20sans-serif%22%20fill%3D%22%2394a3b8%22%3EDemo%20teacher%20photo%3C/text%3E%3C/svg%3E' },
];

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
    onDuty: Boolean(teacher.onDuty),
    absent: teacher.absent ?? 0,
    leave: teacher.leave ?? 0,
    rate: teacher.rate || '0%',
    color: teacher.color || '#4f46e5',
    lastLogin: teacher.lastLogin || null,
    loginPhoto: teacher.loginPhoto || '',
  };
}

export default function AdminDashboard({ user, onLogout }) {
  const [activeSection, setActiveSection] = useState('tracking');
  const [teachers, setTeachers] = useState(FALLBACK_TEACHERS);

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

    fetch(apiUrl('/api/auth/teachers'))
      .then(async (response) => {
        const data = await response.json().catch(() => []);
        if (!response.ok) {
          throw new Error(data.message || 'Unable to load teachers.');
        }

        if (!cancelled && Array.isArray(data) && data.length > 0) {
          setTeachers(data.map(normaliseTeacher));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setTeachers(FALLBACK_TEACHERS);
        }
      });

    return () => {
      cancelled = true;
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
        {activeSection === 'tracking' && <TeacherTracking teachers={teachers} />}
        {activeSection === 'notices' && <NoticeBoard announcements={announcements} onAddAnnouncement={handleAddAnnouncement} />}
        {activeSection === 'leaves' && <LeaveRequests requests={leaveRequests} onApprove={handleApproveLeave} onReject={handleRejectLeave} />}
      </div>
      
      <div className={`admin-toast ${toast.show ? 'show' : ''}`}>
        {toast.msg}
      </div>
    </div>
  );
}
