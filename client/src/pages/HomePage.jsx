import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function HomePage() {
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
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
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="bg-white/15 backdrop-blur-lg shadow-2xl rounded-2xl p-10 w-full max-w-lg text-center border border-white/30 text-white"
      >
        <motion.h1
          variants={itemVariants}
          className="text-7xl font-extrabold drop-shadow-lg mb-6"
        >
          Verity-Flow
        </motion.h1>
        <motion.p
          variants={itemVariants}
          className="text-xl mb-120"
        >
          Resume-JobDescriptionMatcher.
        </motion.p>
        <motion.p
          variants={itemVariants}
          className="text-xl mb-10"
        >
        AI-powered toolkit for career success.
        </motion.p>
        <motion.div
          variants={containerVariants}
          className="space-y-4"
        >
          <motion.div variants={itemVariants}>
            <button>
            <Link
              to="/resume-matcher"
              className="w-full py-3 px-6 rounded-lg bg-yellow-400 text-gray-900 font-bold hover:bg-yellow-500 hover:text-gray-900 transition duration-300 inline-block shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Match My Resume
            </Link>
            </button>
          </motion.div>
          <motion.div variants={itemVariants}>
            <button>
            <Link
              to="/refine-jd"
              // CHANGED: Added bg-gray-600 to provide a background for contrast
              // CHANGED: Changed text-white to text-white for initial state, as the background will handle contrast
              // CHANGED: Adjusted hover state for better contrast and feedback
              className="w-full py-3 px-6 rounded-lg bg-gray-600 text-white font-semibold hover:bg-gray-700 transition duration-300 inline-block shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Refine Job Description
            </Link>
            </button>
          </motion.div>
          <motion.div variants={itemVariants}>
            <button>
            <Link
              to="/improve-resume"
              // CHANGED: Added bg-gray-600 to provide a background for contrast
              // CHANGED: Changed text-white to text-white for initial state, as the background will handle contrast
              // CHANGED: Adjusted hover state for better contrast and feedback
              className="w-full py-3 px-6 rounded-lg bg-gray-600 text-white font-semibold hover:bg-gray-700 transition duration-300 inline-block shadow-lg hover:shadow-xl transform hover:scale-105"
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