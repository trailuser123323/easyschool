import { useState } from "react";
import { useNavigate } from "react-router-dom";
import './AdminDashboard.css';
import AdminSidebar from './components/AdminSidebar';
import TeacherTracking from './components/TeacherTracking';
import NoticeBoard from './components/NoticeBoard';
import LeaveRequests from './components/LeaveRequests';

export default function AdminDashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('tracking');
  const [teachers, setTeachers] = useState([
    { id:1, name:'Priya Ramesh',   initials:'PR', subject:'Science',  class:'9A', status:'present', checkin:'8:47 AM', onDuty:true,  absent:2, leave:2, rate:'91%', color:'#4f46e5' },
    { id:2, name:'Amit Sharma',    initials:'AS', subject:'Math',     class:'8B', status:'present', checkin:'8:52 AM', onDuty:true,  absent:1, leave:1, rate:'95%', color:'#0891b2' },
    { id:3, name:'Rekha Nair',     initials:'RN', subject:'English',  class:'10A',status:'leave',   checkin:'–',       onDuty:false, absent:3, leave:4, rate:'85%', color:'#d97706' },
    { id:4, name:'Suresh Pillai',  initials:'SP', subject:'History',  class:'7C', status:'absent',  checkin:'–',       onDuty:false, absent:4, leave:1, rate:'80%', color:'#dc2626' },
    { id:5, name:'Meera Joshi',    initials:'MJ', subject:'Physics',  class:'11B',status:'present', checkin:'8:39 AM', onDuty:true,  absent:0, leave:2, rate:'98%', color:'#059669' },
    { id:6, name:'Kiran Desai',    initials:'KD', subject:'Chemistry',class:'12A',status:'present', checkin:'8:55 AM', onDuty:false, absent:1, leave:3, rate:'93%', color:'#7c3aed' },
    { id:7, name:'Pooja Kulkarni', initials:'PK', subject:'Biology',  class:'9B', status:'absent',  checkin:'–',       onDuty:false, absent:5, leave:2, rate:'78%', color:'#be185d' },
    { id:8, name:'Raj Patil',      initials:'RP', subject:'Geo',      class:'8A', status:'present', checkin:'8:44 AM', onDuty:true,  absent:2, leave:1, rate:'90%', color:'#0891b2' },
  ]);

  const [announcements, setAnnouncements] = useState([
    { id:1, title:'Annual Sports Day Prep',    body:'All PE staff to coordinate with class teachers for student participation lists.', time:'Today, 9:00 AM', icon:'🏆', type:'info' },
    { id:2, title:'Board Exam Schedule Out',   body:'Class 10 & 12 exam timetable published. Ensure supervision duty assignments.', time:'Yesterday',      icon:'📋', type:'warn' },
    { id:3, title:'Parent-Teacher Meet — Mar 29', body:'All class teachers must be present. Schedules will be shared by EOD.', time:'Mar 18',         icon:'👨‍👩‍👦', type:'info' },
  ]);

  const [leaveRequests, setLeaveRequests] = useState([
    { id:1, name:'Rekha Nair',     type:'Casual Leave',  dates:'Mar 21–22', status:'pending',  initials:'RN', color:'#d97706' },
    { id:2, name:'Suresh Pillai',  type:'Sick Leave',    dates:'Mar 21',    status:'pending',  initials:'SP', color:'#dc2626' },
    { id:3, name:'Kiran Desai',    type:'Personal Leave', dates:'Mar 28',   status:'pending',  initials:'KD', color:'#7c3aed' },
    { id:4, name:'Pooja Kulkarni', type:'Emergency Leave',dates:'Mar 20–21',status:'approved', initials:'PK', color:'#be185d' },
    { id:5, name:'Amit Sharma',    type:'Casual Leave',  dates:'Apr 1',     status:'approved', initials:'AS', color:'#0891b2' },
  ]);

  const [toast, setToast] = useState({ show: false, msg: '' });

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
