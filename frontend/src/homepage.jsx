import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import TeacherDashboard from "./TeacherDashboard";
import AdminDashboard from "./adashboard";

export default function Homepage() {
  const navigate = useNavigate();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [showDemo, setShowDemo] = useState(false);
  const [demoRole, setDemoRole] = useState(null);
  const [showRegister, setShowRegister] = useState(false);
  const [copied, setCopied] = useState("");

  useEffect(() => {
    const handleMouse = (e) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", handleMouse);
    return () => window.removeEventListener("mousemove", handleMouse);
  }, []);

  useEffect(() => {
    document.body.style.overflow = (showDemo || showRegister) ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [showDemo, showRegister]);

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(""), 2000);
  };

  const demoTeacher = { name:"Priya Ramesh", initials:"PR", email:"teacher@demo.com", subject:"Science", class:"9A", role:"teacher" };
  const demoAdmin   = { name:"Admin Demo", initials:"A", email:"admin@demo.com", role:"admin" };

  const features = [
    { icon:"⏱", title:"Real-Time Check-In",  desc:"GPS-verified attendance with photo capture. Know exactly when and where teachers arrive." },
    { icon:"📊", title:"Live Analytics",      desc:"Instant dashboards showing present, late, absent counts. Monthly trends at a glance." },
    { icon:"📅", title:"Attendance Calendar", desc:"Visual calendar with colour-coded days. On-time, late, absent — all in one view." },
    { icon:"📝", title:"Leave Management",    desc:"Teachers apply for leave digitally. Admin approves or rejects with one click." },
    { icon:"📢", title:"Announcements",       desc:"Post urgent notices or info directly to all teachers. Priority-coded and timestamped." },
    { icon:"🟢", title:"On-Duty Tracking",    desc:"Track which teachers are actively on duty with hourly location pings." },
  ];

  const stats = [
    { value:"100%", label:"Digital" },
    { value:"0",    label:"Paperwork" },
    { value:"24/7", label:"Access" },
    { value:"∞",    label:"Records" },
  ];

  return (
    <div style={{ background:"#050810", color:"#e2e8f0", fontFamily:"'DM Sans', sans-serif", minHeight:"100vh", overflowX:"hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&family=Syne:wght@700;800&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
        @keyframes float   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes pulse   { 0%,100%{opacity:.4;transform:scale(1)} 50%{opacity:.8;transform:scale(1.05)} }
        @keyframes shimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
        @keyframes glow    { 0%,100%{box-shadow:0 0 20px #3b82f640} 50%{box-shadow:0 0 60px #3b82f680} }
        @keyframes modalIn { from{opacity:0;transform:scale(.95)} to{opacity:1;transform:scale(1)} }
        @keyframes slideUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }

        .fade-up-1{opacity:0;animation:fadeUp .7s ease .1s forwards;}
        .fade-up-2{opacity:0;animation:fadeUp .7s ease .25s forwards;}
        .fade-up-3{opacity:0;animation:fadeUp .7s ease .4s forwards;}
        .fade-up-4{opacity:0;animation:fadeUp .7s ease .55s forwards;}

        .gradient-text{background:linear-gradient(135deg,#60a5fa,#a78bfa,#f472b6);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer 4s linear infinite;}

        .hero-btn{display:inline-flex;align-items:center;gap:10px;padding:16px 36px;border-radius:14px;font-family:'DM Sans',sans-serif;font-size:15px;font-weight:600;cursor:pointer;border:none;transition:all .3s;}
        .hero-btn-primary{background:linear-gradient(135deg,#2563eb,#7c3aed);color:#fff;animation:glow 3s ease-in-out infinite;}
        .hero-btn-primary:hover{transform:translateY(-2px) scale(1.02);filter:brightness(1.1);}
        .hero-btn-secondary{background:transparent;color:#94a3b8;border:1px solid #1e293b;}
        .hero-btn-secondary:hover{background:#0f172a;color:#e2e8f0;border-color:#334155;transform:translateY(-2px);}
        .hero-btn-green{background:linear-gradient(135deg,#059669,#047857);color:#fff;}
        .hero-btn-green:hover{transform:translateY(-2px) scale(1.02);filter:brightness(1.1);}

        .feature-card{background:#0a0f1a;border:1px solid #1e293b;border-radius:20px;padding:28px;transition:all .3s;position:relative;overflow:hidden;}
        .feature-card::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,#2563eb08,#7c3aed08);opacity:0;transition:opacity .3s;}
        .feature-card:hover{border-color:#2563eb40;transform:translateY(-4px);box-shadow:0 20px 60px #2563eb10;}
        .feature-card:hover::before{opacity:1;}

        .stat-item{text-align:center;}
        .stat-value{font-family:'Syne',sans-serif;font-size:48px;font-weight:800;background:linear-gradient(135deg,#60a5fa,#a78bfa);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
        .stat-label{color:#475569;font-size:13px;margin-top:4px;letter-spacing:1px;text-transform:uppercase;}
        .nav-link{color:#64748b;text-decoration:none;font-size:14px;transition:color .2s;}
        .nav-link:hover{color:#e2e8f0;}
        .orb{position:absolute;border-radius:50%;filter:blur(80px);pointer-events:none;}
        .mockup-bar{height:8px;border-radius:99px;background:#1e293b;overflow:hidden;}
        .mockup-bar-fill{height:100%;border-radius:99px;}
        ::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-track{background:#050810;}::-webkit-scrollbar-thumb{background:#1e293b;border-radius:2px;}

        .contact-card{background:#0f172a;border:1px solid #1e293b;border-radius:16px;padding:20px 24px;display:flex;align-items:center;gap:16px;transition:all .2s;cursor:pointer;}
        .contact-card:hover{border-color:#6366f150;transform:translateY(-2px);box-shadow:0 10px 40px rgba(99,102,241,.1);}

        .demo-overlay{position:fixed;inset:0;background:rgba(0,0,0,.85);backdrop-filter:blur(10px);z-index:1000;display:flex;flex-direction:column;align-items:center;justify-content:center;}
        .demo-picker{animation:slideUp .4s ease;display:flex;flex-direction:column;align-items:center;gap:32px;}
        .demo-role-card{background:#0d1117;border:1px solid #1e293b;border-radius:20px;padding:36px 48px;cursor:pointer;transition:all .25s;text-align:center;min-width:220px;}
        .demo-role-card:hover{transform:translateY(-4px);border-color:#6366f1;box-shadow:0 20px 60px rgba(99,102,241,.2);}
        .demo-frame{animation:modalIn .35s ease;background:#0b0f1a;border-radius:16px;overflow:hidden;width:95vw;max-width:1300px;height:88vh;display:flex;flex-direction:column;}
        .demo-topbar{background:#0d1117;border-bottom:1px solid #1e293b;padding:10px 20px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;}
        .demo-content{flex:1;overflow:auto;}
      `}</style>

      {/* ── REGISTER MODAL ── */}
      {showRegister && (
        <div className="demo-overlay" onClick={(e) => { if(e.target.classList.contains("demo-overlay")) setShowRegister(false); }}>
          <div style={{ animation:"modalIn .35s ease", background:"#0d1117", border:"1px solid #1e293b", borderRadius:20, padding:40, width:480, maxWidth:"92vw" }}>
            
            {/* Header */}
            <div style={{ textAlign:"center", marginBottom:32 }}>
              <div style={{ fontSize:48, marginBottom:12 }}>🏫</div>
              <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:26, fontWeight:800, marginBottom:8 }}>
                Register Your School
              </h2>
              <p style={{ color:"#64748b", fontSize:14, lineHeight:1.6 }}>
                Get in touch with us to set up AttendTrack for your school. We'll have you up and running within 24 hours!
              </p>
            </div>

            {/* Contact cards */}
            <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:28 }}>
              
              {/* WhatsApp */}
              <a href="https://wa.me/919075501269" target="_blank" rel="noopener noreferrer" style={{ textDecoration:"none" }}>
                <div className="contact-card" style={{ borderColor:"#166534" }}>
                  <div style={{ width:48, height:48, borderRadius:14, background:"#052e16", border:"1px solid #166534", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, flexShrink:0 }}>💬</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, color:"#64748b", marginBottom:3 }}>WhatsApp Us</div>
                    <div style={{ fontSize:16, fontWeight:700, color:"#4ade80" }}>+91 90755 01269</div>
                    <div style={{ fontSize:11, color:"#166534", marginTop:2 }}>Tap to open WhatsApp →</div>
                  </div>
                  <div style={{ fontSize:20 }}>→</div>
                </div>
              </a>

              {/* Phone call */}
              <a href="tel:+919075501269" style={{ textDecoration:"none" }}>
                <div className="contact-card">
                  <div style={{ width:48, height:48, borderRadius:14, background:"#0b0f1a", border:"1px solid #1e293b", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, flexShrink:0 }}>📞</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, color:"#64748b", marginBottom:3 }}>Call Us</div>
                    <div style={{ fontSize:16, fontWeight:700, color:"#e2e8f0" }}>+91 90755 01269</div>
                    <div style={{ fontSize:11, color:"#475569", marginTop:2 }}>Mon–Sat, 9 AM – 6 PM</div>
                  </div>
                  <div style={{ fontSize:20, color:"#475569" }}>→</div>
                </div>
              </a>

              {/* Email */}
              <a href="mailto:thoratganesh224@gmail.com?subject=School Registration — AttendTrack&body=Hi, I'd like to register my school on AttendTrack.%0A%0ASchool Name: %0AAdmin Name: %0ACity: %0ANumber of Teachers: " style={{ textDecoration:"none" }}>
                <div className="contact-card" style={{ borderColor:"#1e3a5f" }}>
                  <div style={{ width:48, height:48, borderRadius:14, background:"#0c1a2e", border:"1px solid #1e3a5f", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, flexShrink:0 }}>✉️</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, color:"#64748b", marginBottom:3 }}>Email Us</div>
                    <div style={{ fontSize:15, fontWeight:700, color:"#60a5fa" }}>thoratganesh224@gmail.com</div>
                    <div style={{ fontSize:11, color:"#3b82f6", marginTop:2 }}>Tap to send pre-filled email →</div>
                  </div>
                  <div style={{ fontSize:20, color:"#3b82f6" }}>→</div>
                </div>
              </a>

              {/* Copy email */}
              <div className="contact-card" onClick={() => copyToClipboard("thoratganesh224@gmail.com", "email")} style={{ cursor:"pointer" }}>
                <div style={{ width:48, height:48, borderRadius:14, background:"#0b0f1a", border:"1px solid #1e293b", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>📋</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, color:"#64748b", marginBottom:3 }}>Copy Email Address</div>
                  <div style={{ fontSize:14, fontWeight:600, color:"#94a3b8", fontFamily:"monospace" }}>thoratganesh224@gmail.com</div>
                </div>
                <div style={{ fontSize:12, color: copied==="email"?"#22c55e":"#475569", fontWeight:600 }}>
                  {copied==="email" ? "✓ Copied!" : "Copy"}
                </div>
              </div>
            </div>

            {/* What to include note */}
            <div style={{ background:"#0b0f1a", border:"1px solid #1e293b", borderRadius:12, padding:16, marginBottom:24 }}>
              <div style={{ fontSize:12, color:"#64748b", marginBottom:8, fontWeight:600, letterSpacing:.5 }}>📝 INCLUDE IN YOUR MESSAGE</div>
              {["School name & city", "Admin name & contact", "Number of teachers", "Preferred start date"].map((item, i) => (
                <div key={i} style={{ fontSize:13, color:"#94a3b8", marginBottom:5, display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ color:"#22c55e", fontSize:11 }}>✓</span> {item}
                </div>
              ))}
            </div>

            <button onClick={() => setShowRegister(false)} style={{ width:"100%", background:"#1e293b", border:"none", borderRadius:12, padding:"12px", fontSize:14, fontWeight:600, color:"#94a3b8", cursor:"pointer" }}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* ── DEMO MODAL ── */}
      {showDemo && (
        <div className="demo-overlay" onClick={(e) => { if(e.target.classList.contains("demo-overlay")) { setShowDemo(false); setDemoRole(null); }}}>
          {!demoRole && (
            <div className="demo-picker">
              <div style={{ textAlign:"center" }}>
                <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:32, fontWeight:800, marginBottom:8 }}>
                  Try the <span className="gradient-text">Live Demo</span>
                </h2>
                <p style={{ color:"#64748b", fontSize:15 }}>Choose a role to explore the dashboard</p>
              </div>
              <div style={{ display:"flex", gap:20, flexWrap:"wrap", justifyContent:"center" }}>
                <div className="demo-role-card" onClick={() => setDemoRole("teacher")}>
                  <div style={{ fontSize:48, marginBottom:16 }}>👩‍🏫</div>
                  <div style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:800, marginBottom:8 }}>Teacher View</div>
                  <div style={{ color:"#64748b", fontSize:13, lineHeight:1.6 }}>Check-in, timetable,<br/>leave & attendance</div>
                  <div style={{ marginTop:20, background:"linear-gradient(135deg,#6366f1,#8b5cf6)", borderRadius:10, padding:"10px 24px", fontSize:13, fontWeight:700, color:"#fff", display:"inline-block" }}>
                    View as Teacher →
                  </div>
                </div>
                <div className="demo-role-card" onClick={() => setDemoRole("admin")}>
                  <div style={{ fontSize:48, marginBottom:16 }}>🏫</div>
                  <div style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:800, marginBottom:8 }}>Admin View</div>
                  <div style={{ color:"#64748b", fontSize:13, lineHeight:1.6 }}>Track staff, approve leaves,<br/>post announcements</div>
                  <div style={{ marginTop:20, background:"linear-gradient(135deg,#f59e0b,#d97706)", borderRadius:10, padding:"10px 24px", fontSize:13, fontWeight:700, color:"#000", display:"inline-block" }}>
                    View as Admin →
                  </div>
                </div>
              </div>
              <button onClick={() => setShowDemo(false)} style={{ background:"none", border:"1px solid #1e293b", borderRadius:10, padding:"10px 24px", color:"#64748b", cursor:"pointer", fontSize:13 }}>
                ✕ Close
              </button>
            </div>
          )}
          {demoRole && (
            <div className="demo-frame">
              <div className="demo-topbar">
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{ width:8, height:8, borderRadius:"50%", background:"#22c55e", animation:"pulse 2s infinite" }} />
                  <span style={{ fontSize:13, fontWeight:600 }}>
                    {demoRole==="teacher" ? "👩‍🏫 Teacher Dashboard — Demo" : "🏫 Admin Dashboard — Demo"}
                  </span>
                  <span style={{ fontSize:11, color:"#64748b", background:"#1e293b", padding:"2px 8px", borderRadius:99 }}>Preview</span>
                </div>
                <div style={{ display:"flex", gap:10 }}>
                  <button onClick={() => setDemoRole(null)} style={{ background:"#1e293b", border:"none", borderRadius:8, padding:"6px 14px", color:"#94a3b8", cursor:"pointer", fontSize:12 }}>← Switch Role</button>
                  <button onClick={() => { setShowDemo(false); setDemoRole(null); navigate("/login"); }} style={{ background:"linear-gradient(135deg,#6366f1,#8b5cf6)", border:"none", borderRadius:8, padding:"6px 16px", color:"#fff", cursor:"pointer", fontSize:12, fontWeight:700 }}>Login to Use →</button>
                  <button onClick={() => { setShowDemo(false); setDemoRole(null); }} style={{ background:"#450a0a", border:"none", borderRadius:8, padding:"6px 12px", color:"#ef4444", cursor:"pointer", fontSize:13 }}>✕</button>
                </div>
              </div>
              <div className="demo-content">
                {demoRole==="teacher"
                  ? <TeacherDashboard teacher={demoTeacher} onLogout={() => { setShowDemo(false); setDemoRole(null); }} />
                  : <AdminDashboard   user={demoAdmin}      onLogout={() => { setShowDemo(false); setDemoRole(null); }} />
                }
              </div>
            </div>
          )}
        </div>
      )}

      {/* NAVBAR */}
      <nav style={{ position:"fixed", top:0, left:0, right:0, zIndex:100, padding:"16px 40px", display:"flex", justifyContent:"space-between", alignItems:"center", background:"rgba(5,8,16,0.8)", backdropFilter:"blur(20px)", borderBottom:"1px solid #0f172a" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
          <div style={{ width:"32px", height:"32px", borderRadius:"10px", background:"linear-gradient(135deg,#2563eb,#7c3aed)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"16px" }}>✦</div>
          <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:"16px" }}>AttendTrack</span>
        </div>
        <div style={{ display:"flex", gap:"32px", alignItems:"center" }}>
          <a href="#features" className="nav-link">Features</a>
          <a href="#stats" className="nav-link">About</a>
          <button className="hero-btn" style={{ padding:"10px 22px", fontSize:"13px", background:"linear-gradient(135deg,#059669,#047857)", color:"#fff", borderRadius:12 }} onClick={() => setShowRegister(true)}>
            Register School 🏫
          </button>
          <button className="hero-btn hero-btn-primary" style={{ padding:"10px 22px", fontSize:"13px" }} onClick={() => navigate("/login")}>Login →</button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", textAlign:"center", padding:"120px 24px 80px", position:"relative", overflow:"hidden" }}>
        <div className="orb" style={{ width:"600px", height:"600px", background:"#2563eb15", top:"-100px", left:"-200px", animation:"pulse 8s ease-in-out infinite" }} />
        <div className="orb" style={{ width:"500px", height:"500px", background:"#7c3aed15", bottom:"-100px", right:"-150px", animation:"pulse 10s ease-in-out infinite 2s" }} />
        <div className="orb" style={{ width:"300px", height:"300px", background:"#f472b615", top:"50%", left:"50%", transform:"translate(-50%,-50%)", animation:"pulse 6s ease-in-out infinite 1s" }} />
        <div style={{ position:"fixed", width:"400px", height:"400px", borderRadius:"50%", background:"radial-gradient(circle,#2563eb08,transparent)", left:mousePos.x-200, top:mousePos.y-200, pointerEvents:"none", transition:"left .3s, top .3s", zIndex:0 }} />

        <div style={{ position:"relative", zIndex:1, maxWidth:"800px" }}>
          <div className="fade-up-1" style={{ display:"inline-flex", alignItems:"center", gap:"8px", background:"#0f172a", border:"1px solid #1e293b", borderRadius:"99px", padding:"6px 16px", fontSize:"12px", color:"#64748b", marginBottom:"28px" }}>
            <span style={{ width:"6px", height:"6px", borderRadius:"50%", background:"#4ade80", display:"inline-block", animation:"pulse 2s ease-in-out infinite" }} />
            School Attendance Management System
          </div>
          <h1 className="fade-up-2" style={{ fontFamily:"'Syne',sans-serif", fontSize:"clamp(40px,8vw,80px)", fontWeight:800, lineHeight:1.05, marginBottom:"24px" }}>
            Track Attendance<br /><span className="gradient-text">The Smart Way</span>
          </h1>
          <p className="fade-up-3" style={{ fontSize:"18px", color:"#64748b", lineHeight:1.7, maxWidth:"560px", margin:"0 auto 40px" }}>
            GPS-verified check-ins, real-time dashboards, leave management, and announcements — all in one place for modern schools.
          </p>
          <div className="fade-up-4" style={{ display:"flex", gap:"14px", justifyContent:"center", flexWrap:"wrap" }}>
            <button className="hero-btn hero-btn-green" onClick={() => setShowRegister(true)}>Register New School 🏫</button>
            <button className="hero-btn hero-btn-secondary" onClick={() => setShowDemo(true)}>Watch Demo ▶</button>
          </div>
          <p className="fade-up-4" style={{ marginTop:"32px", color:"#334155", fontSize:"12px" }}>
            Quick setup · Works on any device · Free for small schools
          </p>
        </div>

        {/* Mockup */}
        <div style={{ position:"relative", zIndex:1, marginTop:"80px", width:"100%", maxWidth:"800px", animation:"float 6s ease-in-out infinite" }}>
          <div style={{ background:"#0a0f1a", border:"1px solid #1e293b", borderRadius:"20px", overflow:"hidden", boxShadow:"0 40px 120px #00000080" }}>
            <div style={{ background:"#0f172a", padding:"12px 20px", display:"flex", alignItems:"center", gap:"8px", borderBottom:"1px solid #1e293b" }}>
              <div style={{ width:"10px", height:"10px", borderRadius:"50%", background:"#ef4444" }} />
              <div style={{ width:"10px", height:"10px", borderRadius:"50%", background:"#f59e0b" }} />
              <div style={{ width:"10px", height:"10px", borderRadius:"50%", background:"#22c55e" }} />
              <div style={{ flex:1, background:"#1e293b", borderRadius:"6px", height:"24px", marginLeft:"8px", display:"flex", alignItems:"center", paddingLeft:"10px" }}>
                <span style={{ color:"#334155", fontSize:"11px" }}>attendtrack.school.app</span>
              </div>
            </div>
            <div style={{ padding:"24px", display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"14px" }}>
              {[{label:"Present",value:"24",color:"#4ade80"},{label:"Late",value:"3",color:"#fb923c"},{label:"Absent",value:"1",color:"#f87171"},{label:"Rate",value:"89%",color:"#60a5fa"}].map(s=>(
                <div key={s.label} style={{ background:"#0f172a", borderRadius:"12px", padding:"16px", border:"1px solid #1e293b" }}>
                  <div style={{ fontSize:"22px", fontFamily:"'Syne',sans-serif", fontWeight:700, color:s.color }}>{s.value}</div>
                  <div style={{ fontSize:"11px", color:"#475569", marginTop:"2px" }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{ padding:"0 24px 24px", display:"flex", flexDirection:"column", gap:"10px" }}>
              {[{name:"Rahul Sir",subject:"Mathematics",time:"8:55 AM",status:"On Time",pct:92},{name:"Priya Ma'am",subject:"Science",time:"9:12 AM",status:"Late",pct:78},{name:"Ganesh Sir",subject:"English",time:"—",status:"Absent",pct:65}].map((t,i)=>(
                <div key={i} style={{ background:"#0f172a", borderRadius:"10px", padding:"12px 16px", border:"1px solid #1e293b", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div style={{ display:"flex", gap:"12px", alignItems:"center" }}>
                    <div style={{ width:"32px", height:"32px", borderRadius:"10px", background:"linear-gradient(135deg,#2563eb,#7c3aed)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"14px", fontWeight:700 }}>{t.name.charAt(0)}</div>
                    <div>
                      <div style={{ fontSize:"13px", fontWeight:500 }}>{t.name}</div>
                      <div style={{ fontSize:"11px", color:"#475569" }}>{t.subject}</div>
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:"16px", alignItems:"center" }}>
                    <span style={{ fontSize:"12px", color:"#64748b" }}>{t.time}</span>
                    <span style={{ fontSize:"11px", fontWeight:600, padding:"3px 10px", borderRadius:"99px", background:t.status==="On Time"?"#14532d":t.status==="Late"?"#451a03":"#450a0a", color:t.status==="On Time"?"#4ade80":t.status==="Late"?"#fb923c":"#f87171" }}>{t.status}</span>
                    <div style={{ width:"60px" }}>
                      <div style={{ fontSize:"10px", color:"#334155", marginBottom:"3px", textAlign:"right" }}>{t.pct}%</div>
                      <div className="mockup-bar"><div className="mockup-bar-fill" style={{ width:`${t.pct}%`, background:t.pct>=75?"#16a34a":"#c2410c" }}/></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ position:"absolute", bottom:"-30px", left:"10%", right:"10%", height:"60px", background:"linear-gradient(135deg,#2563eb,#7c3aed)", filter:"blur(40px)", opacity:0.3, borderRadius:"50%" }} />
        </div>
      </section>

      {/* STATS */}
      <section id="stats" style={{ padding:"80px 40px", borderTop:"1px solid #0f172a", borderBottom:"1px solid #0f172a", background:"#080c14" }}>
        <div style={{ maxWidth:"800px", margin:"0 auto", display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"40px" }}>
          {stats.map((s,i)=>(
            <div key={i} className="stat-item">
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ padding:"100px 40px", maxWidth:"1100px", margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:"64px" }}>
          <p style={{ color:"#475569", fontSize:"12px", letterSpacing:"2px", textTransform:"uppercase", marginBottom:"12px" }}>Everything you need</p>
          <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:"clamp(28px,5vw,48px)", fontWeight:800 }}>Built for <span className="gradient-text">Modern Schools</span></h2>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))", gap:"20px" }}>
          {features.map((f,i)=>(
            <div key={i} className="feature-card">
              <div style={{ fontSize:"32px", marginBottom:"16px" }}>{f.icon}</div>
              <h3 style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:"18px", marginBottom:"10px" }}>{f.title}</h3>
              <p style={{ color:"#475569", fontSize:"14px", lineHeight:1.7 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding:"100px 40px", textAlign:"center", position:"relative", overflow:"hidden" }}>
        <div className="orb" style={{ width:"500px", height:"500px", background:"#2563eb12", top:"50%", left:"50%", transform:"translate(-50%,-50%)" }} />
        <div style={{ position:"relative", zIndex:1 }}>
          <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:"clamp(28px,5vw,56px)", fontWeight:800, marginBottom:"20px" }}>
            Ready to go <span className="gradient-text">paperless?</span>
          </h2>
          <p style={{ color:"#64748b", fontSize:"16px", marginBottom:"40px" }}>Get your school set up in under 24 hours.</p>
          <div style={{ display:"flex", gap:14, justifyContent:"center", flexWrap:"wrap" }}>
            <button className="hero-btn hero-btn-green" style={{ fontSize:"16px", padding:"18px 48px" }} onClick={() => setShowRegister(true)}>Register Your School 🏫</button>
            <button className="hero-btn hero-btn-secondary" style={{ fontSize:"16px", padding:"18px 48px" }} onClick={() => setShowDemo(true)}>Try Demo ▶</button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop:"1px solid #0f172a", padding:"32px 40px", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:"16px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
          <div style={{ width:"28px", height:"28px", borderRadius:"8px", background:"linear-gradient(135deg,#2563eb,#7c3aed)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"14px" }}>✦</div>
          <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:"14px" }}>AttendTrack</span>
        </div>
        <div style={{ display:"flex", gap:24, alignItems:"center" }}>
          <span style={{ fontSize:12, color:"#475569" }}>📞 +91 90755 01269</span>
          <span style={{ fontSize:12, color:"#475569" }}>✉️ thoratganesh224@gmail.com</span>
        </div>
        <p style={{ color:"#334155", fontSize:"12px" }}>Built for schools. Free forever.</p>
      </footer>
    </div>
  );
}
