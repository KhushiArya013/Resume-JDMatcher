import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";

// Step 1: File Upload Component
const FileUploadStep = ({ onFileSelect }) => (
  <motion.div
    key="file-upload-step"
    initial={{ opacity: 0, y: 50 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -50 }}
    transition={{ duration: 0.5 }}
  >
    <label className="block text-gray-100 font-medium mb-2">
      Upload Resume (PDF):
    </label>
    <input
      type="file"
      accept="application/pdf"
      onChange={onFileSelect}
      className="block w-full text-sm text-white-200 
      file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 
      file:text-sm file:font-semibold file:bg-indigo-500 file:text-white hover:file:bg-indigo-600"
    />
  </motion.div>
);

// Step 2: Job Description Form Component
const JobDescriptionStep = ({ jobDescription, onDescriptionChange, onSubmit, loading }) => (
  <motion.form
    key="job-description-step"
    onSubmit={onSubmit}
    initial={{ opacity: 0, y: 50 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -50 }}
    transition={{ duration: 0.5 }}
    className="space-y-6 text-left"
  >
    <div>
      <label className="block text-white-100 font-medium mb-2">
        Job Description:
      </label>
      <textarea
        value={jobDescription}
        onChange={onDescriptionChange}
        className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-400 
        bg-gray-800/90 text-white placeholder-gray-400"
        placeholder="Enter job description here..."
        rows={5}
      ></textarea>
    </div>

    <button
      type="submit"
      disabled={loading}
      className="w-full py-3 px-6 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition duration-300 disabled:bg-indigo-400"
    >
      {loading ? "Matching..." : "Match Resume"}
    </button>
  </motion.form>
);

// Step 3: Result Display Component
const ResultDisplay = ({ result, error }) => {
  const percentageRef = useRef(null);
  const verdictRef = useRef(null);
  const progressBarRef = useRef(null);

  useEffect(() => {
    if (result) {
      if (percentageRef.current) {
        gsap.fromTo(
          percentageRef.current,
          { innerText: 0 },
          { innerText: result.match_percentage, duration: 1.5, ease: "power1.out", snap: { innerText: 1 } }
        );
      }

      if (verdictRef.current) {
        gsap.fromTo(verdictRef.current, { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 1 });
      }

      if (progressBarRef.current) {
        gsap.fromTo(progressBarRef.current, { width: "0%" }, { width: `${result.match_percentage}%`, duration: 1.5, ease: "power1.out" });
      }
    }
  }, [result]);

  return (
    <motion.div
      key="result-display"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mt-6 p-4 bg-white/10 backdrop-blur-md rounded-lg shadow-md text-white text-left"
    >
      <h2 className="text-lg font-bold mb-2 text-indigo-300">Match Result:</h2>
      {error ? (
        <p className="text-red-300">Error: {error}</p>
      ) : (
        <div>
          <p className="mb-2">
            <strong className="text-white">Match Percentage:</strong>{" "}
            <span ref={percentageRef} className="font-semibold">{result.match_percentage}%</span>
          </p>

          <div className="w-full h-3 bg-gray-700 rounded-full mb-4">
            <div ref={progressBarRef} className="h-full bg-indigo-500 rounded-full"></div>
          </div>

          <p className="mb-2">
            <strong className="text-white">Verdict:</strong>{" "}
            <span ref={verdictRef}>{result.verdict}</span>
          </p>

          <div className="mt-4">
            <h3 className="text-md font-bold text-indigo-300">LLM Analysis:</h3>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-200">
              {result.analysis}
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
};

// Main MatcherForm Component
export default function MatcherForm() {
  const [step, setStep] = useState(1);
  const [resumeFile, setResumeFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setResumeFile(file);
      setStep(2);
    }
  };

  const handleDescriptionChange = (e) => {
    setJobDescription(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!resumeFile || !jobDescription) {
      setError("Please upload a resume and enter a job description.");
      return;
    }
    setError("");
    setLoading(true);

    const formData = new FormData();
    formData.append("resume", resumeFile);
    formData.append("job_description", jobDescription);

    try {
      const response = await axios.post(
        "https://resume-jdmatcher-latest.onrender.com/match", // fixed endpoint
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setResult(response.data);
      setStep(3);
    } catch (err) {
      console.error("Error matching resume:", err);
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError("An error occurred while processing.");
      }
      setResult(null);
      setStep(3);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center"
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
          Resume & JD Matcher
        </h1>

        <AnimatePresence mode="wait">
          {step === 1 && <FileUploadStep key="step1" onFileSelect={handleFileSelect} />}
          {step === 2 && <JobDescriptionStep key="step2" jobDescription={jobDescription} onDescriptionChange={handleDescriptionChange} onSubmit={handleSubmit} loading={loading} />}
          {step === 3 && <ResultDisplay key="step3" result={result} error={error} />}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
