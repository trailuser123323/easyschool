import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "./api";

const DEMO_ACCOUNTS = [
  { label:"Admin",   email:"admin@gmail.com",    password:"1234",  initials:"A", color:"#4f46e5", role:"admin",   name:"Admin" },
  { label:"Teacher", email:"teacher1@gmail.com", password:"12345", initials:"PR", color:"#4f46e5", role:"teacher", name:"Priya Ramesh" },
];

export default function Login({ onLogin }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    fetch(apiUrl("/api/auth/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password,
      }),
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.message || "Invalid email or password.");
        }

        const normalised = {
          ...data.user,
          token: data.token,
        };

        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(normalised));
        onLogin(normalised);

        if (normalised.role === "admin") navigate("/admin");
        else navigate("/teacher");
      })
      .catch((err) => {
        setError(err.message || "Unable to sign in.");
      })
      .finally(() => {
        setLoading(false);
      });
  }

  function fillDemo(acc) { setEmail(acc.email); setPassword(acc.password); setError(""); }

  return (
    <div style={s.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Fraunces:wght@600;700&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes spin   { to{transform:rotate(360deg)} }
        input::placeholder { color:rgba(255,255,255,.2); }
        input:focus { outline:none; border-color:#4f46e5 !important; background:rgba(79,70,229,.08) !important; box-shadow:0 0 0 3px rgba(79,70,229,.15); }
        .demo-row:hover { background:rgba(255,255,255,.07) !important; cursor:pointer; }
      `}</style>

      <div style={s.left}>
        <div style={s.leftInner}>
          <div style={s.brand}>
            <div style={s.brandIcon}>✦</div>
            <div style={s.brandName}>AttendTrack</div>
          </div>
          <div style={s.heroText}>Smart Attendance<br /><span style={s.heroAccent}>For Smart Schools</span></div>
          <p style={s.heroSub}>One login for everyone. Admins manage, teachers mark attendance — all in one seamless platform.</p>
          <div style={s.features}>
            {[["📍","GPS-verified check-in"],["📊","Real-time dashboards"],["📝","Digital leave management"],["📢","Instant announcements"]].map(([icon,text])=>(
              <div key={text} style={s.featureRow}>
                <div style={s.featureIcon}>{icon}</div>
                <span style={s.featureText}>{text}</span>
              </div>
            ))}
          </div>
          <div style={s.serverStatus}>
            <div style={s.statusDot}/>
            <span style={s.statusText}>All systems operational</span>
          </div>
        </div>
      </div>

      <div style={s.right}>
        <div style={s.card}>
          <div style={s.cardBrand}>
            <div style={s.cardBrandIcon}>✦</div>
            <span style={s.cardBrandName}>AttendTrack</span>
          </div>
          <div style={s.cardTop}>
            <div style={s.cardTitle}>Welcome back</div>
            <div style={s.cardSub}>Sign in as Admin or Teacher — same login, smart routing.</div>
          </div>
          <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <div style={s.fgl}>
              <label style={s.label}>Email Address</label>
              <div style={s.inputWrap}>
                <input type="email" placeholder="you@school.com" value={email} onChange={e=>setEmail(e.target.value)} required style={s.input}/>
                <span style={s.inputSuffix}>✉️</span>
              </div>
            </div>
            <div style={s.fgl}>
              <label style={s.label}>Password</label>
              <div style={s.inputWrap}>
                <input type={showPass?"text":"password"} placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)} required style={s.input}/>
                <button type="button" style={s.eyeBtn} onClick={()=>setShowPass(v=>!v)}>{showPass?"🙈":"👁️"}</button>
              </div>
            </div>
            {error && <div style={s.errorBox}><span>⚠️</span><span>{error}</span></div>}
            <button type="submit" disabled={loading} style={{ ...s.submitBtn, opacity:loading?0.8:1 }}>
              {loading ? <><span style={s.spinner}/> Signing in…</> : <>Sign In →</>}
            </button>
          </form>
          <div style={s.demoBox}>
            <div style={s.demoTitle}>Demo Accounts</div>
            {DEMO_ACCOUNTS.map(acc=>(
              <div key={acc.label} className="demo-row" style={s.demoRow} onClick={()=>fillDemo(acc)}>
                <div style={{ ...s.demoAvatar, background:acc.color }}>{acc.initials}</div>
                <div style={{ flex:1 }}><div style={s.demoName}>{acc.label}</div></div>
                <div style={s.demoEmail}>{acc.email}</div>
              </div>
            ))}
            <div style={s.demoHint}>↑ Click a row to autofill credentials</div>
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  page:         { display:"flex", minHeight:"100vh", fontFamily:"'DM Sans',sans-serif", background:"#0d0d14" },
  left:         { flex:"0 0 52%", background:"#0d0d14", display:"flex", alignItems:"center", justifyContent:"center", padding:"56px 64px", overflow:"hidden" },
  leftInner:    { animation:"fadeUp .6s ease both", maxWidth:480 },
  brand:        { display:"flex", alignItems:"center", gap:10, marginBottom:44 },
  brandIcon:    { width:40, height:40, background:"#4f46e5", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, color:"#fff", fontWeight:700 },
  brandName:    { fontFamily:"'Fraunces',serif", fontSize:20, fontWeight:700, color:"#fff" },
  heroText:     { fontFamily:"'Fraunces',serif", fontSize:52, fontWeight:700, color:"#fff", lineHeight:1.05, marginBottom:20 },
  heroAccent:   { background:"linear-gradient(90deg,#818cf8,#ec4899)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" },
  heroSub:      { fontSize:15, color:"rgba(255,255,255,.45)", lineHeight:1.7, marginBottom:44 },
  features:     { display:"flex", flexDirection:"column", gap:12, marginBottom:44 },
  featureRow:   { display:"flex", alignItems:"center", gap:14 },
  featureIcon:  { width:38, height:38, borderRadius:10, background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.08)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 },
  featureText:  { fontSize:14, color:"rgba(255,255,255,.6)" },
  serverStatus: { display:"flex", alignItems:"center", gap:8 },
  statusDot:    { width:7, height:7, borderRadius:"50%", background:"#22c55e", animation:"pulse 2s infinite" },
  statusText:   { fontSize:12, color:"rgba(255,255,255,.35)" },
  right:        { flex:1, background:"#13131f", display:"flex", alignItems:"center", justifyContent:"center", padding:40 },
  card:         { width:"100%", maxWidth:420, animation:"fadeUp .5s .1s ease both", opacity:0 },
  cardBrand:    { display:"flex", alignItems:"center", gap:8, marginBottom:32 },
  cardBrandIcon:{ width:32, height:32, background:"#4f46e5", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, color:"#fff", fontWeight:700 },
  cardBrandName:{ fontFamily:"'Fraunces',serif", fontSize:16, fontWeight:700, color:"#fff" },
  cardTop:      { marginBottom:28 },
  cardTitle:    { fontFamily:"'Fraunces',serif", fontSize:32, fontWeight:700, color:"#fff", marginBottom:8 },
  cardSub:      { fontSize:13, color:"rgba(255,255,255,.35)", lineHeight:1.6 },
  fgl:          { display:"flex", flexDirection:"column", gap:7 },
  label:        { fontSize:11, fontWeight:600, color:"rgba(255,255,255,.35)", textTransform:"uppercase", letterSpacing:".08em" },
  inputWrap:    { position:"relative", display:"flex", alignItems:"center" },
  input:        { width:"100%", border:"1px solid rgba(255,255,255,.1)", borderRadius:10, padding:"13px 44px 13px 16px", fontSize:14, color:"#fff", background:"rgba(255,255,255,.05)", transition:"all .2s", fontFamily:"'DM Sans',sans-serif" },
  inputSuffix:  { position:"absolute", right:14, fontSize:14, pointerEvents:"none", opacity:.4 },
  eyeBtn:       { position:"absolute", right:12, background:"none", border:"none", cursor:"pointer", fontSize:14, padding:4, opacity:.5 },
  errorBox:     { background:"rgba(185,28,28,.25)", border:"1px solid rgba(220,38,38,.4)", borderRadius:10, padding:"11px 14px", fontSize:13, color:"#fca5a5", display:"flex", alignItems:"center", gap:8 },
  submitBtn:    { background:"linear-gradient(135deg,#4f46e5,#7c3aed)", color:"#fff", border:"none", borderRadius:12, padding:"15px", fontSize:15, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8, fontFamily:"'DM Sans',sans-serif", transition:"opacity .2s", boxShadow:"0 4px 24px rgba(79,70,229,.4)" },
  spinner:      { width:16, height:16, border:"2px solid rgba(255,255,255,.3)", borderTopColor:"#fff", borderRadius:"50%", display:"inline-block", animation:"spin .7s linear infinite" },
  demoBox:      { marginTop:28, background:"rgba(255,255,255,.04)", borderRadius:14, padding:16, border:"1px solid rgba(255,255,255,.07)" },
  demoTitle:    { fontSize:10, fontWeight:600, color:"rgba(255,255,255,.25)", textTransform:"uppercase", letterSpacing:".1em", marginBottom:12 },
  demoRow:      { display:"flex", alignItems:"center", gap:12, padding:"10px 12px", borderRadius:10, marginBottom:4, transition:"background .15s" },
  demoAvatar:   { width:32, height:32, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:600, color:"#fff", flexShrink:0 },
  demoName:     { fontSize:13, fontWeight:500, color:"#fff" },
  demoEmail:    { fontSize:11, color:"rgba(255,255,255,.3)", fontFamily:"monospace" },
  demoHint:     { fontSize:11, color:"rgba(255,255,255,.18)", textAlign:"center", marginTop:8, paddingTop:8, borderTop:"1px solid rgba(255,255,255,.06)" },
};
