import os
from fastapi import FastAPI, Request, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
from bug_agent import analyze_code
from dotenv import load_dotenv

load_dotenv()

# Define request schema
class CodeRequest(BaseModel):
    code: str

app = FastAPI(title="AI Bug Finder", description="An intelligent code analysis agent")

# Mount static files and templates
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

@app.get("/")
async def home(request: Request):
    """Renders the main application UI."""
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/api/health")
async def health_check():
    """Diagnostic route to verify if Environment Variables are actually securely mounted on Render."""
    key = os.getenv("FIREBASE_API_KEY", "")
    return {
        "status": "online",
        "firebase_api_key_loaded": bool(key),
        "openrouter_api_key_loaded": bool(os.getenv("OPENROUTER_API_KEY", ""))
    }

@app.get("/firebase-config.js")
async def get_firebase_config(request: Request):
    """Serves the firebase config script with injected environment variables."""
    firebase_config = {
        "apiKey": os.getenv("FIREBASE_API_KEY", ""),
        "authDomain": os.getenv("FIREBASE_AUTH_DOMAIN", ""),
        "databaseURL": os.getenv("FIREBASE_DATABASE_URL", ""),
        "projectId": os.getenv("FIREBASE_PROJECT_ID", ""),
        "storageBucket": os.getenv("FIREBASE_STORAGE_BUCKET", ""),
        "messagingSenderId": os.getenv("FIREBASE_MESSAGING_SENDER_ID", ""),
        "appId": os.getenv("FIREBASE_APP_ID", ""),
        "measurementId": os.getenv("FIREBASE_MEASUREMENT_ID", "")
    }
    return templates.TemplateResponse("firebase-config.js", {"request": request, "firebase_config": firebase_config}, media_type="application/javascript")

@app.post("/analyze")
async def analyze(request: CodeRequest):
    """
    Receives code snippets and returns AI-powered bug analysis.
    """
    if not request.code.strip():
        raise HTTPException(status_code=400, detail="Code cannot be empty")
        
    result = analyze_code(request.code)
    
    return {"result": result}