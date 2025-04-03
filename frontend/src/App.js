import React, { useState } from "react";
import axios from "axios";

function App() {
  // State variables
  const [personalityMode, setPersonalityMode] = useState("");
  const [theme, setTheme] = useState("");
  const [scenario, setScenario] = useState("");
  const [currentChoices, setCurrentChoices] = useState([]);
  const [analysis, setAnalysis] = useState("");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [step, setStep] = useState(1);
  const totalQuestions = 2; // Adjust the number of questions

  // User selects "Be Nice" or "Be Mean"
  const selectPersonalityMode = (mode) => {
    console.log("Personality mode selected:", mode);
    setPersonalityMode(mode);
    setStep(2);
  };

  // Generates a scenario from the backend
  const generateScenario = async () => {
    if (!theme.trim()) {
      console.error("Theme is empty! Cannot generate scenario.");
      return;
    }
    console.log("Sending request to backend:", { themes: theme });

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/generate",
        { themes: theme },
        { headers: { "Content-Type": "application/json" } }
      );
      console.log("Generated scenario:", response.data);
      setScenario({
        text: response.data.situation,
        choice1: response.data.choice1,
        choice2: response.data.choice2,
      });
      setStep(3);
    } catch (error) {
      console.error("Error generating scenario:", error.response?.data || error.message);
    }
  };

  // User selects a choice
  const selectChoice = (choiceText) => {
    console.log("User selected:", choiceText);
    setCurrentChoices([...currentChoices, choiceText]);

    // If more questions remain, fetch the next scenario
    if (questionIndex + 1 < totalQuestions) {
      setQuestionIndex(questionIndex + 1);
      generateScenario();
    } else {
      // If all questions answered, proceed to analysis
      setScenario(null);
      analyzePersonality();
    }
    setStep(4);
  };

  // Sends choices to FastAPI for personality analysis
  const analyzePersonality = async () => {
    if (!personalityMode || !theme.trim() || currentChoices.length === 0) {
      console.error("Missing required data for personality analysis!");
      return;
    }

    console.log("Analyzing personality with:", {
      themes: theme,
      choices: currentChoices,
      personalityMode: personalityMode,
    });

    setScenario(null); // Hide scenario UI
    setAnalysis("Analyzing your personality...");

    setTimeout(async () => {
      try {
        const response = await axios.post("http://127.0.0.1:8000/analyze", {
          themes: theme,
          choices: currentChoices,
          personalityMode: personalityMode,
        });

        console.log("Received analysis:", response.data.analysis);
        setAnalysis(response.data.analysis);
      } catch (error) {
        console.error("Error analyzing personality:", error.response?.data || error.message);
      }
    }, 1000); // Simulated delay for UX
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial", textAlign: "center" }}>
      <h1>AI Personality Quiz</h1>

      {/* Personality Selection */}
      {step === 1 && !personalityMode && (
        <div>
          <p>Choose how the AI should analyze your personality:</p>
          <button onClick={() => selectPersonalityMode("nice")}>Be Nice</button>
          <button onClick={() => selectPersonalityMode("mean")}>Be Mean</button>
        </div>
      )}

      {/* Theme Selection */}
      {step === 2 && personalityMode && !scenario && !analysis && (
        <div>
          <p>Enter a theme for your quiz (e.g., space, medieval, cooking):</p>
          <input
            type="text"
            placeholder="Enter a theme"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
          />
          <button onClick={generateScenario} disabled={!theme.trim()}>Start Quiz</button>
        </div>
      )}

      {/* Scenario Display */}
      {step === 3 && (
        <div>
          <h3>Scenario {questionIndex + 1}:</h3>
          <p>{scenario.text}</p>
          <button onClick={() => selectChoice(scenario.choice1)}>{scenario.choice1}</button>
          <button onClick={() => selectChoice(scenario.choice2)}>{scenario.choice2}</button>
        </div>
      )}

      {/* Personality Analysis */}
      {step === 4 && analysis && (
        <div>
          <h3>Your Personality Analysis:</h3>
          <p>{analysis}</p>
        </div>
      )}
    </div>
  );
}

export default App;