import React, { useState } from "react";
import axios from "axios";

function App() {
  const [theme, setTheme] = useState("");
  const [scenario, setScenario] = useState("");
  const [choices, setChoices] = useState([]);
  const [analysis, setAnalysis] = useState("");
  const [currentChoices, setCurrentChoices] = useState([]);

  const generateScenario = async () => {
    const response = await axios.post("http://127.0.0.1:8000/generate", { themes: theme });
    setScenario(response.data.scenario);
  };

  const selectChoice = (choice) => {
    const updatedChoices = [...currentChoices, choiceText];
    console.log("User selected:", choiceText);
    setCurrentChoices(updatedChoices);
  };

  const analyzePersonality = async () => {
    const response = await axios.post("http://127.0.0.1:8000/analyze", { themes: theme, choices: currentChoices });
    setAnalysis(response.data.analysis);
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

      {scenario && (
        <div>
          <h3>Scenario</h3>
          <p>{scenario}</p>
          <button onClick={() => selectChoice(scenario.choice1)}>{scenario.choice1}</button>
          <button onClick={() => selectChoice(scenario.choice2)}>{scenario.choice2}</button>
        </div>
      )}

      <button onClick={analyzePersonality}>Analyze Personality</button>

      {analysis && (
        <div>
          <h3>Your Personality Analysis:</h3>
          <p>{analysis}</p>
          <p>{choices}</p>
          <p>Test</p>
        </div>
      )}
    </div>
  );
}

export default App;
