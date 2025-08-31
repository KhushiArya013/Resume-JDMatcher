import io
import os
import uvicorn
import json
import re
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from langchain.prompts import PromptTemplate
from langchain_community.document_loaders import PyPDFLoader
from langchain_google_genai import ChatGoogleGenerativeAI
from pydantic import BaseModel
from pypdf.errors import PdfStreamError
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://resume-jd-matcher.vercel.app/",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_key = os.environ.get("GEMINI_API_KEY")
if not api_key:
    raise RuntimeError("GEMINI_API_KEY not found in environment variables.")

llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", temperature=0, api_key=api_key)

prompt_template = """
You are an expert resume screening bot.
Your task is to analyze a candidate's resume and determine the match percentage with the provided job description.
Provide the match percentage, a simple verdict, and a list of key matching skills or qualifications.

Resume:
{resume_text}

Job Description:
{job_description}

Format your response as a JSON object with the following keys:
- match_percentage: (e.g., 85.5)
- verdict: (e.g., "Good match")
- analysis: (e.g., "Candidate's skills in Python, FastAPI, and data analysis align well with the job requirements.")
"""
llm_chain = PromptTemplate.from_template(prompt_template) | llm

class MatchResult(BaseModel):
    match_percentage: float
    verdict: str
    analysis: str

async def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    with io.BytesIO(pdf_bytes) as pdf_buffer:
        temp_file_path = "temp_resume.pdf"
        try:
            with open(temp_file_path, "wb") as temp_file:
                temp_file.write(pdf_buffer.read())
            loader = PyPDFLoader(temp_file_path, extraction_kwargs={"strict": False})
            pages = loader.load_and_split()
            return " ".join([page.page_content for page in pages])
        except PdfStreamError as e:
            raise HTTPException(status_code=400, detail=f"Failed to read the PDF. {str(e)}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error extracting text from PDF: {str(e)}")
        finally:
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)

@app.get("/")
def health():
    return {"message": "FastAPI backend is running ✅"}

@app.post("/match", response_model=MatchResult)
async def match_resume_with_llm(resume: UploadFile = File(...), job_description: str = Form(...)):
    if not resume.filename:
        raise HTTPException(status_code=400, detail="No file uploaded.")
    if resume.content_type not in ("application/pdf", "application/octet-stream"):
        raise HTTPException(status_code=400, detail="Please upload a PDF file.")

    file_bytes = await resume.read()
    resume_text = await extract_text_from_pdf(file_bytes)
    chain_input = {"resume_text": resume_text, "job_description": job_description}

    llm_response = await llm_chain.ainvoke(chain_input)
    response_text = llm_response.content

    # Remove JSON fences if present
    match = re.search(r'```json\n(.*?)```', response_text, re.DOTALL)
    if match:
        response_text = match.group(1)

    try:
        response_data = json.loads(response_text)
        return response_data
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail=f"LLM response could not be parsed: {llm_response.content}")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
