import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useGoogleLogin } from "@react-oauth/google";

const API_URL = "http://localhost:8000/api";


export default function CoverLetterForm() {
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeName, setResumeName] = useState("");
  const [driveFileId, setDriveFileId] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [yourName, setYourName] = useState("");
  const [tone, setTone] = useState("formal");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [accessToken, setAccessToken] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [copied, setCopied] = useState(false);

  const resultRef = useRef(null);
  const letterRef = useRef(null);

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
      setResumeFile(file);
      setResumeName(file.name);
      setDriveFileId("");
      setError("");
    } else {
      setError("Please upload a PDF file.");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files[0]);
  };

  const handleDriveClick = () => {
    if (!accessToken) { googleLogin(); return; }
    const view = new window.google.picker.DocsView()
      .setIncludeFolders(true)
      .setSelectFolderEnabled(false)
      .setMimeTypes("application/pdf");
    const picker = new window.google.picker.PickerBuilder()
      .setOAuthToken(accessToken)
      .addView(view)
      .setCallback((data) => {
        if (data.action === window.google.picker.Action.PICKED) {
          const file = data.docs[0];
          setDriveFileId(file.id);
          setResumeName(file.name);
          setResumeFile(null);
        }
      })
      .build();
    picker.setVisible(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!jobDescription || (!resumeFile && !driveFileId)) {
      setError("Please provide a job description and a resume.");
      return;
    }
    if (!yourName || !companyName || !jobTitle) {
      setError("Please fill in your name, job title, and company name.");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);

    const formData = new FormData();
    formData.append("job_description", jobDescription);
    formData.append("job_title", jobTitle);
    formData.append("company_name", companyName);
    formData.append("your_name", yourName);
    formData.append("tone", tone);
    if (resumeFile) {
      formData.append("resume", resumeFile);
    } else if (driveFileId) {
      formData.append("drive_file_id", driveFileId);
      formData.append("token", accessToken);
    }

    try {
      const response = await axios.post(`${API_URL}/coverletter`, formData);
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [result]);

  const handleCopy = () => {
    if (letterRef.current) {
      navigator.clipboard.writeText(letterRef.current.innerText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReset = () => {
    setResult(null);
    setResumeFile(null);
    setResumeName("");
    setDriveFileId("");
    setJobDescription("");
    setJobTitle("");
    setCompanyName("");
    setYourName("");
    setTone("formal");
  };

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0a0f; }

        .cl-root {
          min-height: 100vh;
          background: #0a0a0f;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          color: #fff;
          padding: 2rem 1.25rem 4rem;
        }

        .cl-header {
          max-width: 720px; margin: 0 auto 2.5rem;
          text-align: center; padding-top: 1.5rem;
        }
        .cl-badge {
          display: inline-flex; align-items: center; gap: 0.45rem;
          background: rgba(167,139,250,0.08);
          border: 1px solid rgba(167,139,250,0.2);
          border-radius: 999px; padding: 0.3rem 0.9rem;
          font-size: 0.75rem; color: #a78bfa; margin-bottom: 1.25rem;
        }
        .cl-badge-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #34d399; box-shadow: 0 0 6px #34d399;
        }
        .cl-title {
          font-size: clamp(1.9rem, 5vw, 2.8rem);
          font-weight: 800; letter-spacing: -0.03em; margin-bottom: 0.6rem;
        }
        .cl-title span {
          background: linear-gradient(135deg,#a78bfa,#7c3aed);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }
        .cl-subtitle { font-size: 0.95rem; color: rgba(255,255,255,0.4); line-height: 1.65; }

        .cl-card {
          max-width: 720px; margin: 0 auto;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 24px; padding: 2.25rem;
        }

        .cl-label {
          display: block; font-size: 0.8rem; font-weight: 600;
          color: rgba(255,255,255,0.5); text-transform: uppercase;
          letter-spacing: 0.08em; margin-bottom: 0.6rem;
        }

        .cl-dropzone {
          border: 2px dashed rgba(167,139,250,0.25);
          border-radius: 16px; padding: 2.25rem 1.5rem;
          text-align: center; cursor: pointer;
          transition: border-color 0.2s, background 0.2s;
          background: rgba(167,139,250,0.03);
          margin-bottom: 1rem;
        }
        .cl-dropzone.active, .cl-dropzone:hover {
          border-color: rgba(167,139,250,0.5);
          background: rgba(167,139,250,0.06);
        }
        .cl-dropzone-icon { font-size: 2rem; margin-bottom: 0.6rem; }
        .cl-dropzone-text { font-size: 0.9rem; color: rgba(255,255,255,0.5); }
        .cl-dropzone-text strong { color: #a78bfa; }

        .cl-file-selected {
          display: flex; align-items: center; gap: 0.6rem;
          background: rgba(52,211,153,0.08); border: 1px solid rgba(52,211,153,0.2);
          border-radius: 10px; padding: 0.6rem 1rem;
          font-size: 0.85rem; color: #34d399; margin-bottom: 1rem;
        }

        .cl-or {
          display: flex; align-items: center; gap: 0.75rem;
          margin: 0.75rem 0; color: rgba(255,255,255,0.2); font-size: 0.78rem;
        }
        .cl-or::before, .cl-or::after {
          content: ''; flex: 1; height: 1px; background: rgba(255,255,255,0.08);
        }

        .cl-drive-btn {
          width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.6rem;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px; padding: 0.8rem;
          font-size: 0.9rem; color: rgba(255,255,255,0.65);
          cursor: pointer; transition: all 0.2s;
        }
        .cl-drive-btn:hover {
          border-color: rgba(167,139,250,0.35);
          color: #a78bfa; background: rgba(167,139,250,0.05);
        }

        .cl-input {
          width: 100%; background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 14px; padding: 0.8rem 1.1rem;
          font-size: 0.9rem; color: #fff;
          font-family: inherit; transition: border-color 0.2s;
          outline: none;
        }
        .cl-input::placeholder { color: rgba(255,255,255,0.25); }
        .cl-input:focus { border-color: rgba(167,139,250,0.45); }

        .cl-textarea {
          width: 100%; background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 14px; padding: 1rem 1.1rem;
          font-size: 0.9rem; color: #fff; resize: vertical;
          min-height: 140px; line-height: 1.65;
          font-family: inherit; transition: border-color 0.2s;
          outline: none;
        }
        .cl-textarea::placeholder { color: rgba(255,255,255,0.25); }
        .cl-textarea:focus { border-color: rgba(167,139,250,0.45); }

        .cl-row {
          display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;
        }

        .cl-field { margin-bottom: 1.75rem; }

        /* Tone selector */
        .cl-tone-group {
          display: flex; gap: 0.75rem;
        }
        .cl-tone-btn {
          flex: 1; padding: 0.7rem;
          border-radius: 12px; font-size: 0.88rem; font-weight: 600;
          cursor: pointer; transition: all 0.2s;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.45);
        }
        .cl-tone-btn.selected {
          border-color: rgba(167,139,250,0.5);
          background: rgba(167,139,250,0.1);
          color: #a78bfa;
        }

        .cl-submit {
          width: 100%;
          background: linear-gradient(135deg,#7c3aed,#a78bfa);
          border: none; border-radius: 14px;
          padding: 1rem; font-size: 1rem; font-weight: 700;
          color: #fff; cursor: pointer;
          transition: opacity 0.2s, transform 0.15s;
          display: flex; align-items: center; justify-content: center; gap: 0.5rem;
        }
        .cl-submit:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
        .cl-submit:disabled { opacity: 0.5; cursor: not-allowed; }

        .cl-spinner {
          width: 18px; height: 18px; border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .cl-error {
          background: rgba(248,113,113,0.08);
          border: 1px solid rgba(248,113,113,0.2);
          border-radius: 10px; padding: 0.75rem 1rem;
          font-size: 0.85rem; color: #f87171; margin-top: 1rem;
        }

        /* Result */
        .cl-result {
          max-width: 720px; margin: 2rem auto 0;
        }
        .cl-result-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 24px; padding: 2.25rem;
        }
        .cl-result-top {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 1.5rem; flex-wrap: wrap; gap: 0.75rem;
        }
        .cl-result-title {
          font-size: 1rem; font-weight: 700; color: rgba(255,255,255,0.6);
        }
        .cl-result-actions { display: flex; gap: 0.6rem; }
        .cl-copy-btn {
          display: flex; align-items: center; gap: 0.4rem;
          background: rgba(167,139,250,0.1);
          border: 1px solid rgba(167,139,250,0.25);
          color: #a78bfa; border-radius: 10px;
          padding: 0.5rem 1rem; font-size: 0.82rem; font-weight: 600;
          cursor: pointer; transition: all 0.2s;
        }
        .cl-copy-btn:hover { background: rgba(167,139,250,0.18); }
        .cl-copy-btn.success {
          background: rgba(52,211,153,0.1);
          border-color: rgba(52,211,153,0.3);
          color: #34d399;
        }
        .cl-letter {
          font-size: 0.92rem; line-height: 1.85;
          color: rgba(255,255,255,0.8);
          white-space: pre-wrap;
          border-top: 1px solid rgba(255,255,255,0.07);
          padding-top: 1.5rem;
        }
        .cl-reset-btn {
          background: transparent;
          border: 1px solid rgba(255,255,255,0.12);
          color: rgba(255,255,255,0.4); border-radius: 10px;
          padding: 0.5rem 1rem; font-size: 0.82rem;
          cursor: pointer; transition: all 0.2s;
        }
        .cl-reset-btn:hover { border-color: rgba(248,113,113,0.4); color: #f87171; }

        @media(max-width:600px){
          .cl-card { padding: 1.5rem 1.1rem; }
          .cl-row { grid-template-columns: 1fr; }
          .cl-result-card { padding: 1.5rem 1.1rem; }
        }
      `}</style>

      <div className="cl-root">

        {/* Header */}
        <div className="cl-header">
          <div className="cl-badge">
            <span className="cl-badge-dot" />
            AI Cover Letter Generator
          </div>
          <h1 className="cl-title">Cover <span>Letter Generator</span></h1>
          <p className="cl-subtitle">
            Upload your resume, paste the job description, and get a tailored
            cover letter generated instantly using AI.
          </p>
        </div>

        {/* Form */}
        <div className="cl-card">

          {/* Resume */}
          <div className="cl-field">
            <label className="cl-label">Resume (PDF)</label>
            {resumeName && (resumeFile || driveFileId) ? (
              <div className="cl-file-selected">
                <span>📄</span>
                <span>{resumeName}</span>
                <button
                  onClick={() => { setResumeFile(null); setResumeName(""); setDriveFileId(""); }}
                  style={{ marginLeft:"auto", background:"none", border:"none", color:"#f87171", cursor:"pointer", fontSize:"0.8rem" }}
                >
                  Remove
                </button>
              </div>
            ) : (
              <div
                className={`cl-dropzone ${dragOver ? "active" : ""}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => document.getElementById("cl-file-input").click()}
              >
                <div className="cl-dropzone-icon">📂</div>
                <p className="cl-dropzone-text">
                  <strong>Click to upload</strong> or drag and drop your PDF here
                </p>
                <p style={{fontSize:"0.75rem", color:"rgba(255,255,255,0.25)", marginTop:"0.4rem"}}>PDF only · Max 10MB</p>
              </div>
            )}
            <input
              id="cl-file-input"
              type="file"
              accept="application/pdf"
              style={{ display: "none" }}
              onChange={(e) => handleFileSelect(e.target.files[0])}
            />
            <div className="cl-or">or</div>
            <button type="button" className="cl-drive-btn" onClick={handleDriveClick}>
              <svg width="18" height="18" viewBox="0 0 87.3 78" fill="none">
                <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3L27.5 51H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                <path d="M43.65 25L29.9 1.2C28.55 2 27.4 3.1 26.6 4.5L1.2 46.5C.4 47.9 0 49.45 0 51h27.5z" fill="#00ac47"/>
                <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75L86.1 55.5c.8-1.4 1.2-2.95 1.2-4.5H59.8l5.85 10.35z" fill="#ea4335"/>
                <path d="M43.65 25L57.4 1.2C56.05.4 54.5 0 52.9 0H34.4c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
                <path d="M59.8 51H87.3c0-1.55-.4-3.1-1.2-4.5L60.7 4.5C59.9 3.1 58.75 2 57.4 1.2L43.65 25z" fill="#2684fc"/>
                <path d="M43.65 53.35L27.5 51 13.75 76.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#ffba00"/>
              </svg>
              Pick from Google Drive
            </button>
          </div>

          {/* Name + Company row */}
          <div className="cl-field">
            <div className="cl-row">
              <div>
                <label className="cl-label">Your Name</label>
                <input
                  className="cl-input"
                  value={yourName}
                  onChange={(e) => setYourName(e.target.value)}
                  placeholder="Khushi Arya"
                />
              </div>
              <div>
                <label className="cl-label">Company Name</label>
                <input
                  className="cl-input"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Salesforce"
                />
              </div>
            </div>
          </div>

          {/* Job Title */}
          <div className="cl-field">
            <label className="cl-label">Job Title</label>
            <input
              className="cl-input"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="Associate Technical Support Engineer"
            />
          </div>

          {/* Tone */}
          <div className="cl-field">
            <label className="cl-label">Tone</label>
            <div className="cl-tone-group">
              {[
                { value: "formal",      label: "🎩 Formal" },
                { value: "casual",      label: "😊 Casual" },
                { value: "enthusiastic",label: "🚀 Enthusiastic" },
                { value: "concise",     label: "⚡ Concise" },
              ].map((t) => (
                <button
                  key={t.value}
                  type="button"
                  className={`cl-tone-btn ${tone === t.value ? "selected" : ""}`}
                  onClick={() => setTone(t.value)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Job Description */}
          <div className="cl-field">
            <label className="cl-label">Job Description</label>
            <textarea
              className="cl-textarea"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={6}
              placeholder="Paste the full job description here..."
            />
            <p style={{fontSize:"0.75rem", color:"rgba(255,255,255,0.2)", marginTop:"0.4rem"}}>
              {jobDescription.length} characters · More detail = better cover letter
            </p>
          </div>

          {/* Submit */}
          <button className="cl-submit" onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <span className="cl-spinner" />
                Generating your cover letter…
              </>
            ) : (
              "Generate Cover Letter →"
            )}
          </button>

          {error && <div className="cl-error">⚠ {error}</div>}
        </div>

        {/* Result */}
        {result && (
          <div className="cl-result" ref={resultRef}>
            <div className="cl-result-card">
              <div className="cl-result-top">
                <p className="cl-result-title">✉ Your Cover Letter</p>
                <div className="cl-result-actions">
                  <button
                    className={`cl-copy-btn ${copied ? "success" : ""}`}
                    onClick={handleCopy}
                  >
                    {copied ? "✓ Copied!" : "⎘ Copy"}
                  </button>
                  <button className="cl-reset-btn" onClick={handleReset}>
                    ↺ Start over
                  </button>
                </div>
              </div>
              <div className="cl-letter" ref={letterRef}>
                {result.cover_letter || result.text || result.output || JSON.stringify(result)}
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
} 