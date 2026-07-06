// src/components/DashboardCard.jsx
import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const cardVariants = {
  initial: { y: 20, opacity: 0, scale: 0.98 },
  animate: { y: 0, opacity: 1, scale: 1 },
  hover: { scale: 1.05, transition: { type: "spring", stiffness: 300 } },
  tap: { scale: 0.98 },
};

export default function DashboardCard({ title, description, link, buttonText, disabled }) {
  const buttonStyle = disabled
    ? "bg-gray-400 cursor-not-allowed text-gray-200"
    : "bg-yellow-400 hover:bg-yellow-300 text-gray-900";

  return (
    <motion.div
      variants={cardVariants}
      whileHover="hover"
      whileTap="tap"
      className="relative p-4 rounded-xl shadow-xl border border-white/10 overflow-hidden transform transition-all duration-300"
      style={{
        background: "rgba(255, 255, 255, 0.08)", // Softer, more transparent glass base
        backdropFilter: "blur(15px)", // Reduced blur for better alignment with inputs
      }}
    >
      <div className="flex flex-col items-center text-center">
        <h2 className="text-base md:text-lg font-bold mb-1 text-white drop-shadow-lg">{title}</h2>
        <p className="text-xs text-gray-300 mb-4">{description}</p>
        <button disabled={disabled} className="mt-auto">
          <Link
            to={link}
            className={`py-1.5 px-4 rounded-full font-bold transition-all duration-300 inline-block text-xs shadow-lg ${buttonStyle}`}
          >
            {buttonText}
          </Link>
        </button>
      </div>
    </motion.div>
  );
}