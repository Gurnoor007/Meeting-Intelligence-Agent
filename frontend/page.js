"use client";
import { useState, useEffect } from "react";

export default function Home() {
  const [meetings, setMeetings] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => { fetchMeetings(); }, []);

  async function fetchMeetings() {
    const res = await fetch("http://localhost:8000/meetings");
    const data = await res.json();
    setMeetings(data);
  }

  async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("http://localhost:8000/upload", { method: "POST", body: formData });
    const data = await res.json();
    setUploading(false);
    fetchMeetings();
    setSelected(data);
  }

  return (
   <main style={{ fontFamily: "'Inter', sans-serif", minHeight: "100vh", background: "#f5f5f5", padding: 32, display: "flex", justifyContent: "center" }}>
      <div style={{ maxWidth: 820, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "#111", margin: 0 }}> Meeting Intelligence</h1>
          <p style={{ color: "#888", marginTop: 6, fontSize: 14 }}>Upload any meeting recording — get transcript, summary, and action items instantly.</p>
        </div>

        {/* Upload card */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 32, textAlign: "center", marginBottom: 24, border: "1px solid #e5e5e5" }}>
          {uploading ? (
            <div>
              <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
              <p style={{ color: "#666", fontWeight: 500 }}>Processing your meeting...</p>
              <p style={{ color: "#aaa", fontSize: 13 }}>Transcribing + extracting insights. Takes ~1 min.</p>
            </div>
          ) : (
            <div>
              <p style={{ color: "#444", marginBottom: 16, fontWeight: 500 }}>Drop your meeting audio here</p>
              <label style={{ background: "#111", color: "#fff", padding: "12px 28px", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 500 }}>
                Upload Audio
                <input type="file" accept="audio/*" onChange={handleUpload} style={{ display: "none" }} />
              </label>
              <p style={{ color: "#bbb", fontSize: 12, marginTop: 12 }}>Supports MP3, MP4, WAV, M4A</p>
            </div>
          )}
        </div>

        {/* Result card */}
        {selected && (
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, marginBottom: 24, border: "1px solid #e5e5e5" }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: "#111" }}>📋 Latest Result — {selected.filename}</h2>

            <div style={{ background: "#f9f9f9", borderRadius: 10, padding: 16, marginBottom: 16 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Transcript</p>
              <p style={{ color: "#333", fontSize: 14, lineHeight: 1.7 }}>{selected.transcript}</p>
            </div>

            <div style={{ background: "#fffbea", borderRadius: 10, padding: 16, marginBottom: 16, border: "1px solid #fde68a" }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: "#92400e", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Summary</p>
              <p style={{ color: "#333", fontSize: 14, lineHeight: 1.7 }}>{selected.summary}</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ background: "#f0fdf4", borderRadius: 10, padding: 16, border: "1px solid #bbf7d0" }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: "#166534", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>✅ Action Items</p>
                {selected.action_items.length === 0 ? (
                  <p style={{ color: "#aaa", fontSize: 13 }}>None found</p>
                ) : (
                  selected.action_items.map((item, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                      <span style={{ color: "#16a34a", fontWeight: 700 }}>•</span>
                      <p style={{ color: "#333", fontSize: 13, margin: 0 }}>{item}</p>
                    </div>
                  ))
                )}
              </div>
              <div style={{ background: "#eff6ff", borderRadius: 10, padding: 16, border: "1px solid #bfdbfe" }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: "#1e40af", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>🔵 Decisions</p>
                {selected.decisions.length === 0 ? (
                  <p style={{ color: "#aaa", fontSize: 13 }}>None found</p>
                ) : (
                  selected.decisions.map((item, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                      <span style={{ color: "#2563eb", fontWeight: 700 }}>•</span>
                      <p style={{ color: "#333", fontSize: 13, margin: 0 }}>{item}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Past meetings */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 28, border: "1px solid #e5e5e5" }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: "#111" }}>🕘 Past Meetings</h2>
          {meetings.length === 0 ? (
            <p style={{ color: "#bbb", fontSize: 14 }}>No meetings yet. Upload one above.</p>
          ) : (
            meetings.map((m) => (
              <div key={m.id} onClick={() => setSelected(m)}
                style={{ border: "1px solid #eee", borderRadius: 10, padding: 14, marginBottom: 10, cursor: "pointer", transition: "border 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "#111"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "#eee"}>
                <p style={{ fontWeight: 600, fontSize: 14, color: "#111", margin: 0 }}>🎙️ {m.filename}</p>
                <p style={{ color: "#888", fontSize: 13, marginTop: 4 }}>{m.summary}</p>
              </div>
            ))
          )}
        </div>

      </div>
    </main>
  );
}