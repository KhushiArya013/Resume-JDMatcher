import io
import os
import uvicorn
import json
import re
from fastapi import FastAPI, Form, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from langchain.prompts import PromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
from pydantic import BaseModel
from pypdf.errors import PdfStreamError
from dotenv import load_dotenv
from PyPDF2 import PdfReader

# Load environment variables
load_dotenv()

# FastAPI app
app = FastAPI()

# CORS
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://resume-jd-matcher.vercel.app",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Keys
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise RuntimeError("Required GEMINI_API_KEY environment variable is missing.")

# LLM setup
llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", temperature=0, api_key=api_key)

# Prompt templates
match_prompt_template = """
You are an expert resume screening bot.
Your task is to analyze a candidate's resume and determine the match percentage with the provided job description.
Provide the match percentage, a simple verdict, and a list of key matching skills or qualifications.

Resume:
{resume_text}

Job Description:
{job_description}

Format your response as a JSON object with the following keys:
- match_percentage (int)
- verdict (string)
- analysis (string)
"""

refine_jd_prompt_template = """
You are an expert at creating and refining job descriptions.
Your task is to refine the provided job description to make it more professional, appealing, and effective for attracting candidates.
Consider the following refinement goals: {goals}.

Original Job Description:
{job_description}

Provide the refined job description in a JSON object with the following keys:
- refined_jd (string)
"""

improve_resume_prompt_template = """
You are an expert career coach and resume writer.
Your task is to analyze a resume against a job description and provide actionable advice to improve the resume.
Highlight the resume's strengths, identify key gaps, and suggest specific improvements tailored to the target job description.

Resume:
{resume_text}

Job Description:
{job_description}

Provide your analysis in a JSON object with the following keys:
- strengths (string)
- gaps (string)
- suggestions (string)
"""

# LLM Chains
llm_match_chain = PromptTemplate.from_template(match_prompt_template) | llm
llm_refine_chain = PromptTemplate.from_template(refine_jd_prompt_template) | llm
llm_improve_resume_chain = PromptTemplate.from_template(improve_resume_prompt_template) | llm

# Pydantic Models
class MatchResult(BaseModel):
    match_percentage: int
    verdict: str
    analysis: str
    user_email: str

class RefinedJDResult(BaseModel):
    refined_jd: str

class ImproveResumeResult(BaseModel):
    strengths: str
    gaps: str
    suggestions: str

# PDF text extraction
async def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    try:
        pdf_buffer = io.BytesIO(pdf_bytes)
        reader = PdfReader(pdf_buffer)
        text = ""
        for page in reader.pages:
            text += page.extract_text() or ""
        return text
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read the PDF. {str(e)}")

# Helper function to parse and clean LLM response
def parse_llm_json_response(response_text: str):
    match = re.search(r'```json\n(.*?)```', response_text, re.DOTALL)
    if match:
        response_text = match.group(1)
    try:
        return json.loads(response_text)
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="LLM returned an invalid JSON format.")

# Health check
@app.get("/")
def health():
    return {"message": "FastAPI backend is running ✅"}

# Dummy user for local testing
DUMMY_USER = {"email": "testuser@example.com"}

# Resume match endpoint
@app.post("/match", response_model=MatchResult)
async def match_resume(
    job_description: str = Form(...),
    resume: UploadFile = File(...)
):
    try:
        file_bytes = await resume.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read uploaded file: {str(e)}")

    resume_text = await extract_text_from_pdf(file_bytes)
    chain_input = {"resume_text": resume_text, "job_description": job_description}
    llm_response = await llm_match_chain.ainvoke(chain_input)
    response_data = parse_llm_json_response(llm_response.content)

    # Add dummy user email
    response_data["user_email"] = DUMMY_USER["email"]
    return response_data

# Refine job description endpoint
@app.post("/refine-jd", response_model=RefinedJDResult)
async def refine_job_description(
    job_description: str = Form(...),
    goals: str = Form(None)
):
    if goals is None:
        goals = "Make it more professional, clear, and attractive to qualified candidates."
    chain_input = {"job_description": job_description, "goals": goals}
    llm_response = await llm_refine_chain.ainvoke(chain_input)
    response_data = parse_llm_json_response(llm_response.content)
    return response_data

# Improve resume endpoint
@app.post("/improve-resume", response_model=ImproveResumeResult)
async def improve_resume(
    job_description: str = Form(...),
    resume: UploadFile = File(...)
):
    try:
        file_bytes = await resume.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read uploaded file: {str(e)}")

    resume_text = await extract_text_from_pdf(file_bytes)
    chain_input = {"resume_text": resume_text, "job_description": job_description}
    llm_response = await llm_improve_resume_chain.ainvoke(chain_input)
    response_data = parse_llm_json_response(llm_response.content)

    return response_data

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
