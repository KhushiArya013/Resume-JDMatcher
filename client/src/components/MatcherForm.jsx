import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { gsap } from "gsap";
import { useGoogleLogin } from "@react-oauth/google";

const API_URL = "/api";


export default function MatcherForm() {
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeName, setResumeName] = useState("");
  const [driveFileId, setDriveFileId] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const percentageRef = useRef(null);
  const verdictRef = useRef(null);
  const progressBarRef = useRef(null);

  const [accessToken, setAccessToken] = useState(null);

  // New Google Login Hook for Access Token
  const googleLogin = useGoogleLogin({
    onSuccess: (codeResponse) => {
      setAccessToken(codeResponse.access_token);
    },
    onError: (errorResponse) => {
      console.error(errorResponse);
      setError("Failed to get Google access token. Please log in again.");
    },
    scope: "https://www.googleapis.com/auth/drive.readonly",
  });

  // Load Google Picker API (GIS compatible)
  useEffect(() => {
    // Check if the script has already been added to prevent duplicates
    if (!document.getElementById('google-picker-api-script')) {
      const script = document.createElement("script");
      script.id = 'google-picker-api-script';
      script.src = "https://apis.google.com/js/api.js";
      script.onload = () => {
        window.gapi.load("picker", () => {
          console.log("Google Picker API loaded");
        });
      };
      document.body.appendChild(script);
    }
  }, []);

  // File Handlers
  const handleFileSelect = (e) => {
    const file = e.target.files[0]; // Correctly get the file object
    if (file) {
      setResumeFile(file);
      setResumeName(file.name);
      setDriveFileId(""); // reset Drive selection
    }
  };

  const handleDriveClick = () => {
    if (!accessToken) {
      alert("Please log in with Google to use Drive.");
      googleLogin(); // Trigger Google login to get an access token
      return;
    }

    const view = new window.google.picker.DocsView()
      .setIncludeFolders(true)
      .setSelectFolderEnabled(false)
      .setMimeTypes("application/pdf");

    const picker = new window.google.picker.PickerBuilder()
      .setOAuthToken(accessToken)
      .addView(view)
      .setCallback((data) => {
        if (data.action === window.google.picker.Action.PICKED) {
          const file = data.docs[0]; // Correctly get the selected file
          setDriveFileId(file.id);
          setResumeName(file.name);
          setResumeFile(null);
        }
      })
      .build();

    picker.setVisible(true);
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!jobDescription || (!resumeFile && !driveFileId)) {
      setError("Please provide a job description and either upload a resume or select from Drive.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    const formData = new FormData();
    formData.append("job_description", jobDescription);

    if (resumeFile) {
      formData.append("resume", resumeFile);
    } else if (driveFileId) {
      formData.append("drive_file_id", driveFileId);
      formData.append("token", accessToken); // Ensure backend accepts 'token'
    }

    try {
      const response = await axios.post(`${API_URL}/match`, formData, {
        headers: {
          // No need to set Content-Type for FormData, axios does it automatically
          // for multipart/form-data with the correct boundary
        },
      });

      const data = response.data;
      data.analysis = data.analysis?.trim() || "No details provided.";
      data.verdict = data.verdict?.trim() || "No verdict";
      data.match_percentage = data.match_percentage || 0;

      setResult(data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // Animations
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
        {/* Local Upload */}
        <div>
          <label>Upload Resume (PDF)</label>
          <input type="file" accept="application/pdf" onChange={handleFileSelect} />
          {resumeName && <p>Selected file: {resumeName}</p>}
        </div>

        {/* Google Drive Selection */}
        <div>
          <label>Select from Google Drive</label>
          <button type="button" onClick={handleDriveClick}>
            Pick from Drive
          </button>
          {driveFileId && <p>Selected Drive File: {resumeName}</p>}
        </div>

        {/* Job Description */}
        <div>
          <label>Job Description</label>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            rows={5}
            placeholder="Enter the job description here..."
          />
        </div>

        {/* Submit */}
        <button onClick={handleSubmit} disabled={loading}>
          {loading ? "Matching..." : "Match Resume"}
        </button>

        {error && <p className="text-red-300">{error}</p>}

        {/* Result */}
        {result && (
          <div className="result-box animate-fade-in">
            <h2>Match Result</h2>
            <p>
              <strong>Percentage:</strong> <span ref={percentageRef}>{result.match_percentage}</span>%
            </p>
            <p>
              <strong>Verdict:</strong> <span ref={verdictRef}>{result.verdict}</span>
            </p>
            <p style={{ marginTop: "1rem" }}>
              <strong>Analysis:</strong>
              <br />
              {result.analysis}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
