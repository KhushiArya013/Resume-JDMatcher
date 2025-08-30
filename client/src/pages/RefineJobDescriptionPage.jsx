import React, { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export default function RefineJobDescriptionPage() {
  const [jobDescription, setJobDescription] = useState("");
  const [refinedDescription, setRefinedDescription] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!jobDescription) {
      setError("Please enter a job description to refine.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      // Step 3: Implement new API endpoint for refinement
      const response = await axios.post("http://127.0.0.1:8000/refine-jd", {
        job_description: jobDescription,
      });
      setRefinedDescription(response.data.refined_jd);
    } catch (error) {
      console.error("Error refining job description:", error);
      if (error.response && error.response.data && error.response.data.detail) {
        setError(error.response.data.detail);
      } else {
        setError("An error occurred while refining the job description.");
      }
      setRefinedDescription(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen flex items-center justify-center bg-cover bg-center"
      style={{
        backgroundImage: "url('/bg.jpg')",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/15 backdrop-blur-lg shadow-2xl rounded-2xl p-10 w-full max-w-lg text-center border border-white/30 relative"
      >
        <button>
        <Link to="/" className="text-gray-300 hover:text-white absolute top-4 left-4">
          ← Back to Home
        </Link>
        </button>
        <h1 className="text-3xl font-extrabold text-white drop-shadow-lg mb-6">
          Refine Job Description
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6 text-left">
          <div>
            <label className="block text-white-100 font-medium mb-2">
              Enter Job Description:
            </label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-400 
              bg-gray-800/90 text-white placeholder-gray-400"
              placeholder="Enter job description here..."
              rows={8}
            ></textarea>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-6 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition duration-300 disabled:bg-indigo-400"
          >
            {loading ? "Refining..." : "Refine Job Description"}
          </button>
        </form>

        {(refinedDescription || error) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-6 p-4 bg-white/10 backdrop-blur-md rounded-lg shadow-md text-white text-left"
          >
            <h2 className="text-lg font-bold mb-2 text-indigo-300">Refined Job Description:</h2>
            {error ? (
              <p className="text-red-300">Error: {error}</p>
            ) : (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-200">
                {refinedDescription}
              </p>
            )}
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}

