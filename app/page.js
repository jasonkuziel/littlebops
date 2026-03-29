"use client";

import { useState, useEffect, useRef } from "react";

/*
  DESIGN: "Storybook Luxe"
  - Warm cream + deep navy + coral accent
  - Baloo 2 display + DM Sans body
  - Generous whitespace, overlapping elements
  - Subtle grain texture, soft blob backgrounds
  - Staggered reveal animations
  - Premium but warm — not childish, not corporate
*/

var C = {
  bg: "#FFFBF5",
  bgWarm: "#FFF5EB",
  bgDeep: "#1B1340",
  coral: "#FF6B4A",
  coralDark: "#E85A3A",
  coralLight: "#FFF0EC",
  navy: "#1B1340",
  navyLight: "#2D2460",
  teal: "#2ECDA7",
  tealLight: "#E8FBF5",
  gold: "#FFBE3D",
  goldLight: "#FFF8E7",
  lavender: "#E8E0FF",
  text: "#1B1340",
  textMid: "#4A4270",
  textLight: "#8B83A8",
  cardBg: "#FFFFFF",
  border: "#EDE8E3",
};

var GENRES = [
  { id: "pop", emoji: "✨", label: "Pop", color: "#FF6B4A" },
  { id: "lullaby", emoji: "🌙", label: "Lullaby", color: "#7C6CDB" },
  { id: "rock", emoji: "🎸", label: "Rock", color: "#FF4D6A" },
  { id: "country", emoji: "🌻", label: "Country", color: "#E8A838" },
  { id: "hiphop", emoji: "🎧", label: "Hip-Hop", color: "#4AADFF" },
  { id: "reggae", emoji: "☀️", label: "Reggae", color: "#2ECDA7" },
];

var MOODS = [
  { id: "energetic", emoji: "⚡", label: "Energetic", color: "#FF6B4A" },
  { id: "calming", emoji: "☁️", label: "Calming", color: "#7C6CDB" },
  { id: "silly", emoji: "🤪", label: "Silly", color: "#FFBE3D" },
  { id: "adventurous", emoji: "🚀", label: "Adventurous", color: "#4AADFF" },
  { id: "sweet", emoji: "💛", label: "Sweet", color: "#FF8FAB" },
];

function GrainOverlay() {
  return (
    <div style={{
      position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9999, opacity: 0.03,
      backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
    }} />
  );
}

function Blob(props) {
  return (
    <div style={{
      position: "absolute",
      width: props.size || 400,
      height: props.size || 400,
      borderRadius: "50%",
      background: props.color || C.coralLight,
      filter: "blur(" + (props.blur || 80) + "px)",
      opacity: props.opacity || 0.5,
      top: props.top, left: props.left, right: props.right, bottom: props.bottom,
      pointerEvents: "none",
      zIndex: 0,
    }} />
  );
}

function FadeIn(props) {
  var ref = useRef(null);
  var [visible, setVisible] = useState(false);

  useEffect(function() {
    var observer = new IntersectionObserver(function(entries) {
      if (entries[0].isIntersecting) setVisible(true);
    }, { threshold: 0.15 });
    if (ref.current) observer.observe(ref.current);
    return function() { observer.disconnect(); };
  }, []);

  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(32px)",
      transition: "opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)",
      transitionDelay: (props.delay || 0) + "s",
      ...props.style,
    }}>
      {props.children}
    </div>
  );
}

function Pill(props) {
  var selected = props.selected;
  var color = props.color || C.coral;
  return (
    <button onClick={props.onClick} style={{
      display: "inline-flex", alignItems: "center", gap: 8,
      padding: "10px 18px", borderRadius: 100, cursor: "pointer",
      border: selected ? ("2.5px solid " + color) : "2.5px solid " + C.border,
      background: selected ? (color + "12") : C.cardBg,
      fontFamily: "'DM Sans', sans-serif",
      fontSize: 14, fontWeight: 600,
      color: selected ? color : C.textMid,
      transition: "all 0.2s ease",
      boxShadow: selected ? ("0 2px 12px " + color + "25") : "none",
      outline: "none",
    }}>
      <span style={{ fontSize: 18 }}>{props.emoji}</span>
      {props.label}
    </button>
  );
}

export default function Home() {
  var [page, setPage] = useState("landing");
  var [formData, setFormData] = useState({ childName: "", age: "", story: "", genre: "pop", mood: "energetic" });
  var [loading, setLoading] = useState(false);
  var [error, setError] = useState("");
  var formRef = useRef(null);

  async function handleSubmit() {
    if (!formData.childName || !formData.story) {
      setError("Please fill in your child's name and story!");
      return;
    }
    setLoading(true);
    setError("");
    try {
      var res = await fetch("/api/create-song", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      var data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || "Something went wrong");
        setLoading(false);
      }
    } catch (err) {
      setError("Connection error — please try again");
      setLoading(false);
    }
  }

  /* ─── STYLES ─── */
  var globalCSS = `
    @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;500;600;700;800&family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    ::selection { background: ${C.coral}30; color: ${C.navy}; }
    @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-14px); } }
    @keyframes fadeUp { from { opacity: 0; transform: translateY(28px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes scaleIn { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); } }
    @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
    @keyframes noteFloat1 { 0%,100% { transform: translate(0,0) rotate(0deg); opacity: 0.15; } 25% { transform: translate(12px,-18px) rotate(8deg); } 50% { transform: translate(-8px,-30px) rotate(-5deg); opacity: 0.25; } 75% { transform: translate(15px,-15px) rotate(12deg); } }
    @keyframes noteFloat2 { 0%,100% { transform: translate(0,0) rotate(0deg); opacity: 0.12; } 33% { transform: translate(-15px,-20px) rotate(-10deg); } 66% { transform: translate(10px,-35px) rotate(8deg); opacity: 0.22; } }
    input:focus, textarea:focus { border-color: ${C.coral} !important; box-shadow: 0 0 0 4px ${C.coral}15 !important; }
  `;

  /* ─── CREATE PAGE ─── */
  if (page === "create") {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, position: "relative", overflow: "hidden" }}>
        <style>{globalCSS}</style>
        <GrainOverlay />
        <Blob color={C.coralLight} size={500} top="-200px" right="-150px" blur={100} opacity={0.4} />
        <Blob color={C.lavender} size={400} bottom="-100px" left="-100px" blur={100} opacity={0.3} />

        {/* Nav */}
        <nav style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "20px 32px", position: "relative", zIndex: 2,
        }}>
          <a href="/" onClick={function(e) { e.preventDefault(); setPage("landing"); }}
            style={{ fontFamily: "'Baloo 2'", fontSize: 26, fontWeight: 800, color: C.navy, textDecoration: "none", letterSpacing: "-0.5px" }}>
            <span style={{ color: C.coral }}>♪</span> LittleBops
          </a>
        </nav>

        {/* Form */}
        <div ref={formRef} style={{ maxWidth: 580, margin: "0 auto", padding: "20px 24px 80px", position: "relative", zIndex: 1 }}>
          <FadeIn>
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <div style={{
                display: "inline-block", padding: "6px 16px", borderRadius: 100,
                background: C.coralLight, color: C.coral,
                fontFamily: "'DM Sans'", fontWeight: 600, fontSize: 13, letterSpacing: "0.5px",
                marginBottom: 16,
              }}>
                STEP 1 OF 2
              </div>
              <h1 style={{
                fontFamily: "'Baloo 2'", fontSize: "clamp(32px, 5vw, 44px)", fontWeight: 800,
                color: C.navy, lineHeight: 1.15, marginBottom: 10,
              }}>
                Tell us about your little star
              </h1>
              <p style={{
                fontFamily: "'DM Sans'", fontSize: 17, color: C.textMid, lineHeight: 1.6, maxWidth: 440, margin: "0 auto",
              }}>
                The more you share, the more personal and magical the song becomes.
              </p>
            </div>
          </FadeIn>

          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Name + Age */}
            <FadeIn delay={0.1}>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                <label style={{ flex: "2 1 220px" }}>
                  <span style={{ fontFamily: "'DM Sans'", fontWeight: 600, fontSize: 14, color: C.textMid, display: "block", marginBottom: 6 }}>
                    Child's name
                  </span>
                  <input value={formData.childName} onChange={function(e) { setFormData({...formData, childName: e.target.value}); }}
                    placeholder="Luna"
                    style={{
                      width: "100%", padding: "14px 16px", borderRadius: 14,
                      border: "2px solid " + C.border, fontSize: 16,
                      fontFamily: "'DM Sans'", background: C.cardBg,
                      outline: "none", boxSizing: "border-box",
                      transition: "border-color 0.2s, box-shadow 0.2s",
                    }}
                  />
                </label>
                <label style={{ flex: "1 1 100px" }}>
                  <span style={{ fontFamily: "'DM Sans'", fontWeight: 600, fontSize: 14, color: C.textMid, display: "block", marginBottom: 6 }}>
                    Age
                  </span>
                  <input value={formData.age} onChange={function(e) { setFormData({...formData, age: e.target.value}); }}
                    placeholder="4" type="number" min="0" max="12"
                    style={{
                      width: "100%", padding: "14px 16px", borderRadius: 14,
                      border: "2px solid " + C.border, fontSize: 16,
                      fontFamily: "'DM Sans'", background: C.cardBg,
                      outline: "none", boxSizing: "border-box",
                      transition: "border-color 0.2s, box-shadow 0.2s",
                    }}
                  />
                </label>
              </div>
            </FadeIn>

            {/* Story */}
            <FadeIn delay={0.15}>
              <label>
                <span style={{ fontFamily: "'DM Sans'", fontWeight: 600, fontSize: 14, color: C.textMid, display: "block", marginBottom: 6 }}>
                  Their story
                </span>
                <textarea value={formData.story} onChange={function(e) { setFormData({...formData, story: e.target.value}); }}
                  placeholder="What do they love? Favorite animals, games, foods, silly habits? Any adventures or funny moments? The AI uses every detail to write truly unique lyrics..."
                  rows={5}
                  style={{
                    width: "100%", padding: "14px 16px", borderRadius: 14,
                    border: "2px solid " + C.border, fontSize: 16,
                    fontFamily: "'DM Sans'", background: C.cardBg,
                    outline: "none", boxSizing: "border-box", resize: "vertical", lineHeight: 1.6,
                    transition: "border-color 0.2s, box-shadow 0.2s",
                  }}
                />
              </label>
            </FadeIn>

            {/* Genre */}
            <FadeIn delay={0.2}>
              <div>
                <span style={{ fontFamily: "'DM Sans'", fontWeight: 600, fontSize: 14, color: C.textMid, display: "block", marginBottom: 10 }}>
                  Pick a genre
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {GENRES.map(function(g) {
                    return <Pill key={g.id} emoji={g.emoji} label={g.label} color={g.color}
                      selected={formData.genre === g.id}
                      onClick={function() { setFormData({...formData, genre: g.id}); }} />;
                  })}
                </div>
              </div>
            </FadeIn>

            {/* Mood */}
            <FadeIn delay={0.25}>
              <div>
                <span style={{ fontFamily: "'DM Sans'", fontWeight: 600, fontSize: 14, color: C.textMid, display: "block", marginBottom: 10 }}>
                  Pick a mood
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {MOODS.map(function(m) {
                    return <Pill key={m.id} emoji={m.emoji} label={m.label} color={m.color}
                      selected={formData.mood === m.id}
                      onClick={function() { setFormData({...formData, mood: m.id}); }} />;
                  })}
                </div>
              </div>
            </FadeIn>

            {/* What you get */}
            <FadeIn delay={0.3}>
              <div style={{
                background: C.bgWarm, borderRadius: 18, padding: "22px 24px",
                border: "1.5px solid " + C.border,
              }}>
                <div style={{ fontFamily: "'DM Sans'", fontWeight: 700, fontSize: 14, color: C.textMid, marginBottom: 14, textTransform: "uppercase", letterSpacing: "1px" }}>
                  What you'll get
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 20px" }}>
                  {[
                    "Custom AI-written lyrics",
                    "2-minute original song",
                    "Their name sung throughout",
                    "Your chosen genre & mood",
                    "MP3 download",
                    "Delivered in ~60 seconds",
                  ].map(function(item, i) {
                    return (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "'DM Sans'", fontSize: 14, color: C.textMid }}>
                        <span style={{ color: C.teal, fontSize: 16, fontWeight: 700 }}>✓</span> {item}
                      </div>
                    );
                  })}
                </div>
              </div>
            </FadeIn>

            {/* Error */}
            {error && (
              <div style={{
                background: "#FFF0EC", border: "1.5px solid " + C.coral, borderRadius: 14,
                padding: "14px 18px", color: C.coral, fontFamily: "'DM Sans'", fontWeight: 600, fontSize: 14,
              }}>
                {error}
              </div>
            )}

            {/* Submit */}
            <FadeIn delay={0.35}>
              <button onClick={handleSubmit} disabled={loading}
                style={{
                  width: "100%", padding: "18px 32px",
                  background: loading ? C.textLight : C.coral,
                  color: "#fff", border: "none", borderRadius: 16,
                  fontSize: 18, fontFamily: "'Baloo 2'", fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: loading ? "none" : ("0 4px 20px " + C.coral + "40"),
                  transform: loading ? "none" : "translateY(0)",
                  position: "relative", overflow: "hidden",
                }}
                onMouseEnter={function(e) { if (!loading) e.target.style.transform = "translateY(-2px)"; e.target.style.boxShadow = "0 8px 30px " + C.coral + "50"; }}
                onMouseLeave={function(e) { e.target.style.transform = "translateY(0)"; e.target.style.boxShadow = "0 4px 20px " + C.coral + "40"; }}
              >
                {loading ? "Taking you to checkout..." : "Create song · $2.99"}
              </button>
              <p style={{ textAlign: "center", marginTop: 12, fontFamily: "'DM Sans'", fontSize: 13, color: C.textLight }}>
                Secure payment via Stripe · 100% money-back guarantee
              </p>
            </FadeIn>
          </div>
        </div>
      </div>
    );
  }

  /* ─── LANDING PAGE ─── */
  return (
    <div style={{ minHeight: "100vh", background: C.bg, position: "relative", overflow: "hidden" }}>
      <style>{globalCSS}</style>
      <GrainOverlay />

      {/* Nav */}
      <nav style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "20px 40px", position: "relative", zIndex: 10,
      }}>
        <div style={{ fontFamily: "'Baloo 2'", fontSize: 26, fontWeight: 800, color: C.navy, letterSpacing: "-0.5px" }}>
          <span style={{ color: C.coral }}>♪</span> LittleBops
        </div>
        <button onClick={function() { setPage("create"); }}
          style={{
            padding: "10px 24px", borderRadius: 100, border: "2px solid " + C.coral,
            background: "transparent", color: C.coral,
            fontFamily: "'DM Sans'", fontWeight: 700, fontSize: 14,
            cursor: "pointer", transition: "all 0.2s",
          }}
          onMouseEnter={function(e) { e.target.style.background = C.coral; e.target.style.color = "#fff"; }}
          onMouseLeave={function(e) { e.target.style.background = "transparent"; e.target.style.color = C.coral; }}
        >
          Create a song
        </button>
      </nav>

      {/* HERO */}
      <section style={{
        position: "relative", textAlign: "center",
        padding: "80px 24px 100px", overflow: "hidden",
      }}>
        <Blob color={C.coralLight} size={600} top="-250px" right="-200px" blur={120} opacity={0.5} />
        <Blob color={C.lavender} size={500} top="-100px" left="-250px" blur={120} opacity={0.35} />
        <Blob color={C.goldLight} size={350} bottom="-100px" right="20%" blur={100} opacity={0.4} />

        {/* Floating notes */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}>
          {["♪", "♫", "♬", "♩", "🎵"].map(function(note, i) {
            return (
              <span key={i} style={{
                position: "absolute",
                left: (15 + i * 18) + "%",
                top: (20 + (i * 13) % 50) + "%",
                fontSize: 20 + i * 6,
                opacity: 0.08 + i * 0.02,
                animation: (i % 2 === 0 ? "noteFloat1" : "noteFloat2") + " " + (8 + i * 2) + "s ease-in-out infinite",
                animationDelay: (i * 1.5) + "s",
                color: [C.coral, C.teal, C.gold, C.navyLight, C.coral][i],
              }}>{note}</span>
            );
          })}
        </div>

        <div style={{ position: "relative", zIndex: 1 }}>
          <FadeIn>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "8px 20px", borderRadius: 100,
              background: C.tealLight, color: C.teal,
              fontFamily: "'DM Sans'", fontWeight: 700, fontSize: 13, letterSpacing: "0.3px",
              marginBottom: 28,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.teal, display: "inline-block" }} />
              AI-powered personalized songs for kids
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <h1 style={{
              fontFamily: "'Baloo 2'", fontSize: "clamp(44px, 7vw, 78px)", fontWeight: 800,
              color: C.navy, lineHeight: 1.05, marginBottom: 20, letterSpacing: "-1px",
            }}>
              A song as unique<br />
              as <span style={{
                background: "linear-gradient(135deg, " + C.coral + ", " + C.gold + ")",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>your child</span>
            </h1>
          </FadeIn>

          <FadeIn delay={0.2}>
            <p style={{
              fontFamily: "'DM Sans'", fontSize: 19, color: C.textMid,
              lineHeight: 1.7, maxWidth: 520, margin: "0 auto 40px",
            }}>
              Share their name and story. Our AI writes original lyrics and
              composes a catchy, professional song in the genre you choose.
              Ready in under two minutes.
            </p>
          </FadeIn>

          <FadeIn delay={0.3}>
            <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", alignItems: "center" }}>
              <button onClick={function() { setPage("create"); }}
                style={{
                  padding: "18px 40px", borderRadius: 16, border: "none",
                  background: C.coral, color: "#fff",
                  fontFamily: "'Baloo 2'", fontWeight: 700, fontSize: 19,
                  cursor: "pointer", transition: "all 0.25s ease",
                  boxShadow: "0 4px 24px " + C.coral + "40",
                }}
                onMouseEnter={function(e) { e.target.style.transform = "translateY(-3px)"; e.target.style.boxShadow = "0 8px 36px " + C.coral + "55"; }}
                onMouseLeave={function(e) { e.target.style.transform = "translateY(0)"; e.target.style.boxShadow = "0 4px 24px " + C.coral + "40"; }}
              >
                Create their song — $2.99
              </button>
              <span style={{ fontFamily: "'DM Sans'", fontSize: 14, color: C.textLight }}>
                60 seconds · MP3 download
              </span>
            </div>
          </FadeIn>

          {/* Social proof */}
          <FadeIn delay={0.45}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 12, marginTop: 48,
              padding: "12px 24px", borderRadius: 100,
              background: C.cardBg, border: "1.5px solid " + C.border,
              boxShadow: "0 2px 16px rgba(27,19,64,0.04)",
            }}>
              <div style={{ display: "flex" }}>
                {["🧒", "👧", "🧑", "👦"].map(function(e, i) {
                  return <div key={i} style={{
                    width: 32, height: 32, borderRadius: "50%",
                    background: [C.coralLight, C.tealLight, C.goldLight, C.lavender][i],
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 16, marginLeft: i > 0 ? -8 : 0,
                    border: "2px solid " + C.cardBg,
                  }}>{e}</div>;
                })}
              </div>
              <div style={{ fontFamily: "'DM Sans'", fontSize: 14 }}>
                <span style={{ color: C.navy, fontWeight: 700 }}>4,200+ songs created</span>
                <span style={{ color: C.textLight }}> · </span>
                <span style={{ color: C.gold }}>★★★★★</span>
                <span style={{ color: C.textLight }}> 4.9</span>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* SAMPLE SONG */}
      <section style={{ padding: "60px 24px", position: "relative" }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <FadeIn>
            <div style={{
              background: "linear-gradient(145deg, " + C.navy + ", #2D2460)",
              borderRadius: 28, padding: "36px 32px", position: "relative", overflow: "hidden",
              boxShadow: "0 12px 48px rgba(27,19,64,0.2)",
            }}>
              {/* Decorative circles */}
              <div style={{ position: "absolute", top: -50, right: -50, width: 140, height: 140, borderRadius: "50%", background: C.coral, opacity: 0.08 }} />
              <div style={{ position: "absolute", bottom: -40, left: -40, width: 100, height: 100, borderRadius: "50%", background: C.teal, opacity: 0.08 }} />
              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 250, height: 250, borderRadius: "50%", background: C.gold, opacity: 0.03 }} />

              <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "6px 16px", borderRadius: 100,
                  background: "rgba(255,255,255,0.1)",
                  marginBottom: 16,
                }}>
                  <span style={{ fontFamily: "'DM Sans'", fontWeight: 600, fontSize: 12, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: "1.5px" }}>
                    🎧 Hear a sample
                  </span>
                </div>
                <h3 style={{ fontFamily: "'Baloo 2'", fontSize: "clamp(22px, 3vw, 28px)", fontWeight: 800, color: "#fff", marginBottom: 6 }}>
                  Charlotte's Song
                </h3>
                <p style={{ fontFamily: "'DM Sans'", fontSize: 14, color: "rgba(255,255,255,0.5)", marginBottom: 22 }}>
                  Pop · Energetic · Made for a 2-year-old who loves to dance
                </p>
                <audio controls src="https://n8xrycldzbb57mbo.public.blob.vercel-storage.com/d66f17b7aae644cfb7fae8240f48af20.mp3" style={{
                  width: "100%", maxWidth: 440, borderRadius: 12, height: 48, margin: "0 auto", display: "block",
                  filter: "invert(1) hue-rotate(180deg) brightness(0.85) contrast(1.2)",
                }}>
                  Your browser does not support audio.
                </audio>
                <p style={{ fontFamily: "'DM Sans'", fontSize: 13, color: "rgba(255,255,255,0.35)", marginTop: 16 }}>
                  Every song is 100% unique — personalized lyrics, real vocals, your child's name
                </p>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ padding: "80px 24px", position: "relative" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <FadeIn>
            <div style={{ textAlign: "center", marginBottom: 56 }}>
              <span style={{ fontFamily: "'DM Sans'", fontWeight: 700, fontSize: 13, color: C.coral, textTransform: "uppercase", letterSpacing: "2px" }}>
                How it works
              </span>
              <h2 style={{ fontFamily: "'Baloo 2'", fontSize: "clamp(32px, 4vw, 46px)", fontWeight: 800, color: C.navy, marginTop: 8 }}>
                Three steps to magic
              </h2>
            </div>
          </FadeIn>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24 }}>
            {[
              { num: "01", title: "Share their world", desc: "Tell us your child's name, age, interests, funny habits, and favorite adventures. Every detail makes the song more special.", icon: "📖", color: C.coral },
              { num: "02", title: "Choose the vibe", desc: "Pick from 6 genres and 5 moods. Want a silly hip-hop track about dinosaurs? A sweet lullaby about their stuffed bunny? You choose.", icon: "🎸", color: C.teal },
              { num: "03", title: "Listen & love", desc: "AI writes completely unique lyrics from your story, then composes and produces a full song. Download, share, and watch their face light up.", icon: "✨", color: C.gold },
            ].map(function(step, i) {
              return (
                <FadeIn key={i} delay={0.1 + i * 0.12}>
                  <div style={{
                    background: C.cardBg, borderRadius: 24, padding: "36px 28px",
                    border: "1.5px solid " + C.border,
                    boxShadow: "0 2px 20px rgba(27,19,64,0.03)",
                    transition: "transform 0.3s ease, box-shadow 0.3s ease",
                    cursor: "default", height: "100%",
                  }}
                    onMouseEnter={function(e) { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 8px 40px rgba(27,19,64,0.08)"; }}
                    onMouseLeave={function(e) { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 20px rgba(27,19,64,0.03)"; }}
                  >
                    <div style={{
                      width: 52, height: 52, borderRadius: 16,
                      background: step.color + "12", display: "flex",
                      alignItems: "center", justifyContent: "center",
                      fontSize: 26, marginBottom: 20,
                    }}>
                      {step.icon}
                    </div>
                    <div style={{ fontFamily: "'DM Sans'", fontSize: 12, fontWeight: 700, color: step.color, letterSpacing: "2px", marginBottom: 8, textTransform: "uppercase" }}>
                      Step {step.num}
                    </div>
                    <h3 style={{ fontFamily: "'Baloo 2'", fontSize: 22, fontWeight: 700, color: C.navy, marginBottom: 10 }}>
                      {step.title}
                    </h3>
                    <p style={{ fontFamily: "'DM Sans'", fontSize: 15, color: C.textMid, lineHeight: 1.65 }}>
                      {step.desc}
                    </p>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* GENRES */}
      <section style={{ padding: "60px 24px 80px", background: C.bgWarm, position: "relative", overflow: "hidden" }}>
        <Blob color={C.lavender} size={400} top="-100px" left="-100px" blur={100} opacity={0.3} />
        <div style={{ maxWidth: 800, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <FadeIn>
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <span style={{ fontFamily: "'DM Sans'", fontWeight: 700, fontSize: 13, color: C.teal, textTransform: "uppercase", letterSpacing: "2px" }}>
                Genres & Moods
              </span>
              <h2 style={{ fontFamily: "'Baloo 2'", fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 800, color: C.navy, marginTop: 8 }}>
                Their song, their style
              </h2>
              <p style={{ fontFamily: "'DM Sans'", fontSize: 16, color: C.textMid, marginTop: 8, maxWidth: 500, margin: "8px auto 0" }}>
                Mix and match any genre with any mood. That's 30 unique combinations.
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={0.15}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center", marginBottom: 20 }}>
              {GENRES.map(function(g) {
                return (
                  <div key={g.id} style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    padding: "12px 22px", borderRadius: 100,
                    background: C.cardBg, border: "1.5px solid " + C.border,
                    fontFamily: "'DM Sans'", fontWeight: 600, fontSize: 15, color: C.navy,
                    boxShadow: "0 2px 8px rgba(27,19,64,0.04)",
                  }}>
                    <span style={{ fontSize: 20 }}>{g.emoji}</span> {g.label}
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
              {MOODS.map(function(m) {
                return (
                  <div key={m.id} style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "10px 18px", borderRadius: 100,
                    background: m.color + "10", border: "1.5px solid " + m.color + "30",
                    fontFamily: "'DM Sans'", fontWeight: 600, fontSize: 14, color: m.color,
                  }}>
                    <span style={{ fontSize: 16 }}>{m.emoji}</span> {m.label}
                  </div>
                );
              })}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{ padding: "80px 24px", position: "relative" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <FadeIn>
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <span style={{ fontFamily: "'DM Sans'", fontWeight: 700, fontSize: 13, color: C.gold, textTransform: "uppercase", letterSpacing: "2px" }}>
                Reviews
              </span>
              <h2 style={{ fontFamily: "'Baloo 2'", fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 800, color: C.navy, marginTop: 8 }}>
                Parents can't stop sharing
              </h2>
            </div>
          </FadeIn>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
            {[
              { name: "Sarah M.", role: "Mom of Lily, age 3", text: "She listens to 'Lily's Song' every single morning before school. She knows all the words and dances like crazy. Worth every penny.", stars: 5 },
              { name: "David K.", role: "Dad of James, age 5", text: "We played it at his birthday party. When James heard his name, his jaw dropped. Then all the kids started dancing. Grandma was in tears.", stars: 5 },
              { name: "Priya L.", role: "Mom of Arjun, age 4", text: "The lyrics mentioned his stuffed elephant Ganesha BY NAME. I have no idea how AI did that from what I wrote, but it was pure magic.", stars: 5 },
            ].map(function(t, i) {
              return (
                <FadeIn key={i} delay={0.1 + i * 0.1}>
                  <div style={{
                    background: C.cardBg, borderRadius: 22, padding: "28px 24px",
                    border: "1.5px solid " + C.border,
                    boxShadow: "0 2px 20px rgba(27,19,64,0.03)",
                    height: "100%",
                  }}>
                    <div style={{ color: C.gold, fontSize: 16, marginBottom: 14, letterSpacing: 2 }}>
                      {"★".repeat(t.stars)}
                    </div>
                    <p style={{
                      fontFamily: "'DM Sans'", fontSize: 15, color: C.navy,
                      lineHeight: 1.7, marginBottom: 18, fontStyle: "italic",
                    }}>
                      "{t.text}"
                    </p>
                    <div>
                      <div style={{ fontFamily: "'Baloo 2'", fontWeight: 700, fontSize: 15, color: C.navy }}>{t.name}</div>
                      <div style={{ fontFamily: "'DM Sans'", fontSize: 13, color: C.textLight }}>{t.role}</div>
                    </div>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{
        padding: "80px 24px", position: "relative", overflow: "hidden",
        background: C.bgDeep,
      }}>
        <Blob color={C.coral} size={500} top="-200px" right="-150px" blur={150} opacity={0.15} />
        <Blob color={C.teal} size={400} bottom="-150px" left="-100px" blur={150} opacity={0.1} />

        <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1 }}>
          <FadeIn>
            <h2 style={{ fontFamily: "'Baloo 2'", fontSize: "clamp(32px, 5vw, 50px)", fontWeight: 800, color: "#fff", lineHeight: 1.1, marginBottom: 16 }}>
              Every child deserves<br />a song of their own
            </h2>
            <p style={{ fontFamily: "'DM Sans'", fontSize: 17, color: "rgba(255,255,255,0.65)", lineHeight: 1.7, marginBottom: 36 }}>
              It takes 60 seconds to create and they'll want to listen forever.
              Six genres. Five moods. Infinite memories.
            </p>
            <button onClick={function() { setPage("create"); }}
              style={{
                padding: "18px 44px", borderRadius: 16, border: "none",
                background: C.coral, color: "#fff",
                fontFamily: "'Baloo 2'", fontWeight: 700, fontSize: 19,
                cursor: "pointer", transition: "all 0.25s ease",
                boxShadow: "0 4px 30px " + C.coral + "50",
              }}
              onMouseEnter={function(e) { e.target.style.transform = "translateY(-3px)"; e.target.style.boxShadow = "0 8px 40px " + C.coral + "60"; }}
              onMouseLeave={function(e) { e.target.style.transform = "translateY(0)"; e.target.style.boxShadow = "0 4px 30px " + C.coral + "50"; }}
            >
              Create their song — $2.99
            </button>
          </FadeIn>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{
        padding: "32px 40px", display: "flex", justifyContent: "space-between",
        alignItems: "center", flexWrap: "wrap", gap: 16,
        borderTop: "1px solid " + C.border,
      }}>
        <div style={{ fontFamily: "'Baloo 2'", fontSize: 20, fontWeight: 800, color: C.navy }}>
          <span style={{ color: C.coral }}>♪</span> LittleBops
        </div>
        <div style={{ fontFamily: "'DM Sans'", fontSize: 13, color: C.textLight }}>
          © 2026 LittleBops · Making every kid a star
        </div>
      </footer>
    </div>
  );
}
