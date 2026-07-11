
import React, { useState, useRef, useEffect } from "react";
import axios from "axios";

const API_URL = "http://localhost:8000/api";

export default function RefineJobDescriptionPage() {
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const resultRef = useRef(null);
  const outputRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!jobDescription) { setError("Please enter a job description."); return; }
    setError(""); setLoading(true); setResult(null);
    try {
      const formData = new FormData();
      formData.append("job_description", jobDescription);
      const response = await axios.post(`${API_URL}/refine-jd`, formData);
      const data = response.data;
      setResult({ refined_jd: data.refined_jd || "No refined job description returned." });
    } catch (err) {
      setError(err.response?.data?.detail || "Something went wrong. Please try again.");
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (result && resultRef.current) resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [result]);

  const handleCopy = () => {
    if (outputRef.current) {
      navigator.clipboard.writeText(outputRef.current.innerText);
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{background:#0a0a0f}
        .rj-root{min-height:100vh;background:#0a0a0f;font-family:'Inter',-apple-system,sans-serif;color:#fff;padding:6rem 1.25rem 4rem}
        .rj-header{max-width:720px;margin:0 auto 2.5rem;text-align:center;padding-top:1.5rem}
        .rj-badge{display:inline-flex;align-items:center;gap:.45rem;background:rgba(167,139,250,.08);border:1px solid rgba(167,139,250,.2);border-radius:999px;padding:.3rem .9rem;font-size:.75rem;color:#a78bfa;margin-bottom:1.25rem}
        .rj-badge-dot{width:6px;height:6px;border-radius:50%;background:#34d399;box-shadow:0 0 6px #34d399}
        .rj-title{font-size:clamp(1.9rem,5vw,2.8rem);font-weight:800;letter-spacing:-.03em;margin-bottom:.6rem}
        .rj-title span{background:linear-gradient(135deg,#a78bfa,#7c3aed);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
        .rj-subtitle{font-size:.95rem;color:rgba(255,255,255,.4);line-height:1.65}
        .rj-card{max-width:720px;margin:0 auto;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:24px;padding:2.25rem}
        .rj-label{display:block;font-size:.8rem;font-weight:600;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:.08em;margin-bottom:.6rem}
        .rj-textarea{width:100%;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:1rem 1.1rem;font-size:.9rem;color:#fff;resize:vertical;min-height:200px;line-height:1.65;font-family:inherit;transition:border-color .2s;outline:none}
        .rj-textarea::placeholder{color:rgba(255,255,255,.25)}
        .rj-textarea:focus{border-color:rgba(167,139,250,.45)}
        .rj-field{margin-bottom:1.75rem}
        .rj-submit{width:100%;background:linear-gradient(135deg,#7c3aed,#a78bfa);border:none;border-radius:14px;padding:1rem;font-size:1rem;font-weight:700;color:#fff;cursor:pointer;transition:opacity .2s,transform .15s;display:flex;align-items:center;justify-content:center;gap:.5rem}
        .rj-submit:hover:not(:disabled){opacity:.88;transform:translateY(-1px)}
        .rj-submit:disabled{opacity:.5;cursor:not-allowed}
        .rj-spinner{width:18px;height:18px;border-radius:50%;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;animation:spin .7s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}
        .rj-error{background:rgba(248,113,113,.08);border:1px solid rgba(248,113,113,.2);border-radius:10px;padding:.75rem 1rem;font-size:.85rem;color:#f87171;margin-top:1rem}
        .rj-result{max-width:720px;margin:2rem auto 0}
        .rj-result-card{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:24px;padding:2.25rem}
        .rj-result-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem;flex-wrap:wrap;gap:.75rem}
        .rj-result-title{font-size:1rem;font-weight:700;color:rgba(255,255,255,.6)}
        .rj-result-actions{display:flex;gap:.6rem}
        .rj-copy-btn{display:flex;align-items:center;gap:.4rem;background:rgba(167,139,250,.1);border:1px solid rgba(167,139,250,.25);color:#a78bfa;border-radius:10px;padding:.5rem 1rem;font-size:.82rem;font-weight:600;cursor:pointer;transition:all .2s}
        .rj-copy-btn:hover{background:rgba(167,139,250,.18)}
        .rj-copy-btn.success{background:rgba(52,211,153,.1);border-color:rgba(52,211,153,.3);color:#34d399}
        .rj-reset-btn{background:transparent;border:1px solid rgba(255,255,255,.12);color:rgba(255,255,255,.4);border-radius:10px;padding:.5rem 1rem;font-size:.82rem;cursor:pointer;transition:all .2s}
        .rj-reset-btn:hover{border-color:rgba(248,113,113,.4);color:#f87171}
        .rj-output{font-size:.92rem;line-height:1.85;color:rgba(255,255,255,.8);white-space:pre-wrap;border-top:1px solid rgba(255,255,255,.07);padding-top:1.5rem}
        .rj-back{display:inline-flex;align-items:center;gap:.4rem;color:rgba(255,255,255,.4);font-size:.85rem;text-decoration:none;margin-bottom:1.5rem;transition:color .2s}
        .rj-back:hover{color:#a78bfa}
        @media(max-width:600px){.rj-card{padding:1.5rem 1.1rem}.rj-result-card{padding:1.5rem 1.1rem}}
      `}</style>
      <div className="rj-root">
        <div className="rj-header">
          <a href="/" className="rj-back">← Back to Home</a>
          <div className="rj-badge"><span className="rj-badge-dot"/>AI-Powered JD Optimizer</div>
          <h1 className="rj-title">Refine Job <span>Description</span></h1>
          <p className="rj-subtitle">Paste a raw job description and get a polished, inclusive, and compelling version optimized to attract top talent.</p>
        </div>
        <div className="rj-card">
          <div className="rj-field">
            <label className="rj-label">Job Description</label>
            <textarea className="rj-textarea" value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} rows={8} placeholder="Paste the job description you want to refine..."/>
            <p style={{fontSize:".75rem",color:"rgba(255,255,255,.2)",marginTop:".4rem"}}>{jobDescription.length} characters</p>
          </div>
          <button className="rj-submit" onClick={handleSubmit} disabled={loading}>
            {loading ? <><span className="rj-spinner"/>Refining your JD…</> : "Refine Job Description →"}
          </button>
          {error && <div className="rj-error">⚠ {error}</div>}
        </div>
        {result && (
          <div className="rj-result" ref={resultRef}>
            <div className="rj-result-card">
              <div className="rj-result-top">
                <p className="rj-result-title">✨ Refined Job Description</p>
                <div className="rj-result-actions">
                  <button className={`rj-copy-btn ${copied ? "success" : ""}`} onClick={handleCopy}>
                    {copied ? "✓ Copied!" : "⎘ Copy"}
                  </button>
                  <button className="rj-reset-btn" onClick={() => { setResult(null); setJobDescription(""); }}>↺ Start over</button>
                </div>
              </div>
              <div className="rj-output" ref={outputRef}>{result.refined_jd}</div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

