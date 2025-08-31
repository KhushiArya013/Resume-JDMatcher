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

# Load environment variables from .env file
load_dotenv()

app = FastAPI()

# Allow your Vite dev server(s) to call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


api_key = os.environ.get("GEMINI_API_KEY")
if not api_key:
    raise RuntimeError("GEMINI_API_KEY not found in environment variables.")

# Initialize the LLM
llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", temperature=0, api_key=api_key)

# Prompt template for resume matching
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


class MatchResult(BaseModel):
    match_percentage: float
    verdict: str
    analysis: str

class RefineJDRequest(BaseModel):
    job_description: str

class GenerateCoverLetterRequest(BaseModel):
    job_description: str


async def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """Extracts text from PDF bytes using LangChain's PyPDFLoader."""
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

@app.post("/refine-jd")
async def refine_jd(request: RefineJDRequest):
    if not request.job_description:
        raise HTTPException(status_code=400, detail="Job description is empty.")

    refine_prompt = PromptTemplate.from_template("""
    You are a professional job description rewriter.
    Refine the following job description to be more clear, concise, and professional.

    Raw Job Description:
    {job_description}

    Refined Job Description:
    """)
    llm_refine_chain = refine_prompt | llm
    llm_response = await llm_refine_chain.ainvoke({"job_description": request.job_description})
    return {"refined_jd": llm_response.content}

@app.post("/generate-cover-letter")
async def generate_cover_letter(request: GenerateCoverLetterRequest):
    if not request.job_description:
        raise HTTPException(status_code=400, detail="Job description is empty.")

    cover_letter_prompt = PromptTemplate.from_template("""
    You are a professional cover letter writer.
    Generate a persuasive cover letter based on the following job description.

    Job Description:
    {job_description}

    Generated Cover Letter:
    """)
    llm_cover_letter_chain = cover_letter_prompt | llm
    llm_response = await llm_cover_letter_chain.ainvoke({"job_description": request.job_description})
    return {"cover_letter": llm_response.content}

@app.post("/improve-resume")
async def improve_resume(resume: UploadFile = File(...), job_description: str = Form(...)):
    if not resume.filename or not job_description:
        raise HTTPException(status_code=400, detail="Resume file and job description are required.")

    file_bytes = await resume.read()
    resume_text = await extract_text_from_pdf(file_bytes)

    improve_prompt = PromptTemplate.from_template("""
    You are a professional resume improvement assistant.
    Analyze a candidate's resume and job description, and provide actionable recommendations.

    Resume:
    {resume_text}

    Job Description:
    {job_description}

    Provide your analysis in a clear, easy-to-read format.
    """)
    llm_improve_chain = improve_prompt | llm
    llm_response = await llm_improve_chain.ainvoke({"resume_text": resume_text, "job_description": job_description})
    return {"analysis": llm_response.content}


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))  # Render sets the PORT automatically
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
