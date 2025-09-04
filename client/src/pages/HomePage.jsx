import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";

export default function HomePage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user info exists in localStorage (persist login)
    const storedUser = localStorage.getItem("googleUser");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleGoogleSuccess = (credentialResponse) => {
    const decoded = jwtDecode(credentialResponse.credential);
    const userData = { ...decoded, token: credentialResponse.credential };
    setUser(userData);
    localStorage.setItem("googleUser", JSON.stringify(userData)); // persist user
  };

  const handleGoogleFailure = () => {
    alert("Google login failed. Please try again.");
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("googleUser");
  };

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { delayChildren: 0.3, staggerChildren: 0.2 },
    },
  };

  const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } };

  return (
    <motion.div
      initial={{ opacity: 0, x: -100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: "url('/bg.jpg')" }}
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="bg-white/15 backdrop-blur-lg shadow-2xl rounded-2xl p-10 w-full max-w-lg text-center border border-white/30 text-white"
      >
        {/* Google Login / Logout */}
        {!user ? (
          <motion.div variants={itemVariants} className="mb-6">
            <GoogleLogin onSuccess={handleGoogleSuccess} onError={handleGoogleFailure} />
          </motion.div>
        ) : (
          <motion.div variants={itemVariants} className="mb-6 space-y-2">
            <p className="text-white font-semibold">Logged in as: {user.name || user.email}</p>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 rounded-lg hover:bg-red-600 transition"
            >
              Logout
            </button>
          </motion.div>
        )}

        <motion.h1 variants={itemVariants} className="text-7xl font-extrabold drop-shadow-lg mb-6">
          Verity-Flow
        </motion.h1>

        <motion.p variants={itemVariants} className="text-xl mb-120">
          Resume-JobDescription Matcher.
        </motion.p>
        <motion.p variants={itemVariants} className="text-xl mb-10">
          AI-powered toolkit for career success.
        </motion.p>

        {/* Action Buttons */}
        <motion.div variants={containerVariants} className="space-y-4">
          <motion.div variants={itemVariants}>
            <button disabled={!user}>
              <Link
                to={user ? "/resume-matcher" : "#"}
                className={`w-full py-3 px-6 rounded-lg ${
                  user
                    ? "bg-yellow-400 hover:bg-yellow-500 text-gray-900"
                    : "bg-gray-400 cursor-not-allowed text-gray-200"
                } font-bold transition duration-300 inline-block shadow-lg hover:shadow-xl transform hover:scale-105`}
              >
                Match My Resume
              </Link>
            </button>
          </motion.div>

          <motion.div variants={itemVariants}>
            <button disabled={!user}>
              <Link
                to={user ? "/refine-jd" : "#"}
                className={`w-full py-3 px-6 rounded-lg ${
                  user
                    ? "bg-gray-600 hover:bg-gray-700 text-white"
                    : "bg-gray-400 cursor-not-allowed text-gray-200"
                } font-semibold transition duration-300 inline-block shadow-lg hover:shadow-xl transform hover:scale-105`}
              >
                Refine Job Description
              </Link>
            </button>
          </motion.div>

          <motion.div variants={itemVariants}>
            <button disabled={!user}>
              <Link
                to={user ? "/improve-resume" : "#"}
                className={`w-full py-3 px-6 rounded-lg ${
                  user
                    ? "bg-gray-600 hover:bg-gray-700 text-white"
                    : "bg-gray-400 cursor-not-allowed text-gray-200"
                } font-semibold transition duration-300 inline-block shadow-lg hover:shadow-xl transform hover:scale-105`}
              >
                Improve My Resume
              </Link>
            </button>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
