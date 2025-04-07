from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from pydantic import BaseModel
import google.generativeai as genai
import os
import re
from dotenv import load_dotenv
import logging

# Setup logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)


# Load API Key from .env
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Configure Gemini API
genai.configure(api_key=GEMINI_API_KEY)

# FastAPI App
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (for development)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class GenerateRequest(BaseModel):
    themes: str

# Request Model
class ThemeRequest(BaseModel):
    themes: str
    choices: list[str] = []
    avoided: list[str] = []
    personalityMode: str

# Generate scenario & actions
@app.post("/generate")
async def generate_scenario(req: GenerateRequest):
    logger.debug(f"Received request: {req}")  # Ensure this is logged
    print(f"Received request: {req}")  # Also use print() for extra visibility

    print("Received request:", req.themes)  # Debugging

    prompt = f"""
    Pick ONE of the following themes: {req.themes}.
    The situation should be realistic but creative, and should involve a choice or decision.
    Each situation should be distinct from others and should not repeat the same structure or type of challenge.
    For example, a situation about 'sports' could involve a decision at a game, while one about 'travel' could be about a dilemma in a foreign country.
    Avoid mixing themes or repeating similar situations.
    The situation should require a decision from me. Use no more than 50 words.
    The situation should be different to any of the previous ones generated.
    Provide two possible actions I can take. Make the options interesting and different from each other, so that it is telling of my personality.
    
    Example situation:
    "You're facing a major dilema that requires you to act quickly. What are you more likely to do?"

    Format the response like this:
    ---
    Situation: [Generated situation]
    
    1. [First action]
    2. [Second action]
    ---
    """

    model = genai.GenerativeModel("gemini-1.5-flash")
    response = model.generate_content(prompt)

    raw_text = response.text
    
    situation_match = re.search(r"Situation:\s*(.*)", raw_text)
    choice_matches = re.findall(r"\d+\.\s*(.*)", raw_text)

    print(f"raw_text: {raw_text}")  # Debugging

    # Split the text into situation and choices parts
    parts = raw_text.split("Situation:", 1)
    if len(parts) < 2:
        print("Failed to find 'Situation:' in response:", raw_text)
        return {"error": "Failed to parse AI response"}
    
    # Extract situation (everything after "Situation:" until the next section)
    situation_part = parts[1].strip()
    situation_match = re.search(r"^(.*?)(?=\n\s*\d+\.|$)", situation_part, re.DOTALL)
    if not situation_match:
        print("Failed to extract situation:", situation_part)
        return {"error": "Failed to parse AI response"}
    situation = situation_match.group(1).strip()

    # Extract choices from the remaining text
    choices_part = situation_part[situation_match.end():].strip()
    choice_matches = re.findall(r"^\d+\.\s*(.*)$", choices_part, re.MULTILINE)

    if len(choice_matches) >= 2:
        choice1, choice2 = choice_matches[:2]  # Take the first two matches
        print("Parsed response:", {"situation": situation, "choice1": choice1, "choice2": choice2})  # Debug
        return {"situation": situation, "choice1": choice1, "choice2": choice2}
    
    print("Failed to parse choices from:", choices_part)  # Debug
    return {"error": "Failed to parse AI response"}

# Personality Analysis
@app.post("/analyze")
async def analyze_personality(req: ThemeRequest):
    print("Received choices from frontend:", req.choices)  # Debug log
    print("Received avoided choices from frontend:", req.avoided)
    
    if req.personalityMode == "nice":
        prompt = f"""
        return the phrase "Be nice!"
        """

    else:
        # Savage mode
        prompt = f"""
        This is a list of actions I have chosen to take: {req.choices}

        While this is a list of actions I have avoided: {req.avoided}
        I want you to analyse my personality based on these choices and avoided actions.

        Write 2-3 sentences summarising my personality in an engaging way. You can roast me and be savage.
        """

    model = genai.GenerativeModel("gemini-1.5-flash")
    response = model.generate_content(prompt)

    return {"analysis": response.text.strip()}

# Run the API with: uvicorn backend.main:app --reload
