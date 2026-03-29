"use client";

import { useState, useEffect } from "react";

var C = {
  bg: "#FFFBF5", bgWarm: "#FFF5EB", coral: "#FF6B4A", navy: "#1B1340",
  teal: "#2ECDA7", tealLight: "#E8FBF5", gold: "#FFBE3D",
  text: "#1B1340", textMid: "#4A4270", textLight: "#8B83A8",
  cardBg: "#FFFFFF", border: "#EDE8E3", coralLight: "#FFF0EC",
};

var GENRES = [
  { id: "pop", emoji: "✨", label: "Pop" },
  { id: "lullaby", emoji: "🌙", label: "Lullaby" },
  { id: "rock", emoji: "🎸", label: "Rock" },
  { id: "country", emoji: "🌻", label: "Country" },
  { id: "hiphop", emoji: "🎧", label: "Hip-Hop" },
  { id: "reggae", emoji: "☀️", label: "Reggae" },
];

var MOODS = [
  { id: "energetic", emoji: "⚡", label: "Energetic" },
  { id: "calming", emoji: "☁️", label: "Calming" },
  { id: "silly", emoji: "🤪", label: "Silly" },
  { id: "adventurous", emoji: "🚀", label: "Adventurous" },
  { id: "sweet", emoji: "💛", label: "Sweet" },
];

export default function FreeSongPage() {
  var [key, setKey] = useState("");
  var [name, setName] = useState("");
  var [age, setAge] = useState("");
  var [story, setStory] = useState("");
  var [genre, setGenre] = useState("pop");
  var [mood, setMood] = useState("energetic");
  var [loading, setLoading] = useState(false);
  var [error, setError] = useState("");
  var [valid, setValid] = useState(false);

  useEffect(function () {
    var params = new URLSearchParams(window.location.search);
    var k = params.get("key");
    if (k) { setKey(k); setValid(true); }
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !story.trim()) {
      setError("Please fill in name and story");
      return;
    }
    setLoading(true);
    setError("");

    try {
      var res = await fetch("/api/free-song", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childName: name.trim(),
          age: age.trim(),
          story: story.trim(),
          genre: genre,
          mood: mood,
          key: key,
        }),
      });
      var data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }
      window.location.href = data.url;
    } catch (err) {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  if (!valid) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
          <h1 style={{ fontFamily: "system-ui", fontSize: 24, color: C.navy, marginBottom: 8 }}>Promo Link Required</h1>
          <p style={{ fontFamily: "system-ui", fontSize: 16, color: C.textMid }}>This page requires a valid promo link.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;500;600;700;800&family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
      `}</style>

      <nav style={{ padding: "20px 40px", display: "flex", alignItems: "center", gap: 12 }}>
        <a href="/" style={{ fontFamily: "'Baloo 2'", fontSize: 24, fontWeight: 800, color: C.navy, textDecoration: "none" }}>
          <span style={{ color: C.coral }}>♪</span> LittleBops
        </a>
        <span style={{
          background: C.tealLight, color: C.teal, padding: "4px 12px",
          borderRadius: 100, fontFamily: "'DM Sans'", fontSize: 12, fontWeight: 700,
        }}>FREE SONG</span>
      </nav>

      <div style={{ maxWidth: 540, margin: "0 auto", padding: "20px 24px 80px" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h1 style={{ fontFamily: "'Baloo 2'", fontSize: 36, fontWeight: 800, color: C.navy, marginBottom: 8 }}>
            Create a free song
          </h1>
          <p style={{ fontFamily: "'DM Sans'", fontSize: 16, color: C.textMid }}>
            You've been given a free personalized song!
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{
          background: C.cardBg, borderRadius: 22, padding: 28,
          border: "1.5px solid " + C.border, boxShadow: "0 2px 20px rgba(27,19,64,0.03)",
        }}>
          {/* Name */}
          <label style={{ display: "block", marginBottom: 16 }}>
            <span style={{ fontFamily: "'DM Sans'", fontWeight: 600, fontSize: 14, color: C.navy, display: "block", marginBottom: 6 }}>
              Child's name *
            </span>
            <input value={name} onChange={function (e) { setName(e.target.value); }}
              placeholder="e.g. Emma" maxLength={100}
              style={{
                width: "100%", padding: "12px 16px", borderRadius: 12, fontSize: 16,
                border: "1.5px solid " + C.border, fontFamily: "'DM Sans'",
                outline: "none", background: C.bg,
              }} />
          </label>

          {/* Age */}
          <label style={{ display: "block", marginBottom: 16 }}>
            <span style={{ fontFamily: "'DM Sans'", fontWeight: 600, fontSize: 14, color: C.navy, display: "block", marginBottom: 6 }}>
              Age (optional)
            </span>
            <input value={age} onChange={function (e) { setAge(e.target.value); }}
              placeholder="e.g. 5" maxLength={10}
              style={{
                width: "100%", padding: "12px 16px", borderRadius: 12, fontSize: 16,
                border: "1.5px solid " + C.border, fontFamily: "'DM Sans'",
                outline: "none", background: C.bg,
              }} />
          </label>

          {/* Story */}
          <label style={{ display: "block", marginBottom: 20 }}>
            <span style={{ fontFamily: "'DM Sans'", fontWeight: 600, fontSize: 14, color: C.navy, display: "block", marginBottom: 6 }}>
              Tell us about them *
            </span>
            <textarea value={story} onChange={function (e) { setStory(e.target.value); }}
              placeholder="What do they love? Favorite animals, activities, dreams..."
              rows={4} maxLength={2000}
              style={{
                width: "100%", padding: "12px 16px", borderRadius: 12, fontSize: 16,
                border: "1.5px solid " + C.border, fontFamily: "'DM Sans'",
                outline: "none", background: C.bg, resize: "vertical",
              }} />
          </label>

          {/* Genre */}
          <div style={{ marginBottom: 16 }}>
            <span style={{ fontFamily: "'DM Sans'", fontWeight: 600, fontSize: 14, color: C.navy, display: "block", marginBottom: 8 }}>
              Genre
            </span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {GENRES.map(function (g) {
                var selected = genre === g.id;
                return (
                  <button key={g.id} type="button" onClick={function () { setGenre(g.id); }}
                    style={{
                      padding: "8px 16px", borderRadius: 100, cursor: "pointer",
                      border: selected ? "2px solid " + C.coral : "1.5px solid " + C.border,
                      background: selected ? C.coralLight : C.bg,
                      fontFamily: "'DM Sans'", fontSize: 14, fontWeight: 600,
                      color: selected ? C.coral : C.textMid,
                    }}>
                    {g.emoji} {g.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mood */}
          <div style={{ marginBottom: 24 }}>
            <span style={{ fontFamily: "'DM Sans'", fontWeight: 600, fontSize: 14, color: C.navy, display: "block", marginBottom: 8 }}>
              Mood
            </span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {MOODS.map(function (m) {
                var selected = mood === m.id;
                return (
                  <button key={m.id} type="button" onClick={function () { setMood(m.id); }}
                    style={{
                      padding: "8px 16px", borderRadius: 100, cursor: "pointer",
                      border: selected ? "2px solid " + C.coral : "1.5px solid " + C.border,
                      background: selected ? C.coralLight : C.bg,
                      fontFamily: "'DM Sans'", fontSize: 14, fontWeight: 600,
                      color: selected ? C.coral : C.textMid,
                    }}>
                    {m.emoji} {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div style={{
              padding: "12px 16px", borderRadius: 12, marginBottom: 16,
              background: "#FEF2F2", color: "#DC2626", fontFamily: "'DM Sans'", fontSize: 14,
            }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            style={{
              width: "100%", padding: "16px 24px", borderRadius: 14,
              background: loading ? C.textLight : C.coral, color: "#fff",
              fontFamily: "'DM Sans'", fontWeight: 700, fontSize: 17,
              border: "none", cursor: loading ? "not-allowed" : "pointer",
              boxShadow: loading ? "none" : "0 4px 20px " + C.coral + "40",
            }}>
            {loading ? "Creating song..." : "Create Free Song"}
          </button>
        </form>
      </div>
    </div>
  );
}
