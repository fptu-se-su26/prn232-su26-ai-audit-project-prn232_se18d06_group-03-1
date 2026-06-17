# AI Verification Service

This is the Python AI Service for document verification (Driver's License, Vehicle Documents, Face comparison, and Recommendation).

## Setup & Run

1. **Create a virtual environment**:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On Linux/macOS:
   source venv/bin/activate
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment variables**:
   Ensure `.env` exists (copied from `.env.example`).

4. **Run the API server**:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
