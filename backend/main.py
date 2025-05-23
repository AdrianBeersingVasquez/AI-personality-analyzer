from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import google.generativeai as genai
import os
import re
from dotenv import load_dotenv
import logging
import psycopg2
from datetime import datetime
import html
from urllib.parse import urlparse

# Setup logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)


# Load API Key from .env
if os.getenv("FLY_APP_NAME") is None:  # Only load .env if not on Fly.io
    load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    logger.error("GEMINI_API_KEY environment variable is missing")
    raise ValueError("GEMINI_API_KEY environment variable is missing")

# Configure Gemini API
genai.configure(api_key=GEMINI_API_KEY)

# FastAPI App
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database setup
def get_db_connection():
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise ValueError("DATABASE_URL environment variable is missing")
    url = urlparse(database_url)
    conn = psycopg2.connect(
        database=url.path[1:],
        user=url.username,
        password=url.password,
        host=url.hostname,
        port=url.port
    )
    return conn

class GenerateRequest(BaseModel):
    themes: str

# Request Model
class ThemeRequest(BaseModel):
    themes: str
    choices: list[str] = []
    avoided: list[str] = []
    personalityMode: str

class SaveResponseRequest(BaseModel):
    theme: str
    analysis: str
    personality_mode: str

# Regular expression to validate theme
VALID_THEME_REGEX = r"^[a-zA-Z0-9\s,.-]+$"

def validate_theme(theme: str) -> bool:
    return bool(re.match(VALID_THEME_REGEX, theme))

@app.get("/healthcheck")
async def healthcheck():    
    return {"status": "ok"}

# Generate scenario & actions
@app.post("/generate")
async def generate_scenario(req: GenerateRequest):
    logger.debug(f"Received request: {req}")
    print("Received request:", req.themes)  # Debugging

    if not validate_theme(req.themes):
        logger.error(f"Theme validation failed: {req.themes}")
        raise HTTPException(status_code=400, detail="Theme can only contain letters, numbers, spaces, commas, periods, and hyphens.")

    print("Received request:", req.themes)

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
    
    # Validate theme
    if not validate_theme(req.themes):
        logger.error(f"Theme validation failed: {req.themes}")
        raise HTTPException(status_code=400, detail="Theme can only contain letters, numbers, spaces, commas, periods, and hyphens.")

    if req.personalityMode == "nice":
        prompt = f"""
        This is a list of actions I have chosen to take: {req.choices}

        While this is a list of actions I have avoided: {req.avoided}
        I want you to analyse my personality based on these choices and avoided actions.
        Write 3-4 sentences summarising my personality in a thoughtful and engaging way.
        In one sentence, state something I am likely to do, or a how I process information, written in the second person.
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

# Save theme and analysis to the database
@app.post("/save_response")
async def save_response(req: SaveResponseRequest):
    logger.debug(f"Received save_response request: {req.dict()}")
    # Validate and sanitize theme
    if not validate_theme(req.theme):
        logger.error(f"Theme validation failed: {req.theme}")
        raise HTTPException(status_code=400, detail="Theme can only contain letters, numbers, spaces, commas, periods, and hyphens.")

    # Escape theme and analysis to prevent injection
    sanitized_theme = html.escape(req.theme)
    sanitized_analysis = html.escape(req.analysis)
    sanitized_personality_mode = html.escape(req.personality_mode)
    logger.debug(f"Sanitized theme: {sanitized_theme}, Sanitized analysis: {sanitized_analysis}")

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        logger.debug("Executing INSERT query")
        cursor.execute(
            "INSERT INTO responses (theme, analysis, personality_mode) VALUES (%s, %s, %s) RETURNING id",
            (sanitized_theme, sanitized_analysis, sanitized_personality_mode)
        )
        response_id = cursor.fetchone()[0]
        conn.commit()
        logger.debug("Database transaction committed successfully")
        return {"message": f"Response saved with ID {response_id}"}
    except Exception as e:
        logger.error(f"Error saving to database: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error saving response: {str(e)}")
    finally:
        cursor.close()
        conn.close()

# Retrieve all saved responses
@app.get("/responses")
async def get_responses():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id, theme, analysis, personality_mode, created_at FROM responses ORDER BY created_at DESC")
        responses = cursor.fetchall()
        return [
            {"id": row[0], "theme": row[1], "analysis": row[2], "personality_mode": row[3], "created_at": row[4]}
            for row in responses
        ]
    except Exception as e:
        logger.error(f"Error retrieving responses: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving responses: {str(e)}")
    finally:
        cursor.close()
        conn.close()

# Run the API with: uvicorn backend.main:app --reload
