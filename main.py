from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Field, Session, SQLModel, create_engine, select
import subprocess, uuid, os, json, re
import whisper
import ollama

engine = create_engine("sqlite:///meetings.db")

class Meeting(SQLModel, table=True):
    id: str = Field(default=None, primary_key=True)
    filename: str
    transcript: str
    summary: str
    action_items: str
    decisions: str

SQLModel.metadata.create_all(engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

model = whisper.load_model("tiny")

@app.get("/health")
def health():
    return {"status": "ok", "message": "Meeting agent is running"}

@app.get("/meetings")
def get_meetings():
    with Session(engine) as session:
        meetings = session.exec(select(Meeting)).all()
        return [
            {
                "id": m.id,
                "filename": m.filename,
                "transcript": m.transcript,
                "summary": m.summary,
                "action_items": json.loads(m.action_items),
                "decisions": json.loads(m.decisions),
            }
            for m in meetings
        ]

@app.post("/upload")
async def upload_audio(file: UploadFile = File(...)):
    job_id = str(uuid.uuid4())
    ext = os.path.splitext(file.filename)[1].lower()
    raw_path = f"/tmp/{job_id}_raw{ext}"
    wav_path = f"/tmp/{job_id}.wav"

    with open(raw_path, "wb") as f:
        f.write(await file.read())

    subprocess.run([
        "ffmpeg", "-i", raw_path,
        "-ac", "1",
        "-ar", "16000",
        "-y", wav_path
    ], check=True, capture_output=True)

    os.remove(raw_path)

    result = model.transcribe(wav_path)
    transcript = result["text"]

    prompt = f"""
You are a meeting assistant. Analyze this transcript.
Return ONLY a raw JSON object. No markdown, no backticks, no explanation.

Use exactly this structure:
{{
  "summary": "one sentence summary here",
  "action_items": ["person: task by deadline", "person: task by deadline"],
  "decisions": ["decision 1", "decision 2"]
}}

Transcript: {transcript}
"""

    response = ollama.chat(
        model="llama3.2",
        messages=[{"role": "user", "content": prompt}]
    )

    raw_reply = response["message"]["content"].strip()

    match = re.search(r'\{.*\}', raw_reply, re.DOTALL)
    if match:
        raw_reply = match.group()

    try:
        parsed = json.loads(raw_reply)
    except:
        parsed = {"summary": raw_reply, "action_items": [], "decisions": []}

    meeting = Meeting(
        id=job_id,
        filename=file.filename,
        transcript=transcript,
        summary=parsed.get("summary", ""),
        action_items=json.dumps(parsed.get("action_items", [])),
        decisions=json.dumps(parsed.get("decisions", [])),
    )
    with Session(engine) as session:
        session.add(meeting)
        session.commit()

    return {
        "job_id": job_id,
        "transcript": transcript,
        "summary": parsed.get("summary", ""),
        "action_items": parsed.get("action_items", []),
        "decisions": parsed.get("decisions", [])
    }
