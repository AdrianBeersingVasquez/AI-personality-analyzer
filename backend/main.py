from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from pydantic import BaseModel
import google.generativeai as genai
import os
from dotenv import load_dotenv

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

# Request Model
class ThemeRequest(BaseModel):
    themes: str
    choices: list[str] = []
    avoided: list[str] = []

# Generate scenario & actions
@app.post("/generate")
async def generate_scenario(req: ThemeRequest):
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
    
    return {"scenario": response.text.strip()}

# Personality Analysis
@app.post("/analyze")
async def analyze_personality(req: ThemeRequest):
    print("Received choices from frontend:", req.choices)  # Debug log
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
