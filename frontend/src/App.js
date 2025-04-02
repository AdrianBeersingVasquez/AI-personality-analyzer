import React, { useState } from "react";
import axios from "axios";

function App() {
  const [theme, setTheme] = useState("");
  const [scenario, setScenario] = useState("");
  const [choices, setChoices] = useState([]);
  const [analysis, setAnalysis] = useState("");
  const [currentChoices, setCurrentChoices] = useState([]);

  const generateScenario = async () => {
    try {
      const response = await axios.post("http://127.0.0.1:8000/generate", { themes: theme });
      console.log("Generated response:", response.data);  // Debugging
      setScenario({
        text: response.data.situation,
        choice1: response.data.choice1,
        choice2: response.data.choice2,
      });
    } catch (error) {
      console.error("Error generating scenario:", error);
    }
  };

  const selectChoice = (choice) => {
    const updatedChoices = [...currentChoices, choice];
    console.log("User selected:", choice);  // Debugging
    setCurrentChoices(updatedChoices);
  };

  const analyzePersonality = async () => {
    console.log("Choices sent for analysis:", currentChoices); // Debugging
    try {
      const response = await axios.post("http://127.0.0.1:8000/analyze", { themes: theme, choices: currentChoices });
      console.log("Analysis received:", response.data.analysis); // Debugging
      setAnalysis(response.data.analysis);
    } catch (error) {
      console.error("Error analyzing personality:", error);
    }
  };
  

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>AI Personality Quiz</h1>
      <input
        type="text"
        placeholder="Enter a theme (e.g., space, medieval, cooking)"
        value={theme}
        onChange={(e) => setTheme(e.target.value)}


      />
      <button onClick={generateScenario}>Generate Scenario</button>

      {scenario.text && (
        <div>
          <h3>Scenario</h3>
          <p>{scenario.text}</p>
          <button onClick={() => selectChoice(scenario.choice1)}>{scenario.choice1}</button>
          <button onClick={() => selectChoice(scenario.choice2)}>{scenario.choice2}</button>
        </div>
      )}

      <button onClick={analyzePersonality}>Analyze Personality</button>

      {analysis && (
        <div>
          <h3>Your Personality Analysis:</h3>
          <p>{analysis}</p>
        </div>
      )}
    </div>
  );
}

export default App;
