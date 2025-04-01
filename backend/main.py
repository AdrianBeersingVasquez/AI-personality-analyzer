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

# Request Model
class ThemeRequest(BaseModel):
    themes: str
    choices: list[str] = []

# Generate scenario & actions
@app.post("/generate")
async def generate_scenario(req: ThemeRequest):
    prompt = f"""
    Create a funny, weird, or dramatic situation based on the following themes: {req.themes}.
    The situation should require a decision from the user.
    
    Then provide two possible actions. Make them interesting and different.
    
    Format:
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
    prompt = f"""
    Based on the user's choices below, write a fun and concise personality analysis:
    
    Choices:
    {req.choices}

    Summary in 2-3 sentences.
    """

    model = genai.GenerativeModel("gemini-1.5-flash")
    response = model.generate_content(prompt)

    return {"analysis": response.text.strip()}

# Run the API with: uvicorn backend.main:app --reload
