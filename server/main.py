from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from groq import Groq
import os
import io
import json
import re
from typing import Optional
from dotenv import load_dotenv

# Load .env from the same directory as this file
dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(dotenv_path)

app = FastAPI(title="Verity-Flow API", version="1.0")

# CORS for your Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Groq client setup
groq_client = None
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if GROQ_API_KEY:
    groq_client = Groq(api_key=GROQ_API_KEY)
else:
    print("WARNING: GROQ_API_KEY not found. Add it to server/.env")

def get_groq_client():
    global groq_client
    if groq_client is None:
        key = os.getenv("GROQ_API_KEY")
        if not key:
            raise HTTPException(status_code=500, detail="GROQ_API_KEY not configured. Add it to server/.env")
        groq_client = Groq(api_key=key)
    return groq_client

def extract_text_from_pdf(file_bytes):
    try:
        import PyPDF2
        reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
        text = ""
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
        return text.strip()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"PDF parsing error: {str(e)}")

def extract_text_from_docx(file_bytes):
    try:
        import docx
        document = docx.Document(io.BytesIO(file_bytes))
        text = "\n".join([para.text for para in document.paragraphs if para.text])
        return text.strip()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"DOCX parsing error: {str(e)}")

def call_groq(prompt, model="llama-3.3-70b-versatile"):
    """Call Groq API with the given prompt"""
    client = get_groq_client()
    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are an expert ATS analyzer and technical recruiter. Respond only with the requested format."},
                {"role": "user", "content": prompt}
            ],
            model=model,
            temperature=0.3,
            max_tokens=2048,
        )
        return chat_completion.choices[0].message.content
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Groq API error: {str(e)}")

def safe_json_extract(text):
    """Extract JSON from LLM response even if wrapped in markdown"""
    patterns = [
        r"```json\s*(\{.*?\})\s*```",
        r"```\s*(\{.*?\})\s*```",
        r"(\{.*?\})"
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(1))
            except:
                continue
    return None

@app.post("/api/match")
async def match_resume_jd(
    resume: UploadFile = File(...),
    job_description: str = Form(...)
):
    """Analyze resume against job description using Groq"""
    try:
        file_bytes = await resume.read()
        filename = resume.filename.lower()

        if filename.endswith('.pdf'):
            resume_text = extract_text_from_pdf(file_bytes)
        elif filename.endswith('.docx') or filename.endswith('.doc'):
            resume_text = extract_text_from_docx(file_bytes)
        elif filename.endswith('.txt'):
            resume_text = file_bytes.decode('utf-8')
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format. Use PDF, DOCX, or TXT")

        if not resume_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from resume")

        resume_text = resume_text[:5000]
        job_description = job_description[:3000]

        prompt = f"""Analyze how well the resume matches the job description.

RESUME:
{resume_text}

JOB DESCRIPTION:
{job_description}

Respond ONLY with valid JSON in this exact format:
{{
    "match_percentage": <number 0-100>,
    "missing_keywords": ["keyword1", "keyword2"],
    "strengths": ["strength1", "strength2"],
    "improvements": ["improvement1", "improvement2"],
    "summary": "Brief 2-3 sentence assessment"
}}

Be honest and critical. If the match is poor, reflect that in the percentage."""

        response_text = call_groq(prompt)
        result = safe_json_extract(response_text)

        if result is None:
            result = {
                "match_percentage": 50,
                "missing_keywords": [],
                "strengths": ["Analysis completed"],
                "improvements": ["Could not structure detailed analysis"],
                "summary": response_text[:300] if response_text else "Analysis completed but formatting failed."
            }

        return JSONResponse(content=result)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.post("/api/refine-jd")
async def refine_jd(job_description: str = Form(...)):
    """Improve job description using Groq"""
    try:
        if not job_description.strip():
            raise HTTPException(status_code=400, detail="Job description is empty")

        prompt = f"""Improve this job description to be more clear, inclusive, and appealing to top engineering talent.
Maintain all technical requirements but improve the language.

ORIGINAL JOB DESCRIPTION:
{job_description[:4000]}

Return ONLY the refined job description text, no extra commentary."""

        response_text = call_groq(prompt)
        return {"refined_jd": response_text.strip()}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Refinement failed: {str(e)}")

@app.post("/api/improve-resume")
async def improve_resume(
    resume: UploadFile = File(...),
    target_role: Optional[str] = Form(None)
):
    """Get AI feedback on resume using Groq"""
    try:
        file_bytes = await resume.read()
        filename = resume.filename.lower()

        if filename.endswith('.pdf'):
            resume_text = extract_text_from_pdf(file_bytes)
        elif filename.endswith('.docx') or filename.endswith('.doc'):
            resume_text = extract_text_from_docx(file_bytes)
        elif filename.endswith('.txt'):
            resume_text = file_bytes.decode('utf-8')
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format")

        if not resume_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text")

        resume_text = resume_text[:5000]
        role_context = f" for {target_role}" if target_role else ""

        prompt = f"""Review this resume{role_context} and provide specific, actionable improvements.

RESUME:
{resume_text}

Respond ONLY with valid JSON:
{{
    "overall_score": <number 0-100>,
    "formatting_issues": ["issue1"],
    "content_improvements": ["improvement1"],
    "missing_sections": ["section1"],
    "action_plan": "Priority order of changes"
}}

Be specific. Reference actual content from the resume when giving feedback."""

        response_text = call_groq(prompt)
        result = safe_json_extract(response_text)

        if result is None:
            result = {
                "overall_score": 70,
                "formatting_issues": [],
                "content_improvements": [response_text[:500]],
                "missing_sections": [],
                "action_plan": "Review the feedback above and implement changes."
            }

        return JSONResponse(content=result)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Improvement analysis failed: {str(e)}")

@app.post("/api/cover-letter")
async def generate_cover_letter(
    resume: UploadFile = File(...),
    job_description: str = Form(...),
    tone: str = Form("professional")
):
    """Generate a tailored cover letter using Groq"""
    try:
        file_bytes = await resume.read()
        filename = resume.filename.lower()

        if filename.endswith('.pdf'):
            resume_text = extract_text_from_pdf(file_bytes)
        elif filename.endswith('.docx') or filename.endswith('.doc'):
            resume_text = extract_text_from_docx(file_bytes)
        elif filename.endswith('.txt'):
            resume_text = file_bytes.decode('utf-8')
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format. Use PDF, DOCX, or TXT")

        if not resume_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from resume")

        resume_text = resume_text[:4000]
        job_description = job_description[:3000]

        prompt = f"""Write a compelling, personalized cover letter based on this resume and job description.

RESUME:
{resume_text}

JOB DESCRIPTION:
{job_description}

TONE: {tone}

Guidelines:
- Hook the reader in the first sentence
- Connect 2-3 specific resume achievements to job requirements
- Keep it under 300 words
- End with a confident call to action
- Do not use generic phrases like "I am writing to apply"
- Reference specific company needs from the job description

Return ONLY the cover letter text, no extra commentary."""

        response_text = call_groq(prompt)

        return {"cover_letter": response_text.strip()}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cover letter generation failed: {str(e)}")

@app.get("/api/health")
async def health_check():
    key_status = "configured" if os.getenv("GROQ_API_KEY") else "missing"
    return {
        "status": "ok",
        "service": "Verity-Flow API",
        "groq_key": key_status,
        "model": "llama-3.3-70b-versatile",
        "endpoints": ["/api/match", "/api/refine-jd", "/api/improve-resume", "/api/cover-letter"]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)