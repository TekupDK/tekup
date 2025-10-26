#!/usr/bin/env python3
"""
Simpel test server til at teste Gemini AI integration
"""

import asyncio
import os
from dotenv import load_dotenv
import google.generativeai as genai
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn

# Load environment variables
load_dotenv()

# Initialize Gemini AI
gemini_api_key = os.getenv("GEMINI_API_KEY")
if not gemini_api_key:
    raise ValueError("GEMINI_API_KEY environment variable is required")

genai.configure(api_key=gemini_api_key)
gemini_model = genai.GenerativeModel('gemini-2.0-flash-exp')

# Create FastAPI app
app = FastAPI(
    title="Gemini AI Test Server",
    description="Test server for Gemini AI integration",
    version="1.0.0"
)

class ChatRequest(BaseModel):
    prompt: str
    danish_context: bool = True

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "gemini_configured": bool(gemini_api_key),
        "model": "gemini-2.0-flash-exp"
    }

@app.post("/chat")
async def chat_with_gemini(request: ChatRequest):
    """Test Gemini AI chat functionality"""
    try:
        if request.danish_context:
            enhanced_prompt = f"Svar på dansk med fokus på danske forretningsmæssige og kulturelle kontekster:\n\n{request.prompt}"
        else:
            enhanced_prompt = request.prompt
            
        # Use asyncio.to_thread for async compatibility
        response = await asyncio.to_thread(gemini_model.generate_content, enhanced_prompt)
        
        return {
            "status": "success",
            "response": response.text,
            "prompt": request.prompt,
            "danish_context": request.danish_context
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini API error: {str(e)}")

@app.post("/jarvis/generate")
async def jarvis_generate(request: ChatRequest):
    """Test Jarvis-style generation using Gemini AI"""
    try:
        # Add Jarvis-specific system prompt
        jarvis_prompt = f"""
Du er Jarvis AI Assistant - en avanceret dansk AI-assistent til TekUp platformen.

Dine kernekompetencer:
- Avanceret reasoning og problemløsning
- Business analyse og CRM-opgaver
- Dansk sprog og kulturel forståelse
- Kode-generering og teknisk support

Svar altid på dansk med en professionel men venlig tone.

Brugerens spørgsmål: {request.prompt}
"""
        
        response = await asyncio.to_thread(gemini_model.generate_content, jarvis_prompt)
        
        return {
            "status": "success",
            "response": response.text,
            "model": "jarvis-foundation-1.0",
            "task_type": "chat",
            "danish_context": True
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Jarvis generation error: {str(e)}")

if __name__ == "__main__":
    print("🚀 Starting Gemini AI Test Server...")
    print(f"✅ Gemini API Key configured: {gemini_api_key[:20]}...")
    
    uvicorn.run(
        "test_gemini:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
        log_level="info"
    )
