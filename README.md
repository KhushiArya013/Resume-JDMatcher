# Verity-Flow 🚀

**AI-powered resume and job application assistant**

Verity-Flow helps job seekers analyze their resume against a job description, identify missing skills, improve their resume, refine job descriptions, and generate personalized cover letters.

---

## ✨ Features

* 📄 **Resume-JD Matcher** — Analyze resume compatibility with a job description
* 🎯 **Match Analysis** — Get match percentage, strengths, missing keywords, and improvements
* 📝 **Resume Improver** — Identify formatting/content issues and improvement areas
* 💼 **JD Refiner** — Improve and restructure job descriptions
* ✉️ **Cover Letter Generator** — Generate tailored cover letters
* 🔐 **Google Authentication**
* ☁️ **Google Drive Resume Selection**
* 🎨 Interactive UI with animations and responsive design

---

## 🛠️ Tech Stack

### Frontend

* React
* Vite
* React Router
* Axios
* GSAP
* Framer Motion
* Google OAuth

### Backend

* Python
* FastAPI
* Uvicorn
* PyPDF2
* python-docx

### AI

* Groq API
* Llama 3.3 70B
* Prompt Engineering
* Structured JSON responses

---

## 🏗️ Architecture

```text
                ┌──────────────┐
                │     User     │
                └──────┬───────┘
                       │
                       ▼
              ┌─────────────────┐
              │ React + Vite    │
              │    Frontend     │
              └────────┬────────┘
                       │ HTTP
                       ▼
              ┌─────────────────┐
              │    FastAPI      │
              │     Backend     │
              └────────┬────────┘
                       │
              ┌────────▼────────┐
              │ Resume Parsing  │
              │ + Prompt Build  │
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │   Groq API      │
              │ Llama 3.3 70B   │
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │ JSON Response   │
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │ React Results   │
              └─────────────────┘
```

---

## 🔄 How It Works

For resume matching:

```text
Resume + Job Description
          ↓
     React Frontend
          ↓
      FastAPI API
          ↓
     Extract Resume Text
          ↓
      Build AI Prompt
          ↓
      Groq / Llama
          ↓
    Parse JSON Response
          ↓
      Display Analysis
```

The backend currently supports **PDF, DOCX, DOC and TXT** resume files.

---

## 📂 Project Structure

```text
Resume-JDMatcher-main/
│
├── client/
│   └── src/
│       ├── components/
│       │   ├── MatcherForm.jsx
│       │   └── Navbar.jsx
│       ├── context/
│       │   └── AuthContext.jsx
│       ├── pages/
│       │   ├── HomePage.jsx
│       │   ├── ImproveResumePage.jsx
│       │   ├── RefineJobDescriptionPage.jsx
│       │   ├── CoverLetterPage.jsx
│       │   └── DashboardCard.jsx
│       ├── App.jsx
│       └── main.jsx
│
├── server/
│   ├── main.py
│   ├── requirements.txt
│   └── .env
│
└── README.md
```

---

## 🔌 API Endpoints

| Method | Endpoint              | Purpose                    |
| ------ | --------------------- | -------------------------- |
| `POST` | `/api/match`          | Match resume with JD       |
| `POST` | `/api/refine-jd`      | Refine a job description   |
| `POST` | `/api/improve-resume` | Analyze and improve resume |
| `POST` | `/api/coverletter`    | Generate cover letter      |
| `GET`  | `/api/health`         | Check API status           |

Interactive API documentation is available at:

```text
http://localhost:8000/docs
```

---

## 🤖 AI Matching

The matching system sends the extracted resume text and job description to **Llama 3.3 70B through Groq**.

The model is instructed to return structured JSON containing:

```json
{
  "match_percentage": 82,
  "missing_keywords": ["Docker"],
  "strengths": ["React", "Node.js"],
  "improvements": ["Add cloud experience"],
  "summary": "Strong overall match."
}
```

The match percentage is currently an **LLM-generated assessment**, not an embedding/cosine-similarity score.

---

## ⚙️ Setup

### 1. Clone the repository

```bash
git clone <repository-url>
cd Resume-JDMatcher-main
```

### 2. Backend

```bash
cd server
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Create `.env`:

```env
GROQ_API_KEY=your_groq_api_key
```

Run:

```bash
python3 -m uvicorn main:app --reload --port 8000
```

### 3. Frontend

```bash
cd client
npm install
npm run dev
```

Frontend:

```text
http://localhost:5173
```

Backend:

```text
http://localhost:8000
```

---

## 🔐 Security

* API keys are stored using environment variables
* CORS is configured on the backend
* File types are validated before processing
* Google Drive requests use read-only permissions

For production, authentication should also be verified server-side rather than relying only on client-side `localStorage` state.

---

## 🚧 Current Limitations

* Match percentage is generated by the LLM and is not a mathematically calibrated score
* Resume/JD text is currently truncated before being sent to the model
* Regex-based JSON extraction can fail for unusual model responses
* Google Drive selection exists in the frontend, but the complete backend Drive-download flow still needs integration
* Current architecture is intended for a small-scale application rather than high-concurrency production workloads

---

## 🔮 Future Improvements

* Semantic matching using embeddings
* Hybrid keyword + semantic scoring
* Resume section extraction and chunking
* PostgreSQL for user/application history
* Redis caching and rate limiting
* Background workers for AI processing
* Object storage for uploaded resumes
* Structured LLM outputs
* Better authentication and authorization
* Production monitoring and autoscaling

---

## 🎯 Project Goal

Verity-Flow was built to explore how **modern frontend development, REST APIs, document processing, authentication, and LLM-based applications** can be combined into a practical end-to-end product.

The project focuses not only on generating AI responses, but also on handling the engineering challenges around **file uploads, API communication, structured AI output, error handling, authentication, and scalability**.

---

## 👩‍💻 Author

**Khushi Arya**

B.Tech — Information Technology

[GitHub](https://github.com/KhushiArya013) • [LinkedIn](https://www.linkedin.com/in/khushi-arya-aa1515327/)
