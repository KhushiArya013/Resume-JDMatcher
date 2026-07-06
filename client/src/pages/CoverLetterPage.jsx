import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { gsap } from "gsap";

const API_URL = "http://localhost:8000/api";

export default function CoverLetterPage() {
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeName, setResumeName] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [tone, setTone] = useState("professional");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const wordCountRef = useRef(null);
  const resultBoxRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setResumeFile(file);
      setResumeName(file.name);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!jobDescription || !resumeFile) {
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
      formData.append("tone", tone);

      const response = await axios.post(`${API_URL}/cover-letter`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const data = response.data;
      data.cover_letter = data.cover_letter || "No cover letter generated.";
      data.word_count = data.cover_letter.split(/\s+/).filter(w => w.length > 0).length;

      setResult(data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (result?.cover_letter) {
      navigator.clipboard.writeText(result.cover_letter);
      alert("Cover letter copied to clipboard!");
    }
  };

  // Animations
  useEffect(() => {
    if (result) {
      if (wordCountRef.current) {
        gsap.fromTo(
          wordCountRef.current,
          { innerText: 0 },
          { innerText: result.word_count, duration: 1, snap: { innerText: 1 } }
        );
      }
      if (resultBoxRef.current) {
        gsap.fromTo(resultBoxRef.current, 
          { opacity: 0, y: 30 }, 
          { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }
        );
      }
    }
  }, [result]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen flex flex-col items-center justify-start py-12 bg-cover bg-center relative"
      style={{ backgroundImage: "url('/bg.jpg')" }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/50" />

      <div className="relative z-10 w-full max-w-3xl px-6">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <Link to="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4 text-sm">
            <span>←</span> Back to Home
          </Link>
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-indigo-200 drop-shadow-lg">
            Cover Letter Generator
          </h1>
          <p className="text-gray-400 mt-2">Generate tailored cover letters powered by Groq AI</p>
        </motion.div>

        {/* Form Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 p-8 shadow-2xl"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Resume Upload */}
            <div>
              <label className="block text-gray-200 font-semibold mb-3 text-sm uppercase tracking-wider">
                Upload Resume (PDF/DOCX)
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept=".pdf,.docx,.doc,.txt"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-white file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-purple-500 file:to-indigo-500 file:text-white hover:file:from-purple-400 hover:file:to-indigo-400 file:transition-all file:cursor-pointer cursor-pointer"
                />
              </div>
              {resumeName && (
                <motion.p 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-purple-300 mt-2 text-sm flex items-center gap-2"
                >
                  <span>📄</span> Selected: {resumeName}
                </motion.p>
              )}
            </div>

            {/* Tone Selection */}
            <div>
              <label className="block text-gray-200 font-semibold mb-3 text-sm uppercase tracking-wider">
                Tone
              </label>
              <div className="grid grid-cols-3 gap-3">
                {["professional", "enthusiastic", "casual"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTone(t)}
                    className={`py-3 px-4 rounded-xl font-medium text-sm capitalize transition-all duration-300 ${
                      tone === t
                        ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg shadow-purple-500/25 border border-purple-400/30"
                        : "bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-gray-200"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Job Description */}
            <div>
              <label className="block text-gray-200 font-semibold mb-3 text-sm uppercase tracking-wider">
                Job Description
              </label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="w-full p-4 rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/30 transition-all resize-none"
                placeholder="Paste the job description here..."
                rows={6}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 rounded-xl font-bold text-base transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white hover:shadow-purple-500/25 hover:shadow-xl"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generating...
                </span>
              ) : (
                "Generate Cover Letter"
              )}
            </button>
          </form>

          {error && (
            <motion.p 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-400 mt-4 text-center bg-red-500/10 py-3 px-4 rounded-xl border border-red-500/20"
            >
              {error}
            </motion.p>
          )}
        </motion.div>

        {/* Result Section */}
        {result && (
  <motion.div
    ref={resultBoxRef}
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay: 0.2 }}
    className="mt-8 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 p-8 shadow-2xl"
  >
    {/* Result Header */}
    <div className="mb-6">
      <h2 className="text-2xl font-bold text-white mb-2">Your Cover Letter</h2>
      <div className="flex items-center gap-4 text-sm text-gray-400">
        <span>Tone: <span className="text-purple-300 capitalize">{tone}</span></span>
        <span>·</span>
        <span>Words: <span ref={wordCountRef} className="text-purple-300 font-mono">{result.word_count}</span></span>
      </div>
    </div>

    {/* Buttons - Side by side, matching MatcherForm style */}
    <div className="flex gap-3 mb-6">
      <button
        onClick={copyToClipboard}
        className="flex-1 py-3 px-6 rounded-xl font-semibold text-sm transition-all duration-300 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white shadow-lg hover:shadow-purple-500/25"
      >
        📋 Copy
      </button>
      <button
        onClick={() => { setResult(null); setResumeFile(null); setResumeName(""); setJobDescription(""); }}
        className="flex-1 py-3 px-6 rounded-xl font-semibold text-sm transition-all duration-300 bg-white/10 hover:bg-white/20 text-white border border-white/10 hover:border-white/20"
      >
        🔄 New
      </button>
    </div>

    {/* Cover Letter Content - Dark container */}
    <div className="bg-black/40 rounded-xl p-6 border border-white/5">
      <div className="whitespace-pre-wrap text-gray-200 leading-relaxed text-sm md:text-base">
        {result.cover_letter}
      </div>
    </div>

    {/* Tip */}
    <div className="mt-6 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
      <p className="text-purple-300 text-sm">
        💡 <strong>Tip:</strong> Personalize the greeting before sending.
      </p>
    </div>
  </motion.div>
)}
      </div>
    </motion.div>
  );
}