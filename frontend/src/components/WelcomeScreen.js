import React from "react";

const WelcomeScreen = ({ onSelectMode }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-orange-900 flex flex-col items-center justify-center p-4">
      {/* Welcome Text */}
      <h1 className="text-4xl md:text-5xl font-bold text-white mb-8">AI Personality Quiz</h1>

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
        <button
          onClick={() => onSelectMode("nice")}
          className="relative w-full px-6 py-3 bg-blue-500/10 border border-blue-500 text-white rounded-lg 
                     hover:bg-blue-500 hover:bg-opacity-20 transition-all duration-300 
                     shadow-[0_0_15px_rgba(59,130,246,0.5)] hover:shadow-[0_0_25px_rgba(59,130,246,0.8)]"
        >
          Play nice 😇
          <span className="absolute top-0 left-0 w-full h-full border border-blue-500 rounded-lg opacity-50 blur-sm"></span>
        </button>
        <button
          onClick={() => onSelectMode("mean")}
          className="relative w-full px-6 py-3 bg-orange-500/10 border border-orange-500 text-white rounded-lg 
                     hover:bg-orange-500 hover:bg-opacity-20 transition-all duration-300 
                     shadow-[0_0_15px_rgba(249,115,22,0.5)] hover:shadow-[0_0_25px_rgba(249,115,22,0.8)]"
        >
          Roast me 🍗
          <span className="absolute top-0 left-0 w-full h-full border border-orange-500 rounded-lg opacity-50 blur-sm"></span>
        </button>
      </div>
    </div>
  );
};

export default WelcomeScreen;