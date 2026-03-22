import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function Homepage() {
  const navigate = useNavigate();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setVisible(true), 100);
    const handleMouse = (e) => setMousePos({ x: e.clientX, y: e.clientY });
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("mousemove", handleMouse);
    window.addEventListener("scroll", handleScroll);
    return () => { window.removeEventListener("mousemove", handleMouse); window.removeEventListener("scroll", handleScroll); };
  }, []);

  const features = [
    { icon: "⏱", title: "Real-Time Check-In", desc: "GPS-verified attendance with photo capture. Know exactly when and where teachers arrive." },
    { icon: "📊", title: "Live Analytics", desc: "Instant dashboards showing present, late, absent counts. Monthly trends at a glance." },
    { icon: "📅", title: "Attendance Calendar", desc: "Visual calendar with colour-coded days. On-time, late, absent — all in one view." },
    { icon: "📝", title: "Leave Management", desc: "Teachers apply for leave digitally. Admin approves or rejects with one click." },
    { icon: "📢", title: "Announcements", desc: "Post urgent notices or info directly to all teachers. Priority-coded and timestamped." },
    { icon: "🟢", title: "On-Duty Tracking", desc: "Track which teachers are actively on duty with hourly location pings." },
  ];

  const stats = [
    { value: "100%", label: "Digital" },
    { value: "0",    label: "Paperwork" },
    { value: "24/7", label: "Access" },
    { value: "∞",    label: "Records" },
  ];

  return (
    <div style={{ background: "#050810", color: "#e2e8f0", fontFamily: "'DM Sans', sans-serif", minHeight: "100vh", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes fadeUp   { from { opacity:0; transform:translateY(30px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn   { from { opacity:0; } to { opacity:1; } }
        @keyframes float    { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-12px)} }
        @keyframes spin     { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes pulse    { 0%,100%{opacity:0.4;transform:scale(1)} 50%{opacity:0.8;transform:scale(1.05)} }
        @keyframes shimmer  { 0%{background-position:200% center} 100%{background-position:-200% center} }
        @keyframes glow     { 0%,100%{box-shadow:0 0 20px #3b82f640} 50%{box-shadow:0 0 60px #3b82f680} }

        .fade-up-1 { opacity:0; animation: fadeUp 0.7s ease 0.1s forwards; }
        .fade-up-2 { opacity:0; animation: fadeUp 0.7s ease 0.25s forwards; }
        .fade-up-3 { opacity:0; animation: fadeUp 0.7s ease 0.4s forwards; }
        .fade-up-4 { opacity:0; animation: fadeUp 0.7s ease 0.55s forwards; }

        .gradient-text {
          background: linear-gradient(135deg, #60a5fa, #a78bfa, #f472b6);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 4s linear infinite;
        }

        .hero-btn {
          display: inline-flex; align-items: center; gap: 10px;
          padding: 16px 36px; border-radius: 14px;
          font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 600;
          cursor: pointer; border: none; transition: all 0.3s; text-decoration: none;
        }
        .hero-btn-primary {
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          color: #fff;
          animation: glow 3s ease-in-out infinite;
        }
        .hero-btn-primary:hover { transform: translateY(-2px) scale(1.02); filter: brightness(1.1); }
        .hero-btn-secondary {
          background: transparent; color: #94a3b8;
          border: 1px solid #1e293b;
        }
        .hero-btn-secondary:hover { background: #0f172a; color: #e2e8f0; border-color: #334155; transform: translateY(-2px); }

        .feature-card {
          background: #0a0f1a;
          border: 1px solid #1e293b;
          border-radius: 20px; padding: 28px;
          transition: all 0.3s;
          position: relative; overflow: hidden;
        }
        .feature-card::before {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(135deg, #2563eb08, #7c3aed08);
          opacity: 0; transition: opacity 0.3s;
        }
        .feature-card:hover { border-color: #2563eb40; transform: translateY(-4px); box-shadow: 0 20px 60px #2563eb10; }
        .feature-card:hover::before { opacity: 1; }

        .stat-item { text-align: center; }
        .stat-value {
          font-family: 'Syne', sans-serif; font-size: 48px; font-weight: 800;
          background: linear-gradient(135deg, #60a5fa, #a78bfa);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .stat-label { color: #475569; font-size: 13px; margin-top: 4px; letter-spacing: 1px; text-transform: uppercase; }

        .nav-link { color: #64748b; text-decoration: none; font-size: 14px; transition: color 0.2s; }
        .nav-link:hover { color: #e2e8f0; }

        .orb { position: absolute; border-radius: 50%; filter: blur(80px); pointer-events: none; }

        .mockup-bar { height: 8px; border-radius: 99px; background: #1e293b; overflow: hidden; }
        .mockup-bar-fill { height: 100%; border-radius: 99px; transition: width 0.5s; }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #050810; }
        ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 2px; }
      `}</style>

      {/* ── NAVBAR ── */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, padding: "16px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(5,8,16,0.8)", backdropFilter: "blur(20px)", borderBottom: "1px solid #0f172a" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: "linear-gradient(135deg,#2563eb,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>✦</div>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "16px" }}>AttendTrack</span>
        </div>
        <div style={{ display: "flex", gap: "32px", alignItems: "center" }}>
          <a href="#features" className="nav-link">Features</a>
          <a href="#stats" className="nav-link">About</a>
          <button className="hero-btn hero-btn-primary" style={{ padding: "10px 22px", fontSize: "13px" }} onClick={() => navigate("/login")}>
            Login →
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "120px 24px 80px", position: "relative", overflow: "hidden" }}>
        {/* Orbs */}
        <div className="orb" style={{ width: "600px", height: "600px", background: "#2563eb15", top: "-100px", left: "-200px", animation: "pulse 8s ease-in-out infinite" }} />
        <div className="orb" style={{ width: "500px", height: "500px", background: "#7c3aed15", bottom: "-100px", right: "-150px", animation: "pulse 10s ease-in-out infinite 2s" }} />
        <div className="orb" style={{ width: "300px", height: "300px", background: "#f472b615", top: "50%", left: "50%", transform: "translate(-50%,-50%)", animation: "pulse 6s ease-in-out infinite 1s" }} />

        {/* Mouse-follow glow */}
        <div style={{ position: "fixed", width: "400px", height: "400px", borderRadius: "50%", background: "radial-gradient(circle, #2563eb08, transparent)", left: mousePos.x - 200, top: mousePos.y - 200, pointerEvents: "none", transition: "left 0.3s, top 0.3s", zIndex: 0 }} />

        <div style={{ position: "relative", zIndex: 1, maxWidth: "800px" }}>
          {/* Badge */}
          <div className="fade-up-1" style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "#0f172a", border: "1px solid #1e293b", borderRadius: "99px", padding: "6px 16px", fontSize: "12px", color: "#64748b", marginBottom: "28px" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#4ade80", display: "inline-block", animation: "pulse 2s ease-in-out infinite" }} />
            School Attendance Management System
          </div>

          {/* Headline */}
          <h1 className="fade-up-2" style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(40px, 8vw, 80px)", fontWeight: 800, lineHeight: 1.05, marginBottom: "24px" }}>
            Track Attendance<br />
            <span className="gradient-text">The Smart Way</span>
          </h1>

          {/* Subheadline */}
          <p className="fade-up-3" style={{ fontSize: "18px", color: "#64748b", lineHeight: 1.7, maxWidth: "560px", margin: "0 auto 40px" }}>
            GPS-verified check-ins, real-time dashboards, leave management, and announcements — all in one place for modern schools.
          </p>

          {/* CTAs */}
          <div className="fade-up-4" style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap" }}>
            <button className="hero-btn hero-btn-primary" onClick={() => navigate("/login")}>
              Get Started Free →
            </button>
            <button className="hero-btn hero-btn-secondary">
              Watch Demo ▶
            </button>
          </div>

          {/* Trust line */}
          <p className="fade-up-4" style={{ marginTop: "32px", color: "#334155", fontSize: "12px" }}>
            No credit card required · Works on any device · Free forever for small schools
          </p>
        </div>

        {/* Floating dashboard mockup */}
        <div style={{ position: "relative", zIndex: 1, marginTop: "80px", width: "100%", maxWidth: "800px", animation: "float 6s ease-in-out infinite" }}>
          <div style={{ background: "#0a0f1a", border: "1px solid #1e293b", borderRadius: "20px", overflow: "hidden", boxShadow: "0 40px 120px #00000080" }}>
            {/* Mockup top bar */}
            <div style={{ background: "#0f172a", padding: "12px 20px", display: "flex", alignItems: "center", gap: "8px", borderBottom: "1px solid #1e293b" }}>
              <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ef4444" }} />
              <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#f59e0b" }} />
              <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#22c55e" }} />
              <div style={{ flex: 1, background: "#1e293b", borderRadius: "6px", height: "24px", marginLeft: "8px", display: "flex", alignItems: "center", paddingLeft: "10px" }}>
                <span style={{ color: "#334155", fontSize: "11px" }}>attendtrack.school.app</span>
              </div>
            </div>
            {/* Mockup content */}
            <div style={{ padding: "24px", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "14px" }}>
              {[
                { label: "Present", value: "24", color: "#4ade80" },
                { label: "Late",    value: "3",  color: "#fb923c" },
                { label: "Absent",  value: "1",  color: "#f87171" },
                { label: "Rate",    value: "89%", color: "#60a5fa" },
              ].map(s => (
                <div key={s.label} style={{ background: "#0f172a", borderRadius: "12px", padding: "16px", border: "1px solid #1e293b" }}>
                  <div style={{ fontSize: "22px", fontFamily: "'Syne',sans-serif", fontWeight: 700, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: "11px", color: "#475569", marginTop: "2px" }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{ padding: "0 24px 24px", display: "flex", flexDirection: "column", gap: "10px" }}>
              {[
                { name: "Rahul Sir",  subject: "Mathematics", time: "8:55 AM", status: "On Time", pct: 92 },
                { name: "Priya Ma'am", subject: "Science",    time: "9:12 AM", status: "Late",    pct: 78 },
                { name: "Ganesh Sir", subject: "English",     time: "—",       status: "Absent",  pct: 65 },
              ].map((t, i) => (
                <div key={i} style={{ background: "#0f172a", borderRadius: "10px", padding: "12px 16px", border: "1px solid #1e293b", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: "linear-gradient(135deg,#2563eb,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 700 }}>
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: 500 }}>{t.name}</div>
                      <div style={{ fontSize: "11px", color: "#475569" }}>{t.subject}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>{t.time}</span>
                    <span style={{ fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "99px", background: t.status === "On Time" ? "#14532d" : t.status === "Late" ? "#451a03" : "#450a0a", color: t.status === "On Time" ? "#4ade80" : t.status === "Late" ? "#fb923c" : "#f87171" }}>{t.status}</span>
                    <div style={{ width: "60px" }}>
                      <div style={{ fontSize: "10px", color: "#334155", marginBottom: "3px", textAlign: "right" }}>{t.pct}%</div>
                      <div className="mockup-bar">
                        <div className="mockup-bar-fill" style={{ width: `${t.pct}%`, background: t.pct >= 75 ? "#16a34a" : "#c2410c" }} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Glow under mockup */}
          <div style={{ position: "absolute", bottom: "-30px", left: "10%", right: "10%", height: "60px", background: "linear-gradient(135deg,#2563eb,#7c3aed)", filter: "blur(40px)", opacity: 0.3, borderRadius: "50%" }} />
        </div>
      </section>

      {/* ── STATS ── */}
      <section id="stats" style={{ padding: "80px 40px", borderTop: "1px solid #0f172a", borderBottom: "1px solid #0f172a", background: "#080c14" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "40px" }}>
          {stats.map((s, i) => (
            <div key={i} className="stat-item">
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ padding: "100px 40px", maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "64px" }}>
          <p style={{ color: "#475569", fontSize: "12px", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "12px" }}>Everything you need</p>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(28px,5vw,48px)", fontWeight: 800 }}>
            Built for <span className="gradient-text">Modern Schools</span>
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: "20px" }}>
          {features.map((f, i) => (
            <div key={i} className="feature-card">
              <div style={{ fontSize: "32px", marginBottom: "16px" }}>{f.icon}</div>
              <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "18px", marginBottom: "10px" }}>{f.title}</h3>
              <p style={{ color: "#475569", fontSize: "14px", lineHeight: 1.7 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: "100px 40px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div className="orb" style={{ width: "500px", height: "500px", background: "#2563eb12", top: "50%", left: "50%", transform: "translate(-50%,-50%)" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(28px,5vw,56px)", fontWeight: 800, marginBottom: "20px" }}>
            Ready to go <span className="gradient-text">paperless?</span>
          </h2>
          <p style={{ color: "#64748b", fontSize: "16px", marginBottom: "40px" }}>Start tracking attendance the smart way today.</p>
          <button className="hero-btn hero-btn-primary" style={{ fontSize: "16px", padding: "18px 48px" }} onClick={() => navigate("/login")}>
            Login to Dashboard →
          </button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: "1px solid #0f172a", padding: "32px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "linear-gradient(135deg,#2563eb,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>✦</div>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "14px" }}>AttendTrack</span>
        </div>
        <p style={{ color: "#334155", fontSize: "12px" }}>Built for schools. Free forever.</p>
      </footer>
    </div>
  );
}