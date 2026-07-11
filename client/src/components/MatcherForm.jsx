
import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { gsap } from "gsap";
import { useGoogleLogin } from "@react-oauth/google";

const API_URL = "http://localhost:8000/api";

export default function MatcherForm() {
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeName, setResumeName] = useState("");
  const [driveFileId, setDriveFileId] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [accessToken, setAccessToken] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const percentageRef = useRef(null);
  const verdictRef = useRef(null);
  const progressBarRef = useRef(null);
  const resultRef = useRef(null);

  const googleLogin = useGoogleLogin({
    onSuccess: (codeResponse) => setAccessToken(codeResponse.access_token),
    onError: () => setError("Failed to get Google access token. Please try again."),
    scope: "https://www.googleapis.com/auth/drive.readonly",
  });

  useEffect(() => {
    if (!document.getElementById("google-picker-api-script")) {
      const script = document.createElement("script");
      script.id = "google-picker-api-script";
      script.src = "https://apis.google.com/js/api.js";
      script.onload = () => window.gapi.load("picker", () => {});
      document.body.appendChild(script);
    }
  }, []);

  const handleFileSelect = (file) => {
    if (file && file.type === "application/pdf") {
      setResumeFile(file); setResumeName(file.name); setDriveFileId(""); setError("");
    } else { setError("Please upload a PDF file."); }
  };

  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); handleFileSelect(e.dataTransfer.files[0]); };

  const handleDriveClick = () => {
    if (!accessToken) { googleLogin(); return; }
    const view = new window.google.picker.DocsView().setIncludeFolders(true).setSelectFolderEnabled(false).setMimeTypes("application/pdf");
    const picker = new window.google.picker.PickerBuilder().setOAuthToken(accessToken).addView(view)
      .setCallback((data) => {
        if (data.action === window.google.picker.Action.PICKED) {
          const file = data.docs[0]; setDriveFileId(file.id); setResumeName(file.name); setResumeFile(null);
        }
      }).build();
    picker.setVisible(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!jobDescription || (!resumeFile && !driveFileId)) { setError("Please provide a job description and a resume."); return; }
    setLoading(true); setError(""); setResult(null);
    const formData = new FormData();
    formData.append("job_description", jobDescription);
    if (resumeFile) formData.append("resume", resumeFile);
    else if (driveFileId) { formData.append("drive_file_id", driveFileId); formData.append("token", accessToken); }
    try {
      const response = await axios.post(`${API_URL}/match`, formData);
      const data = response.data;
      data.match_percentage = data.match_percentage || 0;
      data.verdict = data.match_percentage >= 70 ? "Strong Match" : data.match_percentage >= 40 ? "Moderate Match" : "Weak Match";
      data.analysis = data.summary?.trim() || "No detailed analysis provided.";
      data.strengths = data.strengths || []; data.improvements = data.improvements || []; data.missing_keywords = data.missing_keywords || [];
      setResult(data);
    } catch (err) { setError(err.response?.data?.detail || "Something went wrong. Please try again."); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (result) {
      if (resultRef.current) resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      if (percentageRef.current) gsap.fromTo(percentageRef.current, { innerText: 0 }, { innerText: result.match_percentage, duration: 1.5, snap: { innerText: 1 } });
      if (verdictRef.current) gsap.fromTo(verdictRef.current, { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.6 });
      if (progressBarRef.current) gsap.fromTo(progressBarRef.current, { width: "0%" }, { width: `${result.match_percentage}%`, duration: 1.5, ease: "power2.out" });
    }
  }, [result]);

  const verdictColor = result?.match_percentage >= 70 ? "#34d399" : result?.match_percentage >= 40 ? "#fbbf24" : "#f87171";
  const circumference = 2 * Math.PI * 54;
  const dash = ((result?.match_percentage || 0) / 100) * circumference;

  return (
    <>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{background:#0a0a0f}
        .mf-root{min-height:100vh;background:#0a0a0f;font-family:'Inter',-apple-system,sans-serif;color:#fff;padding:6rem 1.25rem 4rem}
        .mf-header{max-width:720px;margin:0 auto 2.5rem;text-align:center;padding-top:1.5rem}
        .mf-badge{display:inline-flex;align-items:center;gap:.45rem;background:rgba(167,139,250,.08);border:1px solid rgba(167,139,250,.2);border-radius:999px;padding:.3rem .9rem;font-size:.75rem;color:#a78bfa;margin-bottom:1.25rem}
        .mf-badge-dot{width:6px;height:6px;border-radius:50%;background:#34d399;box-shadow:0 0 6px #34d399}
        .mf-title{font-size:clamp(1.9rem,5vw,2.8rem);font-weight:800;letter-spacing:-.03em;margin-bottom:.6rem}
        .mf-title span{background:linear-gradient(135deg,#a78bfa,#7c3aed);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
        .mf-subtitle{font-size:.95rem;color:rgba(255,255,255,.4);line-height:1.65}
        .mf-card{max-width:720px;margin:0 auto;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:24px;padding:2.25rem}
        .mf-label{display:block;font-size:.8rem;font-weight:600;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:.08em;margin-bottom:.6rem}
        .mf-dropzone{border:2px dashed rgba(167,139,250,.25);border-radius:16px;padding:2.25rem 1.5rem;text-align:center;cursor:pointer;transition:border-color .2s,background .2s;background:rgba(167,139,250,.03);margin-bottom:1rem}
        .mf-dropzone.active,.mf-dropzone:hover{border-color:rgba(167,139,250,.5);background:rgba(167,139,250,.06)}
        .mf-dropzone-icon{font-size:2rem;margin-bottom:.6rem}
        .mf-dropzone-text{font-size:.9rem;color:rgba(255,255,255,.5)}
        .mf-dropzone-text strong{color:#a78bfa}
        .mf-file-selected{display:flex;align-items:center;gap:.6rem;background:rgba(52,211,153,.08);border:1px solid rgba(52,211,153,.2);border-radius:10px;padding:.6rem 1rem;font-size:.85rem;color:#34d399;margin-bottom:1rem}
        .mf-or{display:flex;align-items:center;gap:.75rem;margin:.75rem 0;color:rgba(255,255,255,.2);font-size:.78rem}
        .mf-or::before,.mf-or::after{content:'';flex:1;height:1px;background:rgba(255,255,255,.08)}
        .mf-drive-btn{width:100%;display:flex;align-items:center;justify-content:center;gap:.6rem;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:.8rem;font-size:.9rem;color:rgba(255,255,255,.65);cursor:pointer;transition:all .2s}
        .mf-drive-btn:hover{border-color:rgba(167,139,250,.35);color:#a78bfa;background:rgba(167,139,250,.05)}
        .mf-textarea{width:100%;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:1rem 1.1rem;font-size:.9rem;color:#fff;resize:vertical;min-height:140px;line-height:1.65;font-family:inherit;transition:border-color .2s;outline:none}
        .mf-textarea::placeholder{color:rgba(255,255,255,.25)}
        .mf-textarea:focus{border-color:rgba(167,139,250,.45)}
        .mf-field{margin-bottom:1.75rem}
        .mf-submit{width:100%;background:linear-gradient(135deg,#7c3aed,#a78bfa);border:none;border-radius:14px;padding:1rem;font-size:1rem;font-weight:700;color:#fff;cursor:pointer;transition:opacity .2s,transform .15s;display:flex;align-items:center;justify-content:center;gap:.5rem}
        .mf-submit:hover:not(:disabled){opacity:.88;transform:translateY(-1px)}
        .mf-submit:disabled{opacity:.5;cursor:not-allowed}
        .mf-spinner{width:18px;height:18px;border-radius:50%;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;animation:spin .7s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}
        .mf-error{background:rgba(248,113,113,.08);border:1px solid rgba(248,113,113,.2);border-radius:10px;padding:.75rem 1rem;font-size:.85rem;color:#f87171;margin-top:1rem}
        .mf-result{max-width:720px;margin:2rem auto 0}
        .mf-result-header{text-align:center;margin-bottom:2rem}
        .mf-result-title{font-size:1.1rem;font-weight:700;color:rgba(255,255,255,.6);margin-bottom:1.5rem}
        .mf-score-wrap{display:flex;flex-direction:column;align-items:center;gap:.5rem;margin-bottom:1.5rem}
        .mf-score-ring{transform:rotate(-90deg)}
        .mf-score-ring-bg{fill:none;stroke:rgba(255,255,255,.07);stroke-width:8}
        .mf-score-ring-fill{fill:none;stroke-width:8;stroke-linecap:round}
        .mf-score-container{position:relative;width:128px;height:128px}
        .mf-score-center{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
        .mf-score-num{font-size:2rem;font-weight:800;letter-spacing:-.03em}
        .mf-score-pct{font-size:.75rem;color:rgba(255,255,255,.4)}
        .mf-verdict-badge{display:inline-flex;align-items:center;gap:.4rem;border-radius:999px;padding:.35rem 1rem;font-size:.82rem;font-weight:700}
        .mf-progress-track{height:6px;border-radius:999px;background:rgba(255,255,255,.07);overflow:hidden;margin-bottom:2rem}
        .mf-progress-fill{height:100%;border-radius:999px;width:0%}
        .mf-result-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem;margin-bottom:1rem}
        .mf-result-section{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:16px;padding:1.25rem}
        .mf-result-section-title{font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:rgba(255,255,255,.35);margin-bottom:.85rem}
        .mf-result-section p{font-size:.88rem;color:rgba(255,255,255,.7);line-height:1.7}
        .mf-tag{display:inline-block;border-radius:6px;padding:.25rem .6rem;font-size:.78rem;font-weight:500;margin:.2rem}
        .mf-tag-green{background:rgba(52,211,153,.1);color:#34d399}
        .mf-tag-red{background:rgba(248,113,113,.1);color:#f87171}
        .mf-tag-amber{background:rgba(251,191,36,.1);color:#fbbf24}
        .mf-back{display:inline-flex;align-items:center;gap:.4rem;color:rgba(255,255,255,.4);font-size:.85rem;text-decoration:none;margin-bottom:1.5rem;transition:color .2s}
        .mf-back:hover{color:#a78bfa}
        @media(max-width:600px){.mf-card{padding:1.5rem 1.1rem}.mf-result-grid{grid-template-columns:1fr}}
      `}</style>
      <div className="mf-root">
        <div className="mf-header">
          <a href="/" className="mf-back">← Back to Home</a>
          <div className="mf-badge"><span className="mf-badge-dot"/>ATS-Powered Analysis</div>
          <h1 className="mf-title">Match My <span>Resume</span></h1>
          <p className="mf-subtitle">Upload your resume and paste a job description. Get an instant ATS match score, gap analysis, and tailored suggestions.</p>
        </div>
        <div className="mf-card">
          <div className="mf-field">
            <label className="mf-label">Resume (PDF)</label>
            {resumeName && (resumeFile || driveFileId) ? (
              <div className="mf-file-selected">
                <span>📄</span><span>{resumeName}</span>
                <button onClick={() => { setResumeFile(null); setResumeName(""); setDriveFileId(""); }} style={{marginLeft:"auto",background:"none",border:"none",color:"#f87171",cursor:"pointer",fontSize:".8rem"}}>Remove</button>
              </div>
            ) : (
              <div className={`mf-dropzone ${dragOver ? "active" : ""}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)} onDrop={handleDrop}
                onClick={() => document.getElementById("mf-file-input").click()}>
                <div className="mf-dropzone-icon">📂</div>
                <p className="mf-dropzone-text"><strong>Click to upload</strong> or drag and drop your PDF here</p>
                <p style={{fontSize:".75rem",color:"rgba(255,255,255,.25)",marginTop:".4rem"}}>PDF only · Max 10MB</p>
              </div>
            )}
            <input id="mf-file-input" type="file" accept="application/pdf" style={{display:"none"}} onChange={(e) => handleFileSelect(e.target.files[0])}/>
            <div className="mf-or">or</div>
            <button type="button" className="mf-drive-btn" onClick={handleDriveClick}>
              <svg width="18" height="18" viewBox="0 0 87.3 78" fill="none"><path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3L27.5 51H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/><path d="M43.65 25L29.9 1.2C28.55 2 27.4 3.1 26.6 4.5L1.2 46.5C.4 47.9 0 49.45 0 51h27.5z" fill="#00ac47"/><path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75L86.1 55.5c.8-1.4 1.2-2.95 1.2-4.5H59.8l5.85 10.35z" fill="#ea4335"/><path d="M43.65 25L57.4 1.2C56.05.4 54.5 0 52.9 0H34.4c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/><path d="M59.8 51H87.3c0-1.55-.4-3.1-1.2-4.5L60.7 4.5C59.9 3.1 58.75 2 57.4 1.2L43.65 25z" fill="#2684fc"/><path d="M43.65 53.35L27.5 51 13.75 76.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#ffba00"/></svg>
              Pick from Google Drive
            </button>
          </div>
          <div className="mf-field">
            <label className="mf-label">Job Description</label>
            <textarea className="mf-textarea" value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} rows={6} placeholder="Paste the full job description here..."/>
            <p style={{fontSize:".75rem",color:"rgba(255,255,255,.2)",marginTop:".4rem"}}>{jobDescription.length} characters</p>
          </div>
          <button className="mf-submit" onClick={handleSubmit} disabled={loading}>
            {loading ? <><span className="mf-spinner"/>Analyzing your resume…</> : "Analyze Match →"}
          </button>
          {error && <div className="mf-error">⚠ {error}</div>}
        </div>
        {result && (
          <div className="mf-result" ref={resultRef}>
            <div className="mf-result-header">
              <p className="mf-result-title">Your Match Result</p>
              <div className="mf-score-wrap">
                <div className="mf-score-container">
                  <svg className="mf-score-ring" width="128" height="128" viewBox="0 0 128 128">
                    <circle className="mf-score-ring-bg" cx="64" cy="64" r="54"/>
                    <circle className="mf-score-ring-fill" cx="64" cy="64" r="54" stroke={verdictColor} strokeDasharray={`${dash} ${circumference}`} strokeDashoffset="0"/>
                  </svg>
                  <div className="mf-score-center">
                    <span className="mf-score-num" ref={percentageRef} style={{color:verdictColor}}>{result.match_percentage}</span>
                    <span className="mf-score-pct">/ 100</span>
                  </div>
                </div>
                <div className="mf-verdict-badge" ref={verdictRef} style={{background:`${verdictColor}18`,border:`1px solid ${verdictColor}40`,color:verdictColor}}>
                  {result.match_percentage >= 70 ? "✓" : result.match_percentage >= 40 ? "~" : "✗"} {result.verdict}
                </div>
              </div>
              <div className="mf-progress-track"><div ref={progressBarRef} className="mf-progress-fill" style={{background:verdictColor}}/></div>
            </div>
            <div className="mf-result-section" style={{marginBottom:"1rem"}}>
              <p className="mf-result-section-title">Summary</p>
              <p>{result.analysis}</p>
            </div>
            <div className="mf-result-grid">
              {result.strengths.length > 0 && (
                <div className="mf-result-section"><p className="mf-result-section-title">Strengths</p><div>{result.strengths.map((s,i) => <span key={i} className="mf-tag mf-tag-green">✓ {s}</span>)}</div></div>
              )}
              {result.missing_keywords.length > 0 && (
                <div className="mf-result-section"><p className="mf-result-section-title">Missing Keywords</p><div>{result.missing_keywords.map((k,i) => <span key={i} className="mf-tag mf-tag-red">✗ {k}</span>)}</div></div>
              )}
              {result.improvements.length > 0 && (
                <div className="mf-result-section"><p className="mf-result-section-title">Improvements</p><div>{result.improvements.map((imp,i) => <span key={i} className="mf-tag mf-tag-amber">→ {imp}</span>)}</div></div>
              )}
            </div>
            <div style={{textAlign:"center",marginTop:"1.5rem"}}>
              <button onClick={() => { setResult(null); setResumeFile(null); setResumeName(""); setDriveFileId(""); setJobDescription(""); }}
                style={{background:"transparent",border:"1px solid rgba(255,255,255,.12)",color:"rgba(255,255,255,.45)",borderRadius:"10px",padding:".6rem 1.5rem",fontSize:".85rem",cursor:"pointer"}}>
                ↺ Start over
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
