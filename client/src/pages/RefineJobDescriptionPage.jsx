import React, { useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function RefineJobDescriptionPage() {
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!jobDescription) {
      setError("Please enter a job description.");
      return;
    }

    setError("");
    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("job_description", jobDescription);

      const response = await axios.post(`${API_URL}/refine-jd`, formData);
      const data = response.data;

      setResult({
        refined_jd: data.refined_jd || "No refined job description returned.",
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
      <h1>Refine Job Description</h1>

      <div className="space-y-6">
        <div>
          <label>Job Description</label>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            rows={6}
            placeholder="Enter the job description here..."
          />
        </div>

        <button onClick={handleSubmit} disabled={loading}>
          {loading ? "Refining..." : "Refine Job Description"}
        </button>

        {error && <p className="text-red-300">{error}</p>}

        {result && (
          <div className="result-box animate-fade-in">
            <h2>Refined Job Description</h2>
            <p>
              {result.refined_jd
                .split("\n")
                .slice(0, 8)
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
