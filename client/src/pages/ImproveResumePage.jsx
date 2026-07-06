import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useGoogleLogin } from "@react-oauth/google";
import { gsap } from "gsap";

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

  const percentageRef = useRef(null);
  const progressBarRef = useRef(null);

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

  useEffect(() => {
    if (!document.getElementById("google-picker-api-script")) {
      const script = document.createElement("script");
      script.id = "google-picker-api-script";
      script.src = "https://apis.google.com/js/api.js";
      script.onload = () => {
        window.gapi.load("picker", () => {
          console.log("Google Picker API loaded");
        });
      };
      document.body.appendChild(script);
    }
  }, []);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setResumeFile(file);
      setResumeName(file.name);
      setDriveFileId("");
    }
  };

  const handleDriveClick = () => {
    if (!accessToken) {
      alert("Please log in with Google to use Drive.");
      googleLogin();
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
      setError("Please provide a job description and either upload a resume or select from Drive.");
      return;
    }
    if (driveFileId && !accessToken) {
      setError("Please log in with Google to use Drive.");
      return;
    }

    setError("");
    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("job_description", jobDescription);

      if (resumeFile) {
        formData.append("resume", resumeFile);
      } else if (driveFileId) {
        formData.append("drive_file_id", driveFileId);
        formData.append("token", accessToken);
      }

      const response = await axios.post(`${API_URL}/improve-resume`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const data = response.data;
setResult({
  match_percentage: data.overall_score || 0,
  strengths: data.content_improvements?.join(", ") || "No strengths provided.",
  gaps: data.missing_sections?.join(", ") || "No gaps provided.",
  suggestions: data.action_plan || "No suggestions provided.",
});
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (result && percentageRef.current && progressBarRef.current) {
      gsap.fromTo(
        percentageRef.current,
        { innerText: 0 },
        { innerText: result.match_percentage, duration: 1.5, snap: { innerText: 1 } }
      );
      gsap.fromTo(progressBarRef.current, { width: "0%" }, { width: `${result.match_percentage}%`, duration: 1.5 });
    }
  }, [result]);

  return (
    <motion.div
      initial={{ opacity: 0, x: -100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen flex flex-col items-center justify-start py-12 bg-cover bg-center"
      style={{ backgroundImage: "url('/bg.jpg')" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/15 backdrop-blur-lg shadow-2xl rounded-2xl p-10 w-full max-w-lg text-center border border-white/30 relative"
      >
        <Link to="/" className="text-gray-300 hover:text-white absolute top-4 left-4">
          ← Back to Home
        </Link>
        <h1 className="text-3xl font-extrabold text-white drop-shadow-lg mb-6">
          Improve My Resume
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6 text-left">
          {/* Local Upload */}
          <div>
            <label className="block text-gray-100 font-medium mb-2">Upload Resume (PDF):</label>
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileSelect}
              className="block w-full text-sm text-white 
              file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 
              file:text-sm file:font-semibold file:bg-yellow-400 file:text-gray-900 hover:file:bg-yellow-300"
            />
            {resumeName && resumeFile && <p className="text-gray-200 mt-2">Selected file: {resumeName}</p>}
          </div>

          {/* Google Drive Selection */}
          <div className="flex items-center justify-between space-x-4">
            <button
              type="button"
              onClick={handleDriveClick}
              className="flex-1 py-3 px-6 rounded-full font-bold transition-all duration-300 text-sm shadow-lg bg-yellow-400 hover:bg-yellow-300 text-gray-900"
            >
              Pick from Drive
            </button>
            {driveFileId && <p className="text-gray-200">Selected Drive File: {resumeName}</p>}
          </div>

          {/* Job Description */}
          <div>
            <label className="block text-white font-medium mb-2">Enter Job Description:</label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="w-full p-3 rounded-lg border border-white/20 focus:ring-2 focus:ring-yellow-400 
              bg-white/10 text-white placeholder-gray-400"
              placeholder="Enter job description here..."
              rows={5}
            ></textarea>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-6 rounded-full font-bold transition-all duration-300 text-sm shadow-lg disabled:bg-gray-500 disabled:cursor-not-allowed bg-yellow-400 hover:bg-yellow-300 text-gray-900"
          >
            {loading ? "Analyzing..." : "Improve Resume"}
          </button>
        </form>
      </motion.div>

      {/* Always-present results section */}
       <div className="result-box mt-8 p-8 rounded-2xl bg-white/15 backdrop-blur-lg shadow-2xl text-left text-white animate-fade-in border border-white/30">
        <h2 className="text-lg font-bold mb-4 text-yellow-300">Resume Improvement Analysis</h2>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        {result ? (
          <div>
            <div className="mb-4">
              <p>
                <strong>Match Percentage:</strong>{" "}
                <span ref={percentageRef}>{result.match_percentage}</span>%
              </p>
              <div className="w-full bg-gray-700 rounded-full h-3 mt-2">
                <div
                  ref={progressBarRef}
                  className="bg-yellow-400 h-3 rounded-full"
                  style={{ width: "0%" }}
                ></div>
              </div>
            </div>
            <p>
              <strong>Strengths:</strong>
              <br />
              {result.strengths}
            </p>
            <p className="mt-2">
              <strong>Gaps:</strong>
              <br />
              {result.gaps}
            </p>
            <p className="mt-2">
              <strong>Suggestions:</strong>
              <br />
              {result.suggestions}
            </p>
          </div>
        ) : (
          <p className="text-gray-400">Results will appear here after analysis...</p>
        )}
      </div>
    </motion.div>
  );
}
