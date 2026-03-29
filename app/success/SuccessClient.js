"use client";

import { useEffect, useState } from "react";

var C = {
  bg: "#FFFBF5", bgWarm: "#FFF5EB", coral: "#FF6B4A", navy: "#1B1340",
  teal: "#2ECDA7", tealLight: "#E8FBF5", gold: "#FFBE3D",
  text: "#1B1340", textMid: "#4A4270", textLight: "#8B83A8",
  cardBg: "#FFFFFF", border: "#EDE8E3", lavender: "#E8E0FF",
  coralLight: "#FFF0EC",
};

export default function SuccessPage() {
  var [order, setOrder] = useState(null);
  var [status, setStatus] = useState("loading");
  var [elapsed, setElapsed] = useState(0);

  useEffect(function() {
    var params = new URLSearchParams(window.location.search);
    var sessionId = params.get("session_id");
    if (!sessionId) { setStatus("error"); return; }

    var failCount = 0;
    var timer = setInterval(function() { setElapsed(function(e) { return e + 1; }); }, 1000);

    var interval = setInterval(function() {
      fetch("/api/check-status?session_id=" + sessionId)
        .then(function(res) { return res.json(); })
        .then(function(data) {
          failCount = 0;
          if (data.status === "complete") {
            setOrder(data); setStatus("complete");
            clearInterval(interval); clearInterval(timer);
          } else if (data.status === "failed") {
            setStatus("failed");
            clearInterval(interval); clearInterval(timer);
          }
        })
        .catch(function(err) {
          failCount++;
          console.error("Status check failed:", err);
          if (failCount >= 10) {
            setStatus("failed");
            clearInterval(interval); clearInterval(timer);
          }
        });
    }, 5000);

    // Timeout after 5 minutes — something is seriously wrong
    var timeout = setTimeout(function() {
      setStatus("failed");
      clearInterval(interval); clearInterval(timer);
    }, 300000);

    return function() { clearInterval(interval); clearInterval(timer); clearTimeout(timeout); };
  }, []);

  var css = `
    @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;500;600;700;800&family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    ::selection { background: ${C.coral}30; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    @keyframes pulse { 0%,100% { opacity: 0.3; } 50% { opacity: 1; } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes scaleIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
    audio::-webkit-media-controls-panel { background: rgba(255,255,255,0.1); }
  `;

  // LOADING
  if (status === "loading" || status === "processing") {
    var steps = [
      { label: "Writing personalized lyrics", done: elapsed > 3 },
      { label: "Composing melody & arrangement", done: elapsed > 15 },
      { label: "Generating vocals", done: elapsed > 30 },
      { label: "Mastering & polishing", done: elapsed > 45 },
    ];

    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{css}</style>
        <div style={{ textAlign: "center", padding: "40px 24px", maxWidth: 480 }}>
          {/* Animated ring */}
          <div style={{ position: "relative", width: 100, height: 100, margin: "0 auto 32px" }}>
            <div style={{
              position: "absolute", inset: 0, borderRadius: "50%",
              border: "3px solid " + C.border,
            }} />
            <div style={{
              position: "absolute", inset: 0, borderRadius: "50%",
              border: "3px solid transparent", borderTopColor: C.coral,
              animation: "spin 1s linear infinite",
            }} />
            <div style={{
              position: "absolute", inset: 0, display: "flex",
              alignItems: "center", justifyContent: "center",
              fontSize: 36,
            }}>
              🎵
            </div>
          </div>

          <h1 style={{ fontFamily: "'Baloo 2'", fontSize: 32, fontWeight: 800, color: C.navy, marginBottom: 8 }}>
            Creating your song
          </h1>
          <p style={{ fontFamily: "'DM Sans'", fontSize: 16, color: C.textMid, marginBottom: 36 }}>
            This usually takes about 60 seconds
          </p>

          {/* Progress steps */}
          <div style={{
            background: C.cardBg, borderRadius: 20, padding: "24px 28px",
            border: "1.5px solid " + C.border, textAlign: "left",
            boxShadow: "0 2px 20px rgba(27,19,64,0.03)",
          }}>
            {steps.map(function(step, i) {
              var active = !step.done && (i === 0 || steps[i - 1].done);
              return (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "12px 0",
                  borderBottom: i < steps.length - 1 ? ("1px solid " + C.border) : "none",
                  opacity: step.done ? 1 : active ? 0.9 : 0.35,
                  transition: "opacity 0.5s ease",
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 14,
                    background: step.done ? C.tealLight : active ? C.coralLight : C.bgWarm,
                    color: step.done ? C.teal : active ? C.coral : C.textLight,
                    fontWeight: 700,
                  }}>
                    {step.done ? "✓" : active ? (
                      <span style={{ animation: "pulse 1.5s ease-in-out infinite" }}>●</span>
                    ) : (i + 1)}
                  </div>
                  <span style={{ fontFamily: "'DM Sans'", fontSize: 15, fontWeight: step.done || active ? 600 : 400, color: step.done ? C.navy : active ? C.navy : C.textLight }}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>

          <p style={{ fontFamily: "'DM Sans'", fontSize: 13, color: C.textLight, marginTop: 20 }}>
            {elapsed}s elapsed
          </p>
        </div>
      </div>
    );
  }

  // ERROR
  if (status === "error" || status === "failed") {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{css}</style>
        <div style={{ textAlign: "center", padding: "40px 24px", maxWidth: 440 }}>
          <div style={{ fontSize: 56, marginBottom: 20 }}>😔</div>
          <h1 style={{ fontFamily: "'Baloo 2'", fontSize: 28, fontWeight: 800, color: C.navy, marginBottom: 10 }}>
            {status === "failed" ? "Something went wrong" : "Order not found"}
          </h1>
          <p style={{ fontFamily: "'DM Sans'", fontSize: 16, color: C.textMid, lineHeight: 1.6, marginBottom: 28 }}>
            {status === "failed"
              ? "We hit a snag creating the song. Our team has been notified and you'll receive a full refund."
              : "We couldn't find this order. Please check your email for the song link."}
          </p>
          <a href="/" style={{
            fontFamily: "'DM Sans'", fontWeight: 700, fontSize: 15, color: C.coral, textDecoration: "none",
          }}>← Back to LittleBops</a>
        </div>
      </div>
    );
  }

  // SUCCESS
  return (
    <div style={{ minHeight: "100vh", background: C.bg }}>
      <style>{css}</style>

      {/* Nav */}
      <nav style={{ padding: "20px 40px", display: "flex", alignItems: "center" }}>
        <a href="/" style={{ fontFamily: "'Baloo 2'", fontSize: 24, fontWeight: 800, color: C.navy, textDecoration: "none" }}>
          <span style={{ color: C.coral }}>♪</span> LittleBops
        </a>
      </nav>

      <div style={{ maxWidth: 600, margin: "0 auto", padding: "20px 24px 80px" }}>
        {/* Celebration */}
        <div style={{ textAlign: "center", marginBottom: 36, animation: "slideUp 0.6s ease-out" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "8px 20px", borderRadius: 100,
            background: C.tealLight, color: C.teal,
            fontFamily: "'DM Sans'", fontWeight: 700, fontSize: 13,
            marginBottom: 20,
          }}>
            ✓ Song created successfully
          </div>
          <h1 style={{ fontFamily: "'Baloo 2'", fontSize: "clamp(32px, 5vw, 44px)", fontWeight: 800, color: C.navy, lineHeight: 1.1, marginBottom: 8 }}>
            {order.childName}'s song is ready
          </h1>
          <p style={{ fontFamily: "'DM Sans'", fontSize: 17, color: C.textMid }}>
            A one-of-a-kind song, made with love
          </p>
        </div>

        {/* Player */}
        <div style={{
          background: "linear-gradient(145deg, " + C.navy + ", #2D2460)",
          borderRadius: 24, padding: "36px 32px", marginBottom: 20,
          boxShadow: "0 12px 48px rgba(27,19,64,0.2)",
          animation: "scaleIn 0.5s ease-out 0.2s both",
          position: "relative", overflow: "hidden",
        }}>
          {/* Decorative circles */}
          <div style={{ position: "absolute", top: -40, right: -40, width: 120, height: 120, borderRadius: "50%", background: C.coral, opacity: 0.1 }} />
          <div style={{ position: "absolute", bottom: -30, left: -30, width: 80, height: 80, borderRadius: "50%", background: C.teal, opacity: 0.1 }} />

          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ fontFamily: "'DM Sans'", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 8 }}>
              Now playing
            </div>
            <div style={{ fontFamily: "'Baloo 2'", fontSize: 24, fontWeight: 700, color: "#fff", marginBottom: 20 }}>
              {order.childName}'s Song
            </div>
            <audio controls src={order.songUrl} style={{
              width: "100%", borderRadius: 12, height: 48,
              filter: "invert(1) hue-rotate(180deg) brightness(0.85) contrast(1.2)",
            }}>
              Your browser does not support audio.
            </audio>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, marginBottom: 32, animation: "slideUp 0.5s ease-out 0.4s both" }}>
          <a href={order.songUrl} download={order.childName + "s-Song-LittleBops.mp3"}
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "16px 20px", borderRadius: 14, textDecoration: "none",
              background: C.coral, color: "#fff",
              fontFamily: "'DM Sans'", fontWeight: 700, fontSize: 15,
              transition: "all 0.2s",
              boxShadow: "0 2px 16px " + C.coral + "30",
            }}
          >
            ↓ Download MP3
          </a>
          <button onClick={function() {
            var shareText = "Listen to " + order.childName + "'s custom song on LittleBops! " + window.location.href;
            navigator.clipboard.writeText(shareText);
            alert("Link copied! Share it with family and friends.");
          }}
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "16px 20px", borderRadius: 14,
              background: C.cardBg, color: C.navy,
              border: "1.5px solid " + C.border,
              fontFamily: "'DM Sans'", fontWeight: 700, fontSize: 15,
              cursor: "pointer", transition: "all 0.2s",
            }}
          >
            Share link
          </button>
        </div>

        {/* Lyrics */}
        <div style={{
          background: C.cardBg, borderRadius: 22, padding: "28px 28px",
          border: "1.5px solid " + C.border,
          boxShadow: "0 2px 20px rgba(27,19,64,0.03)",
          animation: "slideUp 0.5s ease-out 0.6s both",
        }}>
          <div style={{
            fontFamily: "'DM Sans'", fontWeight: 700, fontSize: 13,
            color: C.textLight, textTransform: "uppercase", letterSpacing: "1.5px",
            marginBottom: 18,
          }}>
            Lyrics
          </div>
          <pre style={{
            fontFamily: "'DM Sans'", fontSize: 15, color: C.navy,
            lineHeight: 1.85, whiteSpace: "pre-wrap", margin: 0,
          }}>
            {order.lyrics}
          </pre>
        </div>

        {/* Create another */}
        <div style={{ textAlign: "center", marginTop: 40, animation: "slideUp 0.5s ease-out 0.8s both" }}>
          <p style={{ fontFamily: "'DM Sans'", fontSize: 15, color: C.textLight, marginBottom: 16 }}>
            Want to make another song?
          </p>
          <a href="/"
            style={{
              display: "inline-block", padding: "14px 32px", borderRadius: 14,
              background: C.bgWarm, color: C.coral, textDecoration: "none",
              fontFamily: "'DM Sans'", fontWeight: 700, fontSize: 15,
              border: "1.5px solid " + C.border, transition: "all 0.2s",
            }}
          >
            Create another song →
          </a>
        </div>
      </div>
    </div>
  );
}
