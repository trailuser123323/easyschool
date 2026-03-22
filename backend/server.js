import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ── CORS Configuration (Production-Ready) ──
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "http://localhost:3003",
  "http://localhost:3004",
  "http://localhost:3005",
  "https://attendtrack.netlify.app",  // Update with your actual Netlify URL
  /\.app\.github\.dev$/,  // Allow all Codespaces URLs
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.some(allowed => 
      typeof allowed === 'string' ? allowed === origin : allowed.test(origin)
    )) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true
}));

// ── Middleware ──
app.use(express.json());

// ── In-Memory Data Storage ──
let teachers = [
  { id:1, name:'Priya Ramesh',   initials:'PR', subject:'Science',  class:'9A', status:'present', checkin:'8:47 AM', onDuty:true,  absent:2, leave:2, rate:'91%', color:'#4f46e5' },
  { id:2, name:'Amit Sharma',    initials:'AS', subject:'Math',     class:'8B', status:'present', checkin:'8:52 AM', onDuty:true,  absent:1, leave:1, rate:'95%', color:'#0891b2' },
  { id:3, name:'Rekha Nair',     initials:'RN', subject:'English',  class:'10A',status:'leave',   checkin:'–',       onDuty:false, absent:3, leave:4, rate:'85%', color:'#d97706' },
  { id:4, name:'Suresh Pillai',  initials:'SP', subject:'History',  class:'7C', status:'absent',  checkin:'–',       onDuty:false, absent:4, leave:1, rate:'80%', color:'#dc2626' },
  { id:5, name:'Meera Joshi',    initials:'MJ', subject:'Physics',  class:'11B',status:'present', checkin:'8:39 AM', onDuty:true,  absent:0, leave:2, rate:'98%', color:'#059669' },
  { id:6, name:'Kiran Desai',    initials:'KD', subject:'Chemistry',class:'12A',status:'present', checkin:'8:55 AM', onDuty:false, absent:1, leave:3, rate:'93%', color:'#7c3aed' },
  { id:7, name:'Pooja Kulkarni', initials:'PK', subject:'Biology',  class:'9B', status:'absent',  checkin:'–',       onDuty:false, absent:5, leave:2, rate:'78%', color:'#be185d' },
  { id:8, name:'Raj Patil',      initials:'RP', subject:'Geo',      class:'8A', status:'present', checkin:'8:44 AM', onDuty:true,  absent:2, leave:1, rate:'90%', color:'#0891b2' },
];

let announcements = [
  { id:1, title:'Annual Sports Day Prep',    body:'All PE staff to coordinate with class teachers for student participation lists.', time:'Today, 9:00 AM', icon:'🏆', type:'info' },
  { id:2, title:'Board Exam Schedule Out',   body:'Class 10 & 12 exam timetable published. Ensure supervision duty assignments.', time:'Yesterday',      icon:'📋', type:'warn' },
  { id:3, title:'Parent-Teacher Meet — Mar 29', body:'All class teachers must be present. Schedules will be shared by EOD.', time:'Mar 18',         icon:'👨‍👩‍👦', type:'info' },
];

let leaveRequests = [
  { id:1, name:'Rekha Nair',     type:'Casual Leave',  dates:'Mar 21–22', status:'pending',  initials:'RN', color:'#d97706' },
  { id:2, name:'Suresh Pillai',  type:'Sick Leave',    dates:'Mar 21',    status:'pending',  initials:'SP', color:'#dc2626' },
  { id:3, name:'Kiran Desai',    type:'Personal Leave', dates:'Mar 28',   status:'pending',  initials:'KD', color:'#7c3aed' },
  { id:4, name:'Pooja Kulkarni', type:'Emergency Leave',dates:'Mar 20–21',status:'approved', initials:'PK', color:'#be185d' },
  { id:5, name:'Amit Sharma',    type:'Casual Leave',  dates:'Apr 1',     status:'approved', initials:'AS', color:'#0891b2' },
];

let trackingData = [
  { time:'8:47 AM', name:'Priya Ramesh',  coords:'18.5204°N, 73.8567°E', ok:true },
  { time:'8:52 AM', name:'Amit Sharma',   coords:'18.5201°N, 73.8561°E', ok:true },
  { time:'8:55 AM', name:'Kiran Desai',   coords:'18.5199°N, 73.8570°E', ok:true },
  { time:'9:47 AM', name:'Priya Ramesh',  coords:'18.5204°N, 73.8567°E', ok:true },
  { time:'9:47 AM', name:'Meera Joshi',   coords:'18.5210°N, 73.8555°E', ok:true },
  { time:'10:47 AM',name:'Amit Sharma',   coords:'–',                     ok:false },
];

// ── In-Memory User Storage (for testing) ──
let users = [
  { id: 1, name: 'Admin User', email: 'admin@gmail.com', password: '1234', role: 'admin' },
  { id: 2, name: 'Teacher User', email: 'teacher1@gmail.com', password: '12345', role: 'teacher' }
];

// ── Routes ──

// Register
app.post('/api/auth/register', (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'All fields required' });
    }

    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const newUser = {
      id: users.length + 1,
      name,
      email,
      password,
      role
    };
    users.push(newUser);

    res.json({ message: 'User registered successfully', user: newUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Simple token (in production, use JWT)
    const token = `token_${user.id}_${Date.now()}`;

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── ADMIN APIs ──

// Get All Teachers (Tracking)
app.get('/api/teachers', (req, res) => {
  try {
    res.json({ teachers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Tracking Data (Real-time)
app.get('/api/tracking', (req, res) => {
  try {
    res.json({ trackingData, timestamp: new Date() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get All Announcements
app.get('/api/announcements', (req, res) => {
  try {
    res.json({ announcements });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Post New Announcement
app.post('/api/announcements', (req, res) => {
  try {
    const { title, body } = req.body;
    if (!title || !body) {
      return res.status(400).json({ error: 'Title and body required' });
    }
    const newAnnouncement = {
      id: announcements.length + 1,
      title,
      body,
      time: 'Just now',
      icon: '📢',
      type: 'info'
    };
    announcements.unshift(newAnnouncement);
    res.json({ message: 'Announcement posted', announcement: newAnnouncement });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get All Leave Requests
app.get('/api/leave-requests', (req, res) => {
  try {
    res.json({ leaveRequests });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Approve Leave Request
app.post('/api/leave-requests/:id/approve', (req, res) => {
  try {
    const { id } = req.params;
    const request = leaveRequests.find(r => r.id === parseInt(id));
    if (!request) {
      return res.status(404).json({ error: 'Leave request not found' });
    }
    request.status = 'approved';
    res.json({ message: 'Leave request approved', request });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reject Leave Request
app.post('/api/leave-requests/:id/reject', (req, res) => {
  try {
    const { id } = req.params;
    const request = leaveRequests.find(r => r.id === parseInt(id));
    if (!request) {
      return res.status(404).json({ error: 'Leave request not found' });
    }
    request.status = 'rejected';
    res.json({ message: 'Leave request rejected', request });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Teacher Status
app.post('/api/teachers/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status, checkin } = req.body;
    const teacher = teachers.find(t => t.id === parseInt(id));
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }
    if (status) teacher.status = status;
    if (checkin) teacher.checkin = checkin;
    res.json({ message: 'Teacher status updated', teacher });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Root Route
app.get('/', (req, res) => {
  res.json({ message: 'Backend is running!', status: 'connected' });
});

// Test Route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is running!' });
});

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

// ── Start Server ──
app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
  console.log(`✅ CORS enabled for http://localhost:3000`);
  console.log(`📝 Demo accounts:`);
  console.log(`   Admin: admin@gmail.com / 1234`);
  console.log(`   Teacher: teacher1@gmail.com / 12345`);
});
