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

# Add a Pydantic model for the request body for the new endpoint
class RefineJDRequest(BaseModel):
    job_description: str

# Add a Pydantic model for the request body for the generate cover letter endpoint
class GenerateCoverLetterRequest(BaseModel):
    job_description: str

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

@app.post("/refine-jd")
async def refine_jd(request: RefineJDRequest):
    """
    Refines a given job description using an LLM.
    """
    try:
        if not request.job_description:
            raise HTTPException(status_code=400, detail="Job description is empty.")

        refine_prompt = PromptTemplate.from_template("""
        You are a professional job description rewriter.
        Your task is to take a raw job description and refine it to be more clear, concise, and professional.
        Focus on improving readability, adding key responsibilities, and ensuring a strong and engaging tone.
        Return the refined job description as plain text.

        Raw Job Description:
        {job_description}

        Refined Job Description:
        """)

        llm_refine_chain = refine_prompt | llm
        
        llm_response = await llm_refine_chain.ainvoke({"job_description": request.job_description})
        
        return {"refined_jd": llm_response.content}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An internal server error occurred: {str(e)}")

@app.post("/generate-cover-letter")
async def generate_cover_letter(request: GenerateCoverLetterRequest):
    """
    Generates a cover letter based on a job description using an LLM.
    """
    try:
        if not request.job_description:
            raise HTTPException(status_code=400, detail="Job description is empty.")

        cover_letter_prompt = PromptTemplate.from_template("""
        You are a professional cover letter writer.
        Your task is to take a job description and generate a professional, persuasive cover letter.
        Make sure the cover letter is well-structured and focuses on highlighting how the candidate's skills would benefit the company.
        Return the generated cover letter as plain text.

        Job Description:
        {job_description}

        Generated Cover Letter:
        """)

        llm_cover_letter_chain = cover_letter_prompt | llm
        
        llm_response = await llm_cover_letter_chain.ainvoke({"job_description": request.job_description})
        
        return {"cover_letter": llm_response.content}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An internal server error occurred: {str(e)}")

@app.post("/improve-resume")
async def improve_resume(
    resume: UploadFile = File(...),
    job_description: str = Form(...),
):
    """
    Analyzes a resume against a job description and suggests improvements using an LLM.
    """
    try:
        if not resume.filename or not job_description:
            raise HTTPException(status_code=400, detail="Resume file and job description are required.")

        file_bytes = await resume.read()
        resume_text = await extract_text_from_pdf(file_bytes)
        
        improve_prompt = PromptTemplate.from_template("""
        You are a professional resume improvement assistant.
        Your task is to analyze a candidate's resume and a job description to provide actionable recommendations for improvement.
        Focus on the following areas:
        1.  **Missing Keywords:** Identify important keywords from the job description that are not present in the resume.
        2.  **Weak Bullet Points:** Suggest specific ways to rephrase or quantify achievements in the resume's experience section to better align with the job description.
        3.  **Overall Summary:** Provide a concise summary of the key changes needed to make the resume more compatible with the job.

        Resume:
        {resume_text}

        Job Description:
        {job_description}

        Provide your analysis in a clear, easy-to-read format.
        """)

        llm_improve_chain = improve_prompt | llm
        
        llm_response = await llm_improve_chain.ainvoke({"resume_text": resume_text, "job_description": job_description})
        
        return {"analysis": llm_response.content}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An internal server error occurred: {str(e)}")
    if __name__ == "__main__":
        port = int(os.environ.get("PORT", 8000))  # Render sets the PORT automatically
        uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
