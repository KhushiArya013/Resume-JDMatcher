import io
import os
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

# Load environment variables from .env file
load_dotenv()

app = FastAPI()

# Allow your Vite dev server(s) to call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Use the environment variable to get the Gemini API key
api_key = os.environ.get("GEMINI_API_KEY")

# Check if the API key was loaded successfully
if not api_key:
    raise RuntimeError("GEMINI_API_KEY not found in environment variables.")

# Initialize the LLM with the Gemini API key and a free model (e.g., gemini-1.5-flash)
llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", temperature=0, api_key=api_key)

# Define the prompt template for resume matching
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
- analysis: (e.g., "Candidate's skills in Python, FastAPI, and data analysis align well with the job requirements. Experience with REST APIs is a strong match.")
"""
llm_chain = PromptTemplate.from_template(prompt_template) | llm

# Define a Pydantic model for the response to automatically generate documentation
class MatchResult(BaseModel):
    match_percentage: float
    verdict: str
    analysis: str

@app.get("/")
def health():
    return {"message": "FastAPI backend is running ✅"}

async def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """Uses PyPDFLoader from LangChain to extract text from PDF bytes."""
    with io.BytesIO(pdf_bytes) as pdf_buffer:
        temp_file_path = "temp_resume.pdf"
        try:
            with open(temp_file_path, "wb") as temp_file:
                temp_file.write(pdf_buffer.read())

            loader = PyPDFLoader(temp_file_path, extraction_kwargs={"strict": False})
            pages = loader.load_and_split()

            full_text = " ".join([page.page_content for page in pages])
            return full_text
        except PdfStreamError as e:
            raise HTTPException(status_code=400, detail=f"Failed to read the PDF. It may be corrupted or malformed. (Error: {str(e)})")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"An error occurred while extracting text from the PDF: {str(e)}")
        finally:
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)

@app.post("/match", response_model=MatchResult)
async def match_resume_with_llm(
    resume: UploadFile = File(...),
    job_description: str = Form(...),
):
    """
    Analyzes an uploaded PDF resume against a provided job description using an LLM.
    Returns a match percentage, verdict, and a detailed analysis.
    """
    try:
        if not resume.filename:
            raise HTTPException(status_code=400, detail="No file uploaded.")

        if resume.content_type not in ("application/pdf", "application/octet-stream"):
            raise HTTPException(status_code=400, detail="Please upload a PDF file.")

        file_bytes = await resume.read()
        resume_text = await extract_text_from_pdf(file_bytes)
        
        chain_input = {
            "resume_text": resume_text,
            "job_description": job_description
        }

        llm_response = await llm_chain.ainvoke(chain_input)
        
        try:
            response_text = llm_response.content
            
            # Clean the response text by removing markdown fences
            match = re.search(r'```json\n(.*?)```', response_text, re.DOTALL)
            if match:
                response_text = match.group(1)
            
            response_data = json.loads(response_text)
        except json.JSONDecodeError:
            raise HTTPException(status_code=500, detail=f"LLM response could not be parsed: {llm_response.content}")

        return response_data

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An internal server error occurred: {str(e)}")
