import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { gsap } from "gsap";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function MatcherForm() {
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeName, setResumeName] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const percentageRef = useRef(null);
  const verdictRef = useRef(null);
  const progressBarRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setResumeFile(file);
      setResumeName(file.name);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!resumeFile || !jobDescription) {
      setError("Please select a resume and enter a job description.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    const formData = new FormData();
    formData.append("resume", resumeFile);
    formData.append("job_description", jobDescription);

    try {
      const response = await axios.post(`${API_URL}/match`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const data = response.data;

      // Ensure fields are strings and trim long text for display
      data.analysis = data.analysis ? data.analysis.toString().trim() : "No details provided.";
      data.verdict = data.verdict ? data.verdict.toString().trim() : "No verdict";
      data.match_percentage = data.match_percentage || 0;

      setResult(data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (result) {
      gsap.fromTo(
        percentageRef.current,
        { innerText: 0 },
        { innerText: result.match_percentage, duration: 1.5, snap: { innerText: 1 } }
      );
      gsap.fromTo(verdictRef.current, { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 1 });
      gsap.fromTo(progressBarRef.current, { width: "0%" }, { width: `${result.match_percentage}%`, duration: 1.5 });
    }
  }, [result]);

  return (
    <div className="container">
      <h1>Resume Matcher</h1>

      <div className="space-y-6">
        <div>
          <label>Upload Resume (PDF)</label>
          <input type="file" accept="application/pdf" onChange={handleFileSelect} />
        </div>

        <div>
          <label>Job Description</label>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            rows={5}
            placeholder="Enter the job description here..."
          />
        </div>

        <button onClick={handleSubmit} disabled={loading}>
          {loading ? "Matching..." : "Match Resume"}
        </button>

        {error && <p className="text-red-300">{error}</p>}

        {result && (
          <div className="result-box animate-fade-in">
            <h2>Match Result</h2>
            <p>
              <strong>Percentage:</strong>{" "}
              <span ref={percentageRef}>{result.match_percentage}</span>%
            </p>
            <p>
              <strong>Verdict:</strong>{" "}
              <span ref={verdictRef}>{result.verdict}</span>
            </p>
            <p style={{ marginTop: "1rem" }}>
              <strong>Analysis:</strong>
              <br />
              {result.analysis
                .split("\n")
                .slice(0, 5)
                .map((line, idx) => (
                  <span key={idx}>
                    {line}
                    <br />
                  </span>
                ))}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
