import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import DashboardCard from "./DashboardCard";

export default function HomePage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("googleUser");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleGoogleSuccess = (credentialResponse) => {
    const decoded = jwtDecode(credentialResponse.credential);
    const userData = { ...decoded, token: credentialResponse.credential };
    setUser(userData);
    localStorage.setItem("googleUser", JSON.stringify(userData));
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
        className="bg-white/15 backdrop-blur-lg shadow-2xl rounded-2xl p-10 w-full max-w-4xl text-center border border-white/30 text-white flex flex-col justify-between items-center min-h-[90vh]"
      >
        {/* Google Login / Logout */}
        <div className="flex-shrink-0">
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
        </div>

        {/* Main Content */}
        <div className="flex-grow flex flex-col items-center justify-center">
          <motion.h1 variants={itemVariants} className="text-7xl font-extrabold drop-shadow-lg mb-6">
            Verity-Flow
          </motion.h1>

          <motion.p variants={itemVariants} className="text-xl mb-4">
            AI-powered toolkit for career success.
          </motion.p>
        </div>

        {/* Dashboard Cards Grid */}
        <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-auto flex-shrink-0">
          <DashboardCard
            title="Match My Resume"
            description="Find the perfect fit for your skills."
            link={user ? "/resume-matcher" : "#"}
            buttonText="Match My Resume"
            disabled={!user}
          />
          <DashboardCard
            title="Refine Job Description"
            description="Enhance job postings for clarity and appeal."
            link={user ? "/refine-jd" : "#"}
            buttonText="Refine Job Description"
            disabled={!user}
          />
          <DashboardCard
            title="Improve My Resume"
            description="Get AI feedback to stand out from the crowd."
            link={user ? "/improve-resume" : "#"}
            buttonText="Improve My Resume"
            disabled={!user}
          />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}