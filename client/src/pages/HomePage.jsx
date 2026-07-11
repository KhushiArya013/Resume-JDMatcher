import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { useAuth } from "../context/AuthContext";

function DashboardCard({ icon, title, description, link, buttonText, disabled, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      whileHover={!disabled ? { y: -4, transition: { duration: 0.2 } } : {}}
      className="vf-card"
    >
      <div className="vf-card-icon">{icon}</div>
      <h3 className="vf-card-title">{title}</h3>
      <p className="vf-card-desc">{description}</p>
      {disabled ? (
        <span className="vf-card-link disabled">Sign in to use →</span>
      ) : (
        <Link to={link} className="vf-card-link">{buttonText} →</Link>
      )}
    </motion.div>
  );
}

function StatPill({ value, label }) {
  return (
    <div className="vf-stat">
      <span className="vf-stat-value">{value}</span>
      <span className="vf-stat-label">{label}</span>
    </div>
  );
}

export default function HomePage() {
  // ✅ useAuth INSIDE the component
  const { user, login, logout } = useAuth();

  const handleGoogleSuccess = (credentialResponse) => {
    const decoded = jwtDecode(credentialResponse.credential);
    login({ ...decoded, token: credentialResponse.credential });
  };

  const cards = [
    {
      icon: "🎯",
      title: "Match My Resume",
      description: "AI-powered ATS analysis. Compare your resume against job descriptions and get a match score with actionable feedback.",
      link: "/resume-matcher",
      buttonText: "Analyze Match",
    },
    {
      icon: "✍️",
      title: "Refine Job Description",
      description: "Optimize job postings for clarity, inclusivity, and appeal. Attract top engineering talent with polished descriptions.",
      link: "/refine-jd",
      buttonText: "Refine JD",
    },
    {
      icon: "📈",
      title: "Improve My Resume",
      description: "Get AI-driven feedback on your resume. Identify gaps, missing sections, and specific improvements to stand out.",
      link: "/improve-resume",
      buttonText: "Get Feedback",
    },
    {
      icon: "📝",
      title: "Cover Letter Generator",
      description: "Generate tailored cover letters in seconds. Match your achievements to job requirements with the perfect tone.",
      link: "/cover-letter",
      buttonText: "Generate",
    },
  ];

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0a0f; }
        .vf-root {
          min-height: 100vh; background: #0a0a0f; color: #fff;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          overflow-x: hidden;
        }
        .vf-hero {
          padding: 9rem 2rem 5rem; text-align: center; position: relative;
          display: flex; flex-direction: column; align-items: center;
        }
        .vf-hero::before {
          content: ''; position: absolute; top: 0; left: 50%; transform: translateX(-50%);
          width: 700px; height: 500px;
          background: radial-gradient(ellipse at center, rgba(124,58,237,0.18) 0%, transparent 70%);
          pointer-events: none;
        }
        .vf-badge {
          display: inline-flex; align-items: center; gap: 0.5rem;
          background: rgba(167,139,250,0.08); border: 1px solid rgba(167,139,250,0.2);
          border-radius: 999px; padding: 0.35rem 1rem;
          font-size: 0.8rem; color: #a78bfa; margin-bottom: 2rem;
        }
        .vf-badge-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: #34d399; box-shadow: 0 0 8px #34d399;
        }
        .vf-hero-title {
          font-size: clamp(2.8rem, 7vw, 5rem); font-weight: 800;
          line-height: 1.05; letter-spacing: -0.03em;
          margin-bottom: 1.25rem; max-width: 780px;
        }
        .vf-hero-title span {
          background: linear-gradient(135deg, #a78bfa 0%, #7c3aed 50%, #c4b5fd 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }
        .vf-hero-sub {
          font-size: 1.1rem; color: rgba(255,255,255,0.55);
          max-width: 520px; line-height: 1.7; margin-bottom: 2.5rem;
        }
        .vf-hero-actions { display: flex; gap: 1rem; flex-wrap: wrap; justify-content: center; margin-bottom: 3.5rem; }
        .vf-btn-primary {
          background: linear-gradient(135deg,#7c3aed,#a78bfa);
          color: #fff; border: none; border-radius: 12px;
          padding: 0.85rem 2rem; font-size: 1rem; font-weight: 600;
          cursor: pointer; transition: opacity 0.2s, transform 0.15s;
        }
        .vf-btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
        .vf-btn-ghost {
          background: transparent; color: rgba(255,255,255,0.7);
          border: 1px solid rgba(255,255,255,0.15); border-radius: 12px;
          padding: 0.85rem 2rem; font-size: 1rem; font-weight: 500;
          cursor: pointer; transition: all 0.2s;
        }
        .vf-btn-ghost:hover { border-color: rgba(255,255,255,0.35); color: #fff; }
        .vf-stats { display: flex; gap: 2rem; flex-wrap: wrap; justify-content: center; margin-bottom: 1.5rem; }
        .vf-stat {
          display: flex; flex-direction: column; align-items: center; gap: 0.2rem;
          padding: 0.75rem 1.5rem; background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08); border-radius: 12px;
        }
        .vf-stat-value { font-size: 1.4rem; font-weight: 700; color: #a78bfa; }
        .vf-stat-label { font-size: 0.75rem; color: rgba(255,255,255,0.4); }
        .vf-trusted {
          border-top: 1px solid rgba(255,255,255,0.06);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          padding: 2rem; text-align: center;
        }
        .vf-trusted-label {
          font-size: 0.7rem; letter-spacing: 0.15em; text-transform: uppercase;
          color: rgba(255,255,255,0.3); margin-bottom: 1.2rem;
        }
        .vf-trusted-logos { display: flex; justify-content: center; gap: 3rem; flex-wrap: wrap; }
        .vf-trusted-logo {
          font-size: 1rem; font-weight: 600; color: rgba(255,255,255,0.2);
          letter-spacing: 0.02em; transition: color 0.2s;
        }
        .vf-trusted-logo:hover { color: rgba(255,255,255,0.45); }
        .vf-section { padding: 5rem 2rem; max-width: 1000px; margin: 0 auto; }
        .vf-section-header { text-align: center; margin-bottom: 3.5rem; }
        .vf-section-title {
          font-size: clamp(1.8rem, 4vw, 2.6rem); font-weight: 800;
          letter-spacing: -0.02em; margin-bottom: 0.75rem;
        }
        .vf-section-sub { font-size: 1rem; color: rgba(255,255,255,0.45); max-width: 480px; margin: 0 auto; }
        .vf-cards-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
        .vf-card {
          background: #13121f; border: 1px solid rgba(255,255,255,0.07);
          border-radius: 20px; padding: 2rem 2rem 1.75rem;
          display: flex; flex-direction: column; gap: 0.6rem;
          transition: border-color 0.2s, background 0.2s;
        }
        .vf-card:hover { border-color: rgba(167,139,250,0.3); background: #16152a; }
        .vf-card-icon {
          width: 52px; height: 52px; border-radius: 14px;
          background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
          display: flex; align-items: center; justify-content: center;
          font-size: 1.5rem; margin-bottom: 0.5rem;
        }
        .vf-card-title { font-size: 1.15rem; font-weight: 700; color: #fff; }
        .vf-card-desc { font-size: 0.875rem; color: rgba(255,255,255,0.45); line-height: 1.7; flex: 1; }
        .vf-card-link {
          font-size: 0.875rem; font-weight: 600; color: #a78bfa;
          text-decoration: none; margin-top: 0.75rem; display: inline-block; transition: color 0.2s;
        }
        .vf-card-link:hover { color: #c4b5fd; }
        .vf-card-link.disabled { color: rgba(255,255,255,0.2); cursor: not-allowed; pointer-events: none; }
        .vf-steps {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem; margin-top: 3rem;
        }
        .vf-step {
          padding: 1.75rem; background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; text-align: center;
        }
        .vf-step-num {
          width: 36px; height: 36px; border-radius: 50%;
          background: linear-gradient(135deg,#7c3aed,#a78bfa);
          display: flex; align-items: center; justify-content: center;
          font-size: 0.85rem; font-weight: 700; margin: 0 auto 1rem;
        }
        .vf-step-title { font-size: 0.95rem; font-weight: 600; margin-bottom: 0.5rem; }
        .vf-step-desc { font-size: 0.8rem; color: rgba(255,255,255,0.4); line-height: 1.6; }
        .vf-cta-section { padding: 3rem 2rem 5rem; }
        .vf-cta-box {
          max-width: 740px; margin: 0 auto;
          background: rgba(124,58,237,0.08); border: 1px solid rgba(124,58,237,0.2);
          border-radius: 24px; padding: 3.5rem 2.5rem; text-align: center;
        }
        .vf-cta-title { font-size: clamp(1.6rem,4vw,2.2rem); font-weight: 800; margin-bottom: 0.75rem; letter-spacing:-0.02em; }
        .vf-cta-sub { font-size: 0.95rem; color: rgba(255,255,255,0.45); margin-bottom: 2rem; line-height:1.7; }
        .vf-cta-actions { display:flex; gap:1rem; justify-content:center; flex-wrap:wrap; }
        .vf-footer {
          border-top: 1px solid rgba(255,255,255,0.06);
          padding: 1.5rem 2rem; text-align: center;
          font-size: 0.78rem; color: rgba(255,255,255,0.2);
        }
        @media(max-width:640px){
          .vf-hero { padding: 7rem 1.25rem 3rem; }
          .vf-section { padding: 3rem 1.25rem; }
          .vf-cta-box { padding: 2.5rem 1.5rem; }
          .vf-stats { gap: 0.75rem; }
          .vf-cards-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="vf-root">

        {/* HERO */}
        <section className="vf-hero">
          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:0.5}}>
            <div className="vf-badge"><span className="vf-badge-dot"/>AI-Powered Career Toolkit</div>
          </motion.div>
          <motion.h1 className="vf-hero-title"
            initial={{opacity:0,y:30}} animate={{opacity:1,y:0}} transition={{duration:0.55,delay:0.1}}>
            Your career,{" "}<span>supercharged by AI</span>
          </motion.h1>
          <motion.p className="vf-hero-sub"
            initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:0.5,delay:0.2}}>
            Analyze, refine, and optimize your job applications with precision.
            From resume matching to cover letters — everything you need to land your dream role.
          </motion.p>
          <motion.div className="vf-hero-actions"
            initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:0.5,delay:0.3}}>
            {user ? (
              <Link to="/resume-matcher">
                <button className="vf-btn-primary">Get Started →</button>
              </Link>
            ) : (
              <div style={{transform:"scale(1.05)", transformOrigin:"center"}}>
                <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => alert("Login failed")} text="signin_with"/>
              </div>
            )}
            <a href="#features"><button className="vf-btn-ghost">Learn More</button></a>
          </motion.div>
          <motion.div className="vf-stats"
            initial={{opacity:0}} animate={{opacity:1}} transition={{duration:0.5,delay:0.45}}>
            <StatPill value="4 Tools" label="AI-powered"/>
            <StatPill value="ATS" label="Optimized"/>
            <StatPill value="Instant" label="Feedback"/>
          </motion.div>
        </section>

        {/* TRUSTED */}
        <div className="vf-trusted">
          <p className="vf-trusted-label">Trusted by professionals at</p>
          <div className="vf-trusted-logos">
            {["Google","Meta","Amazon","Netflix","Spotify"].map(co => (
              <span key={co} className="vf-trusted-logo">{co}</span>
            ))}
          </div>
        </div>

        {/* FEATURES */}
        <section className="vf-section" id="features">
          <div className="vf-section-header">
            <motion.h2 className="vf-section-title"
              initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{duration:0.5}}>
              Everything you need to stand out
            </motion.h2>
            <motion.p className="vf-section-sub"
              initial={{opacity:0}} whileInView={{opacity:1}} viewport={{once:true}} transition={{duration:0.5,delay:0.15}}>
              Four powerful AI tools designed to help you craft the perfect job application, every time.
            </motion.p>
          </div>
          <div className="vf-cards-grid">
            {cards.map((card, i) => (
              <DashboardCard key={card.title} {...card} disabled={!user} delay={i * 0.1}/>
            ))}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="vf-section" style={{paddingTop:"1rem"}}>
          <div className="vf-section-header">
            <motion.h2 className="vf-section-title"
              initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{duration:0.5}}>
              How it works
            </motion.h2>
          </div>
          <div className="vf-steps">
            {[
              {n:1, title:"Sign in", desc:"Log in with Google in one click. No forms, no passwords."},
              {n:2, title:"Upload your resume", desc:"Paste or upload your resume and the job description you're targeting."},
              {n:3, title:"Get AI analysis", desc:"Receive an ATS match score, gap analysis, and actionable improvements."},
              {n:4, title:"Apply with confidence", desc:"Use your optimized resume and cover letter to land more interviews."},
            ].map((s,i) => (
              <motion.div key={s.n} className="vf-step"
                initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{duration:0.4,delay:i*0.1}}>
                <div className="vf-step-num">{s.n}</div>
                <p className="vf-step-title">{s.title}</p>
                <p className="vf-step-desc">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="vf-cta-section">
          <motion.div className="vf-cta-box"
            initial={{opacity:0,y:30}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{duration:0.5}}>
            <h2 className="vf-cta-title">Ready to land your dream job?</h2>
            <p className="vf-cta-sub">
              Join professionals using Verity-Flow to optimize their career journey.
              Sign in with Google to get started — it's free.
            </p>
            <div className="vf-cta-actions">
              {user ? (
                <Link to="/resume-matcher">
                  <button className="vf-btn-primary">Start Matching →</button>
                </Link>
              ) : (
                <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => alert("Login failed")} text="signup_with"/>
              )}
              <a href="#features"><button className="vf-btn-ghost">View Features</button></a>
            </div>
          </motion.div>
        </div>

        {/* FOOTER */}
        <footer className="vf-footer">
          © {new Date().getFullYear()} Verity-Flow · Built with AI · All rights reserved
        </footer>

      </div>
    </>
  );
}