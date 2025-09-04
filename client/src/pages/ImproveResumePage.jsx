import React, { useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function ImproveResumePage() {
  const [resumeFile, setResumeFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!resumeFile || !jobDescription) {
      setError("Please upload a resume and enter a job description.");
      return;
    }

    setError("");
    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("resume", resumeFile);
      formData.append("job_description", jobDescription);

      const response = await axios.post(`${API_URL}/improve-resume`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const data = response.data;

      // Ensure all fields are strings
      setResult({
        strengths: data.strengths || "No strengths provided.",
        gaps: data.gaps || "No gaps provided.",
        suggestions: data.suggestions || "No suggestions provided.",
      });
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Improve My Resume</h1>

      <div className="space-y-6">
        <div>
          <label>Upload Resume (PDF)</label>
          <input type="file" accept="application/pdf" onChange={(e) => setResumeFile(e.target.files[0])} />
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
          {loading ? "Analyzing..." : "Improve Resume"}
        </button>

        {error && <p className="text-red-300">{error}</p>}

        {result && (
          <div className="result-box animate-fade-in">
            <h2>Resume Improvement Analysis</h2>

            <p>
              <strong>Strengths:</strong>
              <br />
              {result.strengths
                .split("\n")
                .slice(0, 5)
                .map((line, idx) => (
                  <span key={idx}>
                    {line}
                    <br />
                  </span>
                ))}
            </p>

            <p>
              <strong>Gaps:</strong>
              <br />
              {result.gaps
                .split("\n")
                .slice(0, 5)
                .map((line, idx) => (
                  <span key={idx}>
                    {line}
                    <br />
                  </span>
                ))}
            </p>

            <p>
              <strong>Suggestions:</strong>
              <br />
              {result.suggestions
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
