# Tech Pulse

Tech Pulse is a simple web application combining FastAPI backend and React frontend for audio transcription using the Whisper model. Users can register, verify email, login, upload audio files, and download generated transcriptions. Admins can manage users and review logs. Still in production.

## Quick Start

1. Backend:
```
cd backend
python -m venv .env
.\.env\Scripts\activate
pip install -r requirements.txt
cp .env.example .env

# Update .env with your settings
uvicorn  app.main:app --reload --port 8000
```

2. Frontend:
```
cd frontend
npm install
npm start
```

## Project Structure
- backend/ - FastAPI application
- frontend/ - React application
- PROJECf_DOCUMENTATION.md - Full documentation
- backend/API_DOCUMENTATION.md - API reference for backend endpoints

## Next Steps
- See `PROJECT_DOCUMENTATION.md` for prioritized improvements and TODOs.
