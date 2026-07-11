import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { gsap } from "gsap";
import { useGoogleLogin } from "@react-oauth/google";

const API_URL = "http://localhost:8000/api";

export default function ImproveResumePage() {
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
    setError(""); setLoading(true); setResult(null);
    try {
      const formData = new FormData();
      formData.append("job_description", jobDescription);
      if (resumeFile) formData.append("resume", resumeFile);
      else if (driveFileId) { formData.append("drive_file_id", driveFileId); formData.append("token", accessToken); }
      const response = await axios.post(`${API_URL}/improve-resume`, formData);
      const data = response.data;
      setResult({
        match_percentage: data.overall_score || 0,
        strengths: data.content_improvements || [],
        gaps: data.missing_sections || [],
        suggestions: data.action_plan || "No suggestions provided.",
      });
    } catch (err) {
      setError(err.response?.data?.detail || "Something went wrong. Please try again.");
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (result) {
      if (resultRef.current) resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      if (percentageRef.current) gsap.fromTo(percentageRef.current, { innerText: 0 }, { innerText: result.match_percentage, duration: 1.5, snap: { innerText: 1 } });
      if (progressBarRef.current) gsap.fromTo(progressBarRef.current, { width: "0%" }, { width: `${result.match_percentage}%`, duration: 1.5, ease: "power2.out" });
    }
  }, [result]);

  const scoreColor = result?.match_percentage >= 70 ? "#34d399" : result?.match_percentage >= 40 ? "#fbbf24" : "#f87171";
  const circumference = 2 * Math.PI * 54;
  const dash = ((result?.match_percentage || 0) / 100) * circumference;

  return (
    <>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{background:#0a0a0f}
        .ir-root{min-height:100vh;background:#0a0a0f;font-family:'Inter',-apple-system,sans-serif;color:#fff;padding:6rem 1.25rem 4rem}
        .ir-header{max-width:720px;margin:0 auto 2.5rem;text-align:center;padding-top:1.5rem}
        .ir-badge{display:inline-flex;align-items:center;gap:.45rem;background:rgba(167,139,250,.08);border:1px solid rgba(167,139,250,.2);border-radius:999px;padding:.3rem .9rem;font-size:.75rem;color:#a78bfa;margin-bottom:1.25rem}
        .ir-badge-dot{width:6px;height:6px;border-radius:50%;background:#34d399;box-shadow:0 0 6px #34d399}
        .ir-title{font-size:clamp(1.9rem,5vw,2.8rem);font-weight:800;letter-spacing:-.03em;margin-bottom:.6rem}
        .ir-title span{background:linear-gradient(135deg,#a78bfa,#7c3aed);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
        .ir-subtitle{font-size:.95rem;color:rgba(255,255,255,.4);line-height:1.65}
        .ir-card{max-width:720px;margin:0 auto;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:24px;padding:2.25rem}
        .ir-label{display:block;font-size:.8rem;font-weight:600;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:.08em;margin-bottom:.6rem}
        .ir-dropzone{border:2px dashed rgba(167,139,250,.25);border-radius:16px;padding:2.25rem 1.5rem;text-align:center;cursor:pointer;transition:border-color .2s,background .2s;background:rgba(167,139,250,.03);margin-bottom:1rem}
        .ir-dropzone.active,.ir-dropzone:hover{border-color:rgba(167,139,250,.5);background:rgba(167,139,250,.06)}
        .ir-dropzone-icon{font-size:2rem;margin-bottom:.6rem}
        .ir-dropzone-text{font-size:.9rem;color:rgba(255,255,255,.5)}
        .ir-dropzone-text strong{color:#a78bfa}
        .ir-file-selected{display:flex;align-items:center;gap:.6rem;background:rgba(52,211,153,.08);border:1px solid rgba(52,211,153,.2);border-radius:10px;padding:.6rem 1rem;font-size:.85rem;color:#34d399;margin-bottom:1rem}
        .ir-or{display:flex;align-items:center;gap:.75rem;margin:.75rem 0;color:rgba(255,255,255,.2);font-size:.78rem}
        .ir-or::before,.ir-or::after{content:'';flex:1;height:1px;background:rgba(255,255,255,.08)}
        .ir-drive-btn{width:100%;display:flex;align-items:center;justify-content:center;gap:.6rem;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:.8rem;font-size:.9rem;color:rgba(255,255,255,.65);cursor:pointer;transition:all .2s}
        .ir-drive-btn:hover{border-color:rgba(167,139,250,.35);color:#a78bfa;background:rgba(167,139,250,.05)}
        .ir-textarea{width:100%;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:1rem 1.1rem;font-size:.9rem;color:#fff;resize:vertical;min-height:140px;line-height:1.65;font-family:inherit;transition:border-color .2s;outline:none}
        .ir-textarea::placeholder{color:rgba(255,255,255,.25)}
        .ir-textarea:focus{border-color:rgba(167,139,250,.45)}
        .ir-field{margin-bottom:1.75rem}
        .ir-submit{width:100%;background:linear-gradient(135deg,#7c3aed,#a78bfa);border:none;border-radius:14px;padding:1rem;font-size:1rem;font-weight:700;color:#fff;cursor:pointer;transition:opacity .2s,transform .15s;display:flex;align-items:center;justify-content:center;gap:.5rem}
        .ir-submit:hover:not(:disabled){opacity:.88;transform:translateY(-1px)}
        .ir-submit:disabled{opacity:.5;cursor:not-allowed}
        .ir-spinner{width:18px;height:18px;border-radius:50%;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;animation:spin .7s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}
        .ir-error{background:rgba(248,113,113,.08);border:1px solid rgba(248,113,113,.2);border-radius:10px;padding:.75rem 1rem;font-size:.85rem;color:#f87171;margin-top:1rem}
        .ir-result{max-width:720px;margin:2rem auto 0}
        .ir-score-wrap{text-align:center;margin-bottom:2rem}
        .ir-score-title{font-size:1.1rem;font-weight:700;color:rgba(255,255,255,.6);margin-bottom:1.5rem}
        .ir-score-container{position:relative;width:128px;height:128px;margin:0 auto .75rem}
        .ir-score-ring{transform:rotate(-90deg)}
        .ir-score-ring-bg{fill:none;stroke:rgba(255,255,255,.07);stroke-width:8}
        .ir-score-ring-fill{fill:none;stroke-width:8;stroke-linecap:round}
        .ir-score-center{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
        .ir-score-num{font-size:2rem;font-weight:800;letter-spacing:-.03em}
        .ir-score-pct{font-size:.75rem;color:rgba(255,255,255,.4)}
        .ir-progress-track{height:6px;border-radius:999px;background:rgba(255,255,255,.07);overflow:hidden;margin:1rem 0 2rem}
        .ir-progress-fill{height:100%;border-radius:999px;width:0%}
        .ir-result-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem;margin-bottom:1rem}
        .ir-result-section{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:16px;padding:1.25rem}
        .ir-result-section-title{font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:rgba(255,255,255,.35);margin-bottom:.85rem}
        .ir-result-section p{font-size:.88rem;color:rgba(255,255,255,.7);line-height:1.7}
        .ir-tag{display:inline-block;border-radius:6px;padding:.25rem .6rem;font-size:.78rem;font-weight:500;margin:.2rem}
        .ir-tag-green{background:rgba(52,211,153,.1);color:#34d399}
        .ir-tag-red{background:rgba(248,113,113,.1);color:#f87171}
        .ir-back{display:inline-flex;align-items:center;gap:.4rem;color:rgba(255,255,255,.4);font-size:.85rem;text-decoration:none;margin-bottom:1.5rem;transition:color .2s}
        .ir-back:hover{color:#a78bfa}
        @media(max-width:600px){.ir-card{padding:1.5rem 1.1rem}.ir-result-grid{grid-template-columns:1fr}}
      `}</style>
      <div className="ir-root">
        <div className="ir-header">
          <a href="/" className="ir-back">← Back to Home</a>
          <div className="ir-badge"><span className="ir-badge-dot"/>AI Resume Analyzer</div>
          <h1 className="ir-title">Improve My <span>Resume</span></h1>
          <p className="ir-subtitle">Upload your resume and a target job description. Get an overall score, content improvements, missing sections, and an action plan.</p>
        </div>
        <div className="ir-card">
          <div className="ir-field">
            <label className="ir-label">Resume (PDF)</label>
            {resumeName && (resumeFile || driveFileId) ? (
              <div className="ir-file-selected">
                <span>📄</span><span>{resumeName}</span>
                <button onClick={() => { setResumeFile(null); setResumeName(""); setDriveFileId(""); }} style={{marginLeft:"auto",background:"none",border:"none",color:"#f87171",cursor:"pointer",fontSize:".8rem"}}>Remove</button>
              </div>
            ) : (
              <div className={`ir-dropzone ${dragOver ? "active" : ""}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)} onDrop={handleDrop}
                onClick={() => document.getElementById("ir-file-input").click()}>
                <div className="ir-dropzone-icon">📂</div>
                <p className="ir-dropzone-text"><strong>Click to upload</strong> or drag and drop your PDF here</p>
                <p style={{fontSize:".75rem",color:"rgba(255,255,255,.25)",marginTop:".4rem"}}>PDF only · Max 10MB</p>
              </div>
            )}
            <input id="ir-file-input" type="file" accept="application/pdf" style={{display:"none"}} onChange={(e) => handleFileSelect(e.target.files[0])}/>
            <div className="ir-or">or</div>
            <button type="button" className="ir-drive-btn" onClick={handleDriveClick}>
              <svg width="18" height="18" viewBox="0 0 87.3 78" fill="none"><path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3L27.5 51H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/><path d="M43.65 25L29.9 1.2C28.55 2 27.4 3.1 26.6 4.5L1.2 46.5C.4 47.9 0 49.45 0 51h27.5z" fill="#00ac47"/><path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75L86.1 55.5c.8-1.4 1.2-2.95 1.2-4.5H59.8l5.85 10.35z" fill="#ea4335"/><path d="M43.65 25L57.4 1.2C56.05.4 54.5 0 52.9 0H34.4c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/><path d="M59.8 51H87.3c0-1.55-.4-3.1-1.2-4.5L60.7 4.5C59.9 3.1 58.75 2 57.4 1.2L43.65 25z" fill="#2684fc"/><path d="M43.65 53.35L27.5 51 13.75 76.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#ffba00"/></svg>
              Pick from Google Drive
            </button>
          </div>
          <div className="ir-field">
            <label className="ir-label">Job Description</label>
            <textarea className="ir-textarea" value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} rows={6} placeholder="Paste the job description you're targeting..."/>
            <p style={{fontSize:".75rem",color:"rgba(255,255,255,.2)",marginTop:".4rem"}}>{jobDescription.length} characters</p>
          </div>
          <button className="ir-submit" onClick={handleSubmit} disabled={loading}>
            {loading ? <><span className="ir-spinner"/>Analyzing your resume…</> : "Improve My Resume →"}
          </button>
          {error && <div className="ir-error">⚠ {error}</div>}
        </div>
        {result && (
          <div className="ir-result" ref={resultRef}>
            <div className="ir-score-wrap">
              <p className="ir-score-title">Your Resume Score</p>
              <div className="ir-score-container">
                <svg className="ir-score-ring" width="128" height="128" viewBox="0 0 128 128">
                  <circle className="ir-score-ring-bg" cx="64" cy="64" r="54"/>
                  <circle className="ir-score-ring-fill" cx="64" cy="64" r="54" stroke={scoreColor} strokeDasharray={`${dash} ${circumference}`} strokeDashoffset="0"/>
                </svg>
                <div className="ir-score-center">
                  <span className="ir-score-num" ref={percentageRef} style={{color:scoreColor}}>{result.match_percentage}</span>
                  <span className="ir-score-pct">/ 100</span>
                </div>
              </div>
              <div className="ir-progress-track"><div ref={progressBarRef} className="ir-progress-fill" style={{background:scoreColor}}/></div>
            </div>
            <div className="ir-result-grid">
              {result.strengths.length > 0 && (
                <div className="ir-result-section">
                  <p className="ir-result-section-title">Content Improvements</p>
                  <div>{result.strengths.map((s,i) => <span key={i} className="ir-tag ir-tag-green">✓ {s}</span>)}</div>
                </div>
              )}
              {result.gaps.length > 0 && (
                <div className="ir-result-section">
                  <p className="ir-result-section-title">Missing Sections</p>
                  <div>{result.gaps.map((g,i) => <span key={i} className="ir-tag ir-tag-red">✗ {g}</span>)}</div>
                </div>
              )}
            </div>
            <div className="ir-result-section" style={{marginBottom:"1rem"}}>
              <p className="ir-result-section-title">Action Plan</p>
              <p>{result.suggestions}</p>
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