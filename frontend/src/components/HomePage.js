import React from "react";

export default function HomePage({
  step,
  personalityMode,
  selectPersonalityMode,
  scenario,
  analysis,
  theme,
  setTheme,
  generateScenario,
  questionIndex,
  selectChoice
}) {
    
    return (
        <div className="min-h-screen bg-gradient-to-tr from-[#0e0e10] via-black to-[#1a1a1d] text-white flex flex-col items-center justify-center px-6 py-10">
          <h1 className="text-4xl font-bold mb-8 text-center drop-shadow-lg">AI Personality Quiz</h1>
      
          {/* Step 1: Personality Selection */}
          {step === 1 && !personalityMode && (
            <div className="space-y-6 text-center">
              <p className="text-lg text-gray-300">Choose how the AI should analyze your personality:</p>
              <div className="flex gap-6">
                <button
                  onClick={() => selectPersonalityMode("nice")}
                  className="flex-1 px-6 py-4 bg-purple-700/30 hover:bg-purple-600/40 border border-purple-500 rounded-xl text-white shadow-md transition backdrop-blur"
                >
                  Be nice 🍉
                </button>
                <button
                  onClick={() => selectPersonalityMode("mean")}
                  className="flex-1 px-6 py-4 bg-orange-700/30 hover:bg-orange-600/40 border border-orange-500 rounded-xl text-white shadow-md transition backdrop-blur"
                >
                  Roast me 🍗
                </button>
              </div>
            </div>
          )}
      
          {/* Step 2: Theme Entry */}
          {step === 2 && personalityMode && !scenario && !analysis && (
            <div className="w-full max-w-md text-center space-y-4 mt-6">
              <p className="text-gray-300">Enter a theme for your quiz (e.g., space, medieval, cooking):</p>
              <input
                type="text"
                placeholder="Enter a theme"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={generateScenario}
                disabled={!theme.trim()}
                className={`w-full px-6 py-3 rounded-lg text-white font-semibold transition ${
                  theme.trim()
                    ? "bg-purple-600 hover:bg-purple-700"
                    : "bg-gray-600 cursor-not-allowed"
                }`}
              >
                Start Quiz
              </button>
            </div>
          )}
      
          {/* Step 3: Scenario + Choices */}
          {step === 3 && scenario && (
            <div className="mt-10 text-center space-y-6 max-w-xl">
              <h3 className="text-2xl font-semibold">Scenario {questionIndex + 1}:</h3>
              <p className="text-lg text-gray-200">{scenario.text}</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => selectChoice(scenario.choice1)}
                  className="flex-1 px-6 py-4 bg-blue-700/30 hover:bg-blue-600/40 border border-blue-500 rounded-xl text-white shadow-md transition backdrop-blur"
                >
                  {scenario.choice1}
                </button>
                <button
                  onClick={() => selectChoice(scenario.choice2)}
                  className="flex-1 px-6 py-4 bg-pink-700/30 hover:bg-pink-600/40 border border-pink-500 rounded-xl text-white shadow-md transition backdrop-blur"
                >
                  {scenario.choice2}
                </button>
              </div>
            </div>
          )}
      
          {/* Step 4: Analysis */}
          {step === 4 && analysis && (
            <div className="mt-10 text-center space-y-4 max-w-xl">
              <h3 className="text-2xl font-semibold text-green-400">Your Personality Analysis:</h3>
              <p className="text-lg text-gray-100">{analysis}</p>
            </div>
          )}
        </div>
    );
}
