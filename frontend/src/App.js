import React, { useState } from "react";
import axios from "axios";
import WelcomeScreen from "./components/WelcomeScreen";

function App() {
  const [personalityMode, setPersonalityMode] = useState("");
  const [theme, setTheme] = useState("");
  const [scenario, setScenario] = useState(null);
  const [currentChoices, setCurrentChoices] = useState([]);
  const [avoidedChoices, setAvoidedChoices] = useState([]);
  const [analysis, setAnalysis] = useState("");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [themeError, setThemeError] = useState("");
  
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);
  const maxThemeLength = 100;
  const totalQuestions = 3; // Adjust the number of questions
  const validThemeRegex = /^[a-zA-Z0-9\s,.-]*$/;

  // User selects "Be Nice" or "Be Mean"
  const selectPersonalityMode = (mode) => {
    console.log("Personality mode selected:", mode);
    setPersonalityMode(mode);
    setStep(2);
  };

  const handleThemeChange = (e) => {
    const newTheme = e.target.value;
    if (newTheme.length <= maxThemeLength) {
      setTheme(newTheme);
      console.log("Theme state updated:", newTheme); // Debug log
      // Validate the theme
      if (newTheme && !validThemeRegex.test(newTheme)) {
        setThemeError("Theme can only contain letters, numbers, spaces, commas, periods, and hyphens.");
        console.log("Theme validation failed:", newTheme); // Debug log
      } else {
        setThemeError("");
        console.log("Theme validation passed:", newTheme); // Debug log
      }
    }
  };

  // Generates a scenario from the backend
  const generateScenario = async () => {
    if (!theme.trim()) {
      console.error("Theme is empty! Cannot generate scenario.");
      setThemeError("Theme cannot be empty.");
      return;
    }

    if (!validThemeRegex.test(theme)) {
      console.error("Invalid theme characters:", theme);
      setThemeError("Theme can only contain letters, numbers, spaces, commas, periods, and hyphens.");
      return;
    }
    console.log("Sending request to backend:", { themes: theme });
    setIsLoading(true);

    try {
      const response = await axios.post(
        "https://ai-personality-analyzer.fly.dev/generate",
        { themes: theme },
        { headers: { "Content-Type": "application/json" } }
      );
      console.log("Generated scenario:", response.data);

      if (response.data.error) {
        console.error("Backend error:", response.data.error);
        setIsLoading(false);
        return;
      }

      setScenario({
        text: response.data.situation,
        choice1: response.data.choice1,
        choice2: response.data.choice2,
      });
      setStep(3);
    } catch (error) {
      console.error("Error generating scenario:", error.response?.data || error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // User selects a choice
  const selectChoice = (choiceText) => {
    console.log("User selected:", choiceText);
    const avoidedChoice = choiceText === scenario.choice1 ? scenario.choice2 : scenario.choice1; // Determine the avoided choice
    setCurrentChoices([...currentChoices, choiceText]);
    setAvoidedChoices([...avoidedChoices, avoidedChoice]);

    // If more questions remain, fetch the next scenario, otherwise analyse personality
    if (questionIndex + 1 < totalQuestions) {
      setQuestionIndex(questionIndex + 1);
      generateScenario();
    } else {
      setScenario(null);
      analyzePersonality();
      setStep(4);
    }
  };

  const saveResponse = async (theme, analysis, personalityMode) => {
    try {
      const response = await axios.post(
        "https://ai-personality-analyzer.fly.dev/save_response",
        { theme, analysis, personality_mode: personalityMode },
        { headers: { "Content-Type": "application/json" } }
      );
      console.log("Response saved:", response.data);
    } catch (error) {
      console.error("Error saving response:", error.response?.data || error.message);
    }
  };

  // Sends choices to FastAPI for personality analysis
  const analyzePersonality = async () => {
    if (!personalityMode || !theme.trim() || currentChoices.length === 0) {
      console.error("Missing required data for personality analysis!");
      setAnalysis("Error: Missing required data for analysis.");
      return;
    }

    console.log("Analyzing personality with:", {
      themes: theme,
      choices: currentChoices,
      avoided: avoidedChoices,
      personalityMode: personalityMode,
    });

    setAnalysis("Analyzing your personality...");
    setIsAnalysisLoading(true);

    try {
      const response = await axios.post("https://ai-personality-analyzer.fly.dev/analyze", {
        themes: theme,
        choices: currentChoices,
        avoided: avoidedChoices,
        personalityMode: personalityMode,
      });

      console.log("Received analysis:", response.data.analysis);

      const analysisResult = response.data.analysis || "No analysis returned from the server.";
      setAnalysis(analysisResult);

      await saveResponse(theme, analysisResult, personalityMode);
    } catch (error) {
      console.error("Error analyzing personality:", error.response?.data || error.message);
      setAnalysis("Error: Could not analyze personality. Please try again.");
    } finally {
      setIsAnalysisLoading(false);
    }
    //setStep(4);
  };

  const restartQuiz = () => {
    setPersonalityMode("");
    setTheme("");
    setScenario(null);
    setCurrentChoices([]);
    setAvoidedChoices([]);
    setAnalysis("");
    setQuestionIndex(0);
    setStep(1);
    setIsLoading(false);
    setThemeError("");
  };
  
  return (
    <div>
      {step === 1 && !personalityMode && (
        <WelcomeScreen onSelectMode={selectPersonalityMode} />
      )}

      {step === 2 && personalityMode && !scenario && !analysis && (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-orange-900 flex items-center justify-center p-4">
          <div className="bg-white/10 rounded-lg p-6 max-w-md w-full">
            <p className="text-lg text-gray-300 mb-4">Choose the kind of dilemmas you want to explore</p>
            <input
              type="text"
              placeholder="Enter a theme"
              value={theme}
              onChange={handleThemeChange}
              maxLength={maxThemeLength}
              className="w-full p-2 bg-gray-800 text-white border border-gray-600 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-sm text-gray-400 mb-4">
              {theme.length}/{maxThemeLength} characters
            </p>
            {themeError && (
              <p className="text-sm text-red-400 mb-2">{themeError}</p>
            )}
            <button
              onClick={generateScenario}
              disabled={!theme.trim()}
              className="relative w-full px-4 py-2 bg-green-500/10 border border-green-500 text-white rounded-lg 
                         hover:bg-green-500/90 transition-all duration-300 
                         shadow-[0_0_15px_rgba(34,197,94,0.5)] hover:shadow-[0_0_25px_rgba(34,197,94,0.8)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Generate Scenarios
              <span className="absolute top-0 left-0 w-full h-full border border-green-500 rounded-lg opacity-50 blur-sm"></span>
            </button>
          </div>
        </div>
      )}

      {step === 3 && scenario && scenario.text && scenario.choice1 && scenario.choice2 ? (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-orange-900 flex items-center justify-center p-4">
          <div className="relative bg-white/10 rounded-lg p-6 max-w-md w-full">
            {/* Loading Overlay */}
            {isLoading && (
              <div className="bg-white/10 flex items-start justify-start rounded-lg">
                <p className="text-gray-400">Loading scenario...</p>
              </div>
            )}
            <h3 className="text-xl font-semibold text-gray-200 mb-2">Scenario {questionIndex + 1}</h3>
            <p className="text-gray-300 mb-4">{scenario.text}</p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => selectChoice(scenario.choice1)}
                className="relative px-4 py-2 bg-indigo-500/20 border border-indigo-500 text-white rounded-lg 
                           hover:bg-indigo-500 hover:bg-opacity-20 transition-all duration-300 
                           shadow-[0_0_15px_rgba(99,102,241,0.5)] hover:shadow-[0_0_25px_rgba(99,102,241,0.8)]"
              >
                {scenario.choice1}
                <span className="absolute top-0 left-0 w-full h-full border border-indigo-500 rounded-lg opacity-50 blur-sm"></span>
              </button>
              <button
                onClick={() => selectChoice(scenario.choice2)}
                className="relative px-4 py-2 bg-indigo-500/20 border border-indigo-500 text-white rounded-lg 
                           hover:bg-indigo-500 hover:bg-opacity-20 transition-all duration-300 
                           shadow-[0_0_15px_rgba(99,102,241,0.5)] hover:shadow-[0_0_25px_rgba(99,102,241,0.8)]"
              >
                {scenario.choice2}
                <span className="absolute top-0 left-0 w-full h-full border border-indigo-500 rounded-lg opacity-50 blur-sm"></span>
              </button>
            </div>
          </div>
        </div>
      ) : step === 3 ? (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-orange-900 flex items-center justify-center p-4">
          <p className="text-gray-400">Loading scenario...</p>
        </div>
      ) : null}

      {step === 4 && analysis && (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-orange-900 flex items-center justify-center p-4">
          <div className="bg-white/10 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold text-gray-200 mb-2">Your Personality Analysis</h3>
            <p className="text-gray-300 mb-8">{analysis}</p>
            {!isAnalysisLoading && analysis !== "Analyzing your personality..." && (
              <button
              onClick={restartQuiz}
              className="relative w-full px-4 py-2 bg-purple-500/20 border border-purple-500 text-white rounded-lg 
                         hover:bg-purple-500/90 transition-all duration-300 
                         shadow-[0_0_15px_rgba(168,85,247,0.5)] hover:shadow-[0_0_25px_rgba(168,85,247,0.8)]"
            >
              Another Round of Dilemmas?
              <span className="absolute top-0 left-0 w-full h-full border border-purple-500 rounded-lg opacity-50 blur-sm"></span>
            </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;