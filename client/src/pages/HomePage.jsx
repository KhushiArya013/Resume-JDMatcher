import React from "react";
import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center"
      style={{
        backgroundImage: "url('/bg.jpg')",
      }}
    >
      <div className="bg-white/15 backdrop-blur-lg shadow-2xl rounded-2xl p-10 w-full max-w-lg text-center border border-white/30 text-white">
        <h1 className="text-5xl font-extrabold drop-shadow-lg mb-6">
          JD Matcher
        </h1>
        <p className="text-xl mb-10">
          Your AI-powered toolkit for career success.
        </p>
        <div className="space-y-4">
          <Link
  to="/resume-matcher"
  className="w-full py-3 px-6 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition duration-300 inline-block"
>
  Match My Resume
</Link>

          
          <button
            onClick={() => alert("Coming soon!")}
            className="w-full py-3 px-6 rounded-lg bg-gray-600 text-white font-semibold hover:bg-gray-700 transition duration-300"
          >
            Generate Cover Letter
          </button>
          <button
            onClick={() => alert("Coming soon!")}
            className="w-full py-3 px-6 rounded-lg bg-gray-600 text-white font-semibold hover:bg-gray-700 transition duration-300"
          >
            Refine Job Description
          </button>
        </div>
      </div>
    </div>
  );
}
