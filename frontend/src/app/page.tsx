"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function Home() {
  const router = useRouter();
  const [email, setEmail] = useState("officer@bidsentinel.gov.in");
  const [pass,  setPass]  = useState("Officer@1234");
  const [err,   setErr]   = useState("");
  const [loading, setLoading] = useState(false);

  const login = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setErr("");
    try {
      const r = await fetch(`${API}/api/v1/auth/login`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ email, password:pass }),
      });
      if (!r.ok) throw new Error("Invalid credentials");
      const data = await r.json();
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("role",  data.role);
      router.push("/dashboard");
    } catch (e: any) { setErr(e.message); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight:"100vh", background:"#F4F2EC", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ background:"#fff", border:"1px solid #E1DCCF", borderRadius:10, padding:32, width:360, boxShadow:"0 4px 24px rgba(11,27,51,0.09)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:24 }}>
          <div style={{ width:32, height:32, background:"#1A3A6B", borderRadius:6, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 1L14 4.5V8C14 11.5 11.5 14.5 8 15C4.5 14.5 2 11.5 2 8V4.5L8 1Z" stroke="#fff" strokeWidth="1.4" fill="none"/>
              <path d="M5 8L7 10L11 6" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize:15, fontWeight:700, color:"#0B1B33" }}>BidSentinel</div>
            <div style={{ fontSize:9, color:"#9CA8B4", letterSpacing:"0.08em" }}>GEM PROCUREMENT COMPLIANCE</div>
          </div>
        </div>
        <form onSubmit={login} style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <div>
            <label style={{ fontSize:9.5, fontWeight:700, color:"#6B7A8D", letterSpacing:"0.1em", textTransform:"uppercase", display:"block", marginBottom:4 }}>Email</label>
            <input value={email} onChange={e=>setEmail(e.target.value)} type="email" required
              style={{ width:"100%", padding:"8px 10px", border:"1px solid #E1DCCF", borderRadius:4, fontSize:12, color:"#0B1B33", background:"#F4F2EC", outline:"none" }} />
          </div>
          <div>
            <label style={{ fontSize:9.5, fontWeight:700, color:"#6B7A8D", letterSpacing:"0.1em", textTransform:"uppercase", display:"block", marginBottom:4 }}>Password</label>
            <input value={pass} onChange={e=>setPass(e.target.value)} type="password" required
              style={{ width:"100%", padding:"8px 10px", border:"1px solid #E1DCCF", borderRadius:4, fontSize:12, color:"#0B1B33", background:"#F4F2EC", outline:"none" }} />
          </div>
          {err && <div style={{ fontSize:10, color:"#9B1C1C" }}>{err}</div>}
          <button type="submit" disabled={loading}
            style={{ padding:"9px", background:"#1A3A6B", color:"#fff", border:"none", borderRadius:4, fontSize:11, fontWeight:700, letterSpacing:"0.07em", cursor:"pointer", opacity:loading?0.7:1 }}>
            {loading ? "Signing in..." : "SIGN IN"}
          </button>
        </form>
        <div style={{ marginTop:16, padding:10, background:"#F4F2EC", borderRadius:4, fontSize:9, color:"#6B7A8D" }}>
          <div style={{ fontWeight:700, marginBottom:4, color:"#3A4A5C" }}>Demo Credentials</div>
          <div>officer@bidsentinel.gov.in / Officer@1234</div>
          <div>admin@bidsentinel.gov.in / Admin@1234</div>
        </div>
      </div>
    </div>
  );
}
