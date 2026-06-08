import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function prettyDate(value) {
  if (!value) return "Today";
  const date = new Date(`${value}T12:00:00`);
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

const destinationSuggestions = [
  "Kyoto, Japan",
  "Oaxaca, Mexico",
  "Big Island, Hawaii",
  "Kauai, Hawaii",
  "San Francisco, CA",
  "New York City",
  "Paris, France",
  "Amalfi Coast, Italy",
  "Marrakech, Morocco",
  "Patagonia, Argentina",
  "Tokyo, Japan",
  "Barcelona, Spain",
  "Ubud, Bali",
  "Mexico City, Mexico"
];

const moodVibes = [
  {
    id: "adventurous",
    title: "Adventurous",
    tag: "Push the edge",
    signal: "hikes, movement, active experiences, discovery",
    icon: "△",
    img: "https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=1400"
  },
  {
    id: "slow-easy",
    title: "Slow & easy",
    tag: "Breathe it in",
    signal: "few stops, long pauses, gentle transitions",
    icon: "〰",
    img: "https://images.pexels.com/photos/2868242/pexels-photo-2868242.jpeg?auto=compress&cs=tinysrgb&w=1400"
  },
  {
    id: "cultural",
    title: "Cultural",
    tag: "Art, history, depth",
    signal: "museums, architecture, rituals, history, meaningful places",
    icon: "▱",
    img: "https://images.pexels.com/photos/1510595/pexels-photo-1510595.jpeg?auto=compress&cs=tinysrgb&w=1400"
  },
  {
    id: "culinary",
    title: "Culinary",
    tag: "Eat like a local",
    signal: "food-led planning, neighborhood restaurants, local specialties",
    icon: "╯",
    img: "https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg?auto=compress&cs=tinysrgb&w=1400"
  },
  {
    id: "nature",
    title: "Into nature",
    tag: "Wild, open, free",
    signal: "nature, viewpoints, walks, parks, scenic routes",
    icon: "△",
    img: "https://images.pexels.com/photos/3408354/pexels-photo-3408354.jpeg?auto=compress&cs=tinysrgb&w=1400"
  },
  {
    id: "social",
    title: "Social",
    tag: "Meet, mix, connect",
    signal: "lively areas, events, markets, group-friendly experiences",
    icon: "♧",
    img: "https://images.pexels.com/photos/378570/pexels-photo-378570.jpeg?auto=compress&cs=tinysrgb&w=1400"
  },
  {
    id: "active",
    title: "Active",
    tag: "Move and explore",
    signal: "walking, biking, hikes, lots of movement, active pacing",
    icon: "⌁",
    img: "https://images.pexels.com/photos/1578662/pexels-photo-1578662.jpeg?auto=compress&cs=tinysrgb&w=1400"
  },
  {
    id: "open",
    title: "Open to anything",
    tag: "Let Gemini decide",
    signal: "surprise me, balanced plan, flexible recommendations",
    icon: "⌁",
    img: "https://images.pexels.com/photos/2070033/pexels-photo-2070033.jpeg?auto=compress&cs=tinysrgb&w=1400"
  },
  {
    id: "romantic",
    title: "Romantic",
    tag: "Intentional, slow",
    signal: "golden hour, lanterns, views, beautiful dinner, partner-friendly",
    icon: "♡",
    img: "https://images.pexels.com/photos/1024960/pexels-photo-1024960.jpeg?auto=compress&cs=tinysrgb&w=1400"
  }
];

function App() {
  const [user, setUser] = useState(null);
  const [step, setStep] = useState("login");
  const [destination, setDestination] = useState("Kyoto, Japan");
  const [date, setDate] = useState(getToday());
  const [diet, setDiet] = useState("Vegetarian");
  const [planFor, setPlanFor] = useState("Date");
  const [selectedMoods, setSelectedMoods] = useState(["active", "romantic"]);
  const [loadingLine, setLoadingLine] = useState(0);
  const [itinerary, setItinerary] = useState(null);
  const [googleReady, setGoogleReady] = useState(false);
  const [error, setError] = useState("");
  const shellRef = useRef(null);

  useEffect(() => {
    let rafId;
    const moveGlow = (event) => {
      if (!shellRef.current) return;
      rafId = requestAnimationFrame(() => {
        shellRef.current.style.setProperty("--mx", `${event.clientX}px`);
        shellRef.current.style.setProperty("--my", `${event.clientY}px`);
      });
    };
    window.addEventListener("pointermove", moveGlow);
    return () => {
      window.removeEventListener("pointermove", moveGlow);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || step !== "login") return;

    let attempts = 0;
    let cancelled = false;

    const loadGoogleButton = () => {
      const buttonContainer = document.getElementById("googleSignIn");

      if (cancelled || !buttonContainer) {
        attempts += 1;
        if (!cancelled && attempts < 30) setTimeout(loadGoogleButton, 200);
        return;
      }

      if (!window.google?.accounts?.id) {
        attempts += 1;
        if (attempts < 40) setTimeout(loadGoogleButton, 200);
        return;
      }

      setGoogleReady(true);

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => {
          const payload = JSON.parse(atob(response.credential.split(".")[1]));
          setUser({
            name: payload.name,
            email: payload.email,
            picture: payload.picture
          });
          setStep("setup");
        }
      });

      buttonContainer.innerHTML = "";
      window.google.accounts.id.renderButton(buttonContainer, {
        theme: "filled_black",
        size: "large",
        shape: "pill",
        text: "continue_with",
        width: 320
      });
    };

    loadGoogleButton();
    return () => {
      cancelled = true;
    };
  }, [step]);

  const selectedMoodObjects = selectedMoods
    .map((id) => moodVibes.find((vibe) => vibe.id === id))
    .filter(Boolean);

  const loadingItems = useMemo(
    () => [
      user?.name ? `${user.name}'s lightweight profile` : "Quick feeler profile",
      "Today’s mood signals",
      "Dietary preferences",
      "Destination context",
      "Google Places candidates",
      "Real place photos and ratings",
      "Gemini itinerary generation"
    ],
    [user]
  );

  function toggleMood(id) {
    setSelectedMoods((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (current.length >= 3) return [...current.slice(1), id];
      return [...current, id];
    });
  }

  async function generatePlan() {
    setStep("loading");
    setError("");
    setLoadingLine(0);
    setItinerary(null);

    const interval = setInterval(() => {
      setLoadingLine((v) => Math.min(v + 1, loadingItems.length - 2));
    }, 650);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user,
          destination,
          dates: prettyDate(date),
          date,
          diet,
          travelWith: planFor,
          selectedMoods: selectedMoodObjects,
          instruction:
            "Create a real, specific, mood-first day plan. Infer longer-term travel style lightly from Google profile if available, but do not ask the user to select it. Use selectedMoods as today's short-term intent. Return concrete places. The server will enrich stops with Google Places photos, ratings, addresses, and map links."
        })
      });

      const data = await res.json();

      if (!res.ok || data?.error) {
        throw new Error(data?.error || "Gemini API route failed");
      }

      setLoadingLine(loadingItems.length - 1);
      setItinerary(data);
      setTimeout(() => setStep("result"), 450);
    } catch (err) {
      console.error(err);
      setError(err.message || "Gemini could not generate the plan.");
      setStep("apiError");
    } finally {
      clearInterval(interval);
    }
  }

  return (
    <div className="app-shell" ref={shellRef}>
      <style>{css}</style>
      <Starfield />
      <div className="aurora a1" />
      <div className="aurora a2" />
      <div className="aurora a3" />

      <nav className="navbar">
        <button className="brand" onClick={() => setStep("login")}>
          <span className="brand-logo">✦</span>
          <span>Travel DNA</span>
        </button>

        <div className="nav-steps">
          {["Setup", "Mood", "Result"].map((label, i) => {
            const order = ["setup", "mood", "result"];
            const active = step === order[i];
            const done = order.indexOf(step) > i || step === "loading";
            return (
              <span className={active ? "active" : done ? "done" : ""} key={label}>
                <i /> {label}
              </span>
            );
          })}
        </div>

        {step !== "login" && (
          <button className="btn-outline" onClick={() => setStep("setup")}>
            Start over
          </button>
        )}
      </nav>

      {step === "login" && (
        <main className="screen hero-screen on">
          <section className="hero-inner">
            <div className="hero-left">
              <div className="hero-pill">
                <div className="pulse" />
                <span>Powered by Gemini</span>
              </div>

              <h1>
                Plan anything built for <span>right now.</span>
              </h1>
              <p>
                A single evening. A full day. A whole trip. Every moment shaped
                around who you want to be today — not just where you're going.
              </p>

              <div className="hero-cta">
                <div className="google-wrap">
                  <div id="googleSignIn" />
                  {!googleReady && GOOGLE_CLIENT_ID && (
                    <div className="google-loading">Loading Google sign in...</div>
                  )}
                </div>
                <button className="btn-accent" onClick={() => setStep("setup")}>
                  Continue without sign in
                </button>
              </div>
            </div>

            <div className="hero-cards">
              {moodVibes.slice(6, 9).map((vibe, i) => (
                <div className={`hcard hcard-${i + 1}`} key={vibe.id}>
                  <img src={vibe.img} alt="" />
                  <div>{vibe.title}</div>
                </div>
              ))}
              <div className="hero-stat hs1">
                <b>DNA</b>
                <span>data + mood</span>
              </div>
              <div className="hero-stat hs2">
                <b className="gem">AI</b>
                <span>real places</span>
              </div>
            </div>
          </section>
        </main>
      )}

      {step === "setup" && (
        <main className="screen setup-screen on">
          <section className="setup-header">
            <p className="label">Step 1 / 2</p>
            <h2>Set the plan.</h2>
            <p>
              We’ll infer your longer-term travel style from your lightweight
              profile later. For now, tell us where, when, and what constraints matter.
            </p>
          </section>

          <section className="form-shell glass-panel">
            <label>
              <span>Destination</span>
              <input
                list="destinations"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="City, neighborhood, or place"
              />
              <datalist id="destinations">
                {destinationSuggestions.map((item) => (
                  <option value={item} key={item} />
                ))}
              </datalist>
            </label>

            <div className="suggestions">
              {destinationSuggestions.slice(0, 6).map((item) => (
                <button
                  type="button"
                  key={item}
                  className={destination === item ? "suggestion active" : "suggestion"}
                  onClick={() => setDestination(item)}
                >
                  {item}
                </button>
              ))}
            </div>

            <label>
              <span>When</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </label>

            <Select
              label="Dietary preference"
              value={diet}
              setValue={setDiet}
              options={["Vegetarian", "Vegan", "No restrictions", "Gluten-free"]}
            />

            <Select
              label="Going with"
              value={planFor}
              setValue={setPlanFor}
              options={["Solo", "Date", "Friends", "Family", "Workday"]}
            />

            <div className="pi-card">
              <div className="spark">✦</div>
              <p className="label">Personal Intelligence Preview</p>
              <h3>We don't have full access to your Google Personal Intelligence yet.</h3>
              <p>
                We’re working on it. Soon, we’ll skip these questions with your
                Google data. For now, give us a quick feeler.
              </p>
              {user ? (
                <div className="profile-chip">
                  <img src={user.picture} alt="" />
                  Signed in as {user.name}
                </div>
              ) : (
                <div className="profile-chip">Quick feeler mode</div>
              )}
            </div>

            <button className="btn-accent primary-wide" onClick={() => setStep("mood")}>
              Choose today’s mood
            </button>
          </section>
        </main>
      )}

      {step === "mood" && (
        <main className="screen mood-screen on">
          <section className="mood-header">
            <p className="label">Step 2 / 2 · Choose up to 3</p>
            <h2>
              What’s your <span className="gem">mood today?</span>
            </h2>
            <p>
              This one input reshapes your entire day. It’s the variable Gemini
              can’t infer from data alone.
            </p>
          </section>

          <section className="mood-grid image-mode">
            {moodVibes.map((vibe, index) => (
              <button
                type="button"
                key={vibe.id}
                className={selectedMoods.includes(vibe.id) ? `mood-tile image-tile tile-${index + 1} active` : `mood-tile image-tile tile-${index + 1}`}
                onClick={() => toggleMood(vibe.id)}
              >
                <img src={vibe.img} alt={vibe.title} loading="lazy" />
                <span className="image-sheen" />
                <span className="mood-check">✓</span>
                <span className="mood-number">{String(index + 1).padStart(2, "0")}</span>
                <span className="mood-copy">
                  <strong>{vibe.title}</strong>
                  <p>{vibe.tag}</p>
                </span>
              </button>
            ))}
          </section>

          <section className="bottom-cta glass-panel">
            <div>
              <p className="label">Selected mood</p>
              <div className="selected-chips">
                {selectedMoodObjects.map((v) => <span key={v.id}>{v.title}</span>)}
              </div>
            </div>
            <button className="btn-accent" onClick={generatePlan}>
              Build with Gemini ✦
            </button>
          </section>
        </main>
      )}

      {step === "loading" && (
        <main className="screen loading-screen on">
          <section className="loader-layout">
            <div className="constellation" aria-hidden="true">
              <svg viewBox="0 0 420 300">
                <defs>
                  <linearGradient id="googleLine" x1="0" x2="1">
                    <stop offset="0%" stopColor="#4285F4" />
                    <stop offset="35%" stopColor="#34A853" />
                    <stop offset="65%" stopColor="#FBBC04" />
                    <stop offset="100%" stopColor="#EA4335" />
                  </linearGradient>
                </defs>
                <polyline points="70,205 135,130 210,165 270,80 340,120" />
                <circle className="blue" cx="70" cy="205" r="8" />
                <circle className="green" cx="135" cy="130" r="8" />
                <circle className="yellow" cx="210" cy="165" r="8" />
                <circle className="blue" cx="270" cy="80" r="8" />
                <circle className="red" cx="340" cy="120" r="8" />
              </svg>
            </div>

            <div className="loading-copy">
              <p className="label">Gemini is thinking</p>
              <h2>
                Decoding your <span className="gem">Travel DNA</span>
              </h2>
            </div>

            <div className="load-glass">
              {loadingItems.map((item, i) => (
                <div className={i <= loadingLine ? "load-row on" : "load-row"} key={item}>
                  <b />
                  <span>{item}</span>
                  <em>{i <= loadingLine ? "Done" : "Waiting"}</em>
                </div>
              ))}
            </div>
          </section>
        </main>
      )}

      {step === "apiError" && (
        <main className="screen loading-screen on">
          <div className="api-error-card">
            <p className="label">Gemini API needs attention</p>
            <h2>Couldn’t generate the live itinerary.</h2>
            <p>{error}</p>
            <div className="error-actions">
              <button className="btn-outline" onClick={() => setStep("setup")}>
                Edit setup
              </button>
              <button className="btn-accent" onClick={generatePlan}>
                Try Gemini again ✦
              </button>
            </div>
          </div>
        </main>
      )}

      {step === "result" && (
        <main className="result-screen on">
          <section className="res-hero">
            <img src={itinerary?.heroImageUrl || selectedMoodObjects[0]?.img || moodVibes[0].img} alt="" />
            <div className="res-gradient" />
            <div className="res-content">
              <span className="res-tag">Travel DNA</span>
              <h2>{itinerary?.destination || destination}</h2>
              <p>{itinerary?.dates || prettyDate(date)}</p>
              <div className="res-dna-strip">
                {selectedMoodObjects.map((mood) => (
                  <span key={mood.id}>Today: {mood.title}</span>
                ))}
              </div>
              {itinerary?.summary && <p className="res-summary">{itinerary.summary}</p>}
            </div>
          </section>

          <section className="action-bar">
            <button className="btn-outline" onClick={() => setStep("setup")}>
              Edit setup
            </button>
            <button className="btn-outline" onClick={() => setStep("mood")}>
              Change mood
            </button>
            <button className="btn-accent" onClick={generatePlan}>
              Regenerate ✦
            </button>
          </section>

          <section className="timeline">
            <p className="label">Today’s flow</p>
            {(itinerary?.stops || []).map((stop, i) => (
              <article className="stop" key={`${stop.name}-${i}`}>
                <div className={i === 0 ? "s-pin featured" : "s-pin"}>⌖</div>
                <div className="s-body">
                  <p className="s-cat">{stop.category}</p>
                  <h3>
                    {stop.time} <span>{stop.period}</span>
                  </h3>
                  <h4>{stop.name}</h4>
                  <p>{stop.description}</p>

                  <div className="s-photo">
                    <img
                      src={stop.imageUrl || stop.photoUrl || selectedMoodObjects[i % Math.max(selectedMoodObjects.length, 1)]?.img || moodVibes[i % moodVibes.length].img}
                      alt={stop.name}
                      loading="lazy"
                    />
                    <div className="s-photo-ov" />
                    <span>{stop.photoQuery || stop.name}</span>
                  </div>

                  {(stop.rating || stop.address || stop.mapsUrl || stop.openNow !== undefined) && (
                    <div className="place-meta">
                      {stop.rating && <span>★ {stop.rating}</span>}
                      {stop.openNow !== undefined && (
                        <span>{stop.openNow ? "Open now" : "Hours vary"}</span>
                      )}
                      {stop.address && <span>{stop.address}</span>}
                      {stop.mapsUrl && (
                        <a href={stop.mapsUrl} target="_blank" rel="noreferrer">
                          Open in Google Maps
                        </a>
                      )}
                    </div>
                  )}

                  <small>{stop.routeFromPrevious}</small>
                </div>
              </article>
            ))}
          </section>
        </main>
      )}
    </div>
  );
}

function Starfield() {
  const stars = useMemo(
    () =>
      Array.from({ length: 70 }).map((_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        width: `${Math.random() * 1.8 + 0.5}px`,
        height: `${Math.random() * 1.8 + 0.5}px`,
        animationDelay: `${Math.random() * 5}s`,
        animationDuration: `${Math.random() * 4 + 2}s`
      })),
    []
  );

  return (
    <div className="stars">
      {stars.map((star) => (
        <i key={star.id} style={star} />
      ))}
    </div>
  );
}

function Select({ label, value, setValue, options }) {
  return (
    <div className="field-block">
      <p className="field-label">{label}</p>
      <div className="chips">
        {options.map((option) => (
          <button
            type="button"
            className={value === option ? "chip active" : "chip"}
            onClick={() => setValue(option)}
            key={option}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

const css = `
@import url('https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700;800&display=swap');

html,
body,
#root {
  width: 100%;
  min-height: 100%;
  max-width: none !important;
  margin: 0 !important;
  padding: 0 !important;
  text-align: left !important;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

:root {
  --bg: #080a0e;
  --s1: #0d1117;
  --s2: #131920;
  --s3: #1a2230;
  --bdr: rgba(255, 255, 255, 0.08);
  --bdr2: rgba(255, 255, 255, 0.14);
  --ink: #f0f2f5;
  --ink2: #9aa4b2;
  --ink3: #606a78;
  --blue: #4285f4;
  --green: #34a853;
  --yellow: #fbbc04;
  --red: #ea4335;
  --accent: #00d4aa;
  --accent2: rgba(0, 212, 170, 0.12);
  --ease: cubic-bezier(.16, 1, .3, 1);
  --spring: cubic-bezier(.34, 1.56, .64, 1);
}

body {
  font-family: 'Google Sans', Inter, system-ui, sans-serif;
  background:
    radial-gradient(circle at 18% 8%, rgba(66,133,244,.10), transparent 30%),
    radial-gradient(circle at 88% 14%, rgba(0,212,170,.09), transparent 28%),
    var(--bg);
  color: var(--ink);
  overflow-x: hidden;
}

button,
input {
  font: inherit;
}

button {
  cursor: pointer;
}

.app-shell {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 0 80px;
  overflow-x: hidden;
}

.stars {
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
}

.stars i {
  position: absolute;
  border-radius: 50%;
  background: #fff;
  opacity: .22;
  animation: twinkle 3.6s ease-in-out infinite;
}

@keyframes twinkle {
  0%, 100% { opacity: .06; }
  50% { opacity: .55; }
}

.aurora {
  position: fixed;
  border-radius: 50%;
  filter: blur(110px);
  pointer-events: none;
  z-index: 0;
  opacity: .75;
}

.a1 {
  width: 720px;
  height: 360px;
  top: -120px;
  left: -220px;
  background: radial-gradient(ellipse, rgba(66, 133, 244, .10), transparent 65%);
}

.a2 {
  width: 640px;
  height: 340px;
  bottom: -110px;
  right: -200px;
  background: radial-gradient(ellipse, rgba(0, 212, 170, .09), transparent 65%);
}

.a3 {
  display: none;
}

.navbar {
  width: 100%;
  height: 64px;
  padding: 0 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--bdr);
  background: rgba(8, 10, 14, .78);
  backdrop-filter: blur(20px);
  position: sticky;
  top: 0;
  z-index: 100;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  background: transparent;
  border: 0;
  color: var(--ink);
  font-weight: 700;
}

.brand-logo {
  width: 28px;
  height: 28px;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--blue), var(--green));
  display: grid;
  place-items: center;
  color: #fff;
}

.nav-steps {
  display: flex;
  align-items: center;
  gap: 6px;
}

.nav-steps span {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 100px;
  font-size: 12px;
  font-weight: 500;
  color: var(--ink3);
}

.nav-steps span.active {
  color: var(--ink);
  background: var(--s2);
  border: 1px solid var(--bdr2);
}

.nav-steps span.done {
  color: var(--accent);
}

.nav-steps i {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
}

.btn-outline,
.btn-accent {
  border-radius: 999px;
}

.btn-outline {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  background: transparent;
  border: 1px solid var(--bdr2);
  padding: 10px 18px;
  font-size: 13px;
  font-weight: 600;
  color: var(--ink2);
  transition: all .2s;
}

.btn-outline:hover {
  border-color: rgba(255,255,255,.25);
  color: var(--ink);
  background: var(--s2);
}

.btn-accent {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: var(--accent);
  color: #07110f;
  border: none;
  padding: 13px 26px;
  font-size: 14px;
  font-weight: 800;
  transition: transform .2s var(--spring), box-shadow .2s;
}

.btn-accent:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(0, 212, 170, .18);
}

.screen {
  display: block;
  width: 100%;
  max-width: 1120px;
  padding: 60px 40px;
  animation: scIn .45s var(--ease) both;
  position: relative;
  z-index: 1;
}

@keyframes scIn {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: translateY(0); }
}

.label,
.field-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .11em;
  text-transform: uppercase;
  color: var(--ink3);
}

h1,
h2 {
  font-family: 'Google Sans Display', 'Google Sans', system-ui, sans-serif;
  color: var(--ink);
}

h1 {
  font-size: clamp(52px, 7vw, 88px);
  font-weight: 800;
  line-height: .95;
  letter-spacing: -.04em;
  margin: 0;
}

h2 {
  font-size: clamp(36px, 5vw, 60px);
  font-weight: 800;
  line-height: .97;
  letter-spacing: -.035em;
  margin: 10px 0 8px;
}

p {
  font-size: 16px;
  line-height: 1.75;
  color: var(--ink2);
}

.gem,
h1 span {
  background: linear-gradient(90deg, #4285f4 0%, #1a73e8 20%, var(--accent) 55%, #1a73e8 80%, #4285f4 100%);
  background-size: 300% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: gsh 7s linear infinite;
}

@keyframes gsh {
  to { background-position: -300% center; }
}

.glass-panel {
  background: rgba(19, 25, 32, .74);
  border: 1px solid var(--bdr);
  backdrop-filter: blur(18px);
  box-shadow: 0 24px 80px rgba(0,0,0,.25);
}

.hero-screen {
  padding-top: 100px;
}

.hero-inner {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 80px;
  align-items: center;
  min-height: 60vh;
}

.hero-left {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.hero-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--accent2);
  border: 1px solid rgba(0, 212, 170, .2);
  border-radius: 100px;
  padding: 6px 14px;
  width: fit-content;
}

.pulse {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent);
}

.hero-pill span {
  font-size: 12px;
  font-weight: 500;
  color: var(--accent);
}

.hero-cta {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.google-wrap {
  min-height: 44px;
}

.google-loading {
  color: var(--ink3);
  font-size: 13px;
  font-weight: 700;
}

.hero-cards {
  position: relative;
  height: 420px;
}

.hcard {
  position: absolute;
  border-radius: 24px;
  overflow: hidden;
  border: 1px solid var(--bdr2);
  box-shadow: 0 24px 64px rgba(0,0,0,.35);
}

.hcard-1 { width: 240px; height: 160px; top: 20px; left: 20px; transform: rotate(-3deg); }
.hcard-2 { width: 200px; height: 140px; top: 60px; right: 0; transform: rotate(4deg); }
.hcard-3 { width: 220px; height: 150px; bottom: 40px; left: 60px; transform: rotate(2deg); }

.hcard img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hcard div {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px 14px;
  background: linear-gradient(to top, rgba(0,0,0,.78), transparent);
  font-size: 13px;
  font-weight: 600;
}

.hero-stat {
  position: absolute;
  background: var(--s2);
  border: 1px solid var(--bdr2);
  border-radius: 18px;
  padding: 10px 14px;
}

.hero-stat b {
  display: block;
  font-size: 24px;
}

.hero-stat span {
  font-size: 11px;
  color: var(--ink3);
}

.hs1 { top: 0; right: 180px; }
.hs2 { bottom: 80px; right: 10px; }

.setup-header {
  margin-bottom: 28px;
  max-width: 820px;
}

.form-shell {
  max-width: 780px;
  border-radius: 34px;
  padding: clamp(22px, 4vw, 36px);
  display: grid;
  gap: 22px;
}

label {
  display: grid;
  gap: 8px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: var(--ink3);
}

input {
  width: 100%;
  background: rgba(8, 10, 14, .72);
  border: 1px solid var(--bdr);
  border-radius: 999px;
  padding: 15px 20px;
  font-size: 15px;
  color: var(--ink);
  outline: none;
}

input:focus {
  border-color: rgba(0,212,170,.48);
  background: rgba(19, 25, 32, .95);
}

.suggestions,
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.suggestion,
.chip {
  padding: 8px 16px;
  background: rgba(255,255,255,.04);
  border: 1px solid var(--bdr);
  border-radius: 999px;
  font-size: 13px;
  color: var(--ink2);
}

.suggestion.active,
.chip.active {
  background: var(--accent2);
  border-color: var(--accent);
  color: var(--accent);
  font-weight: 800;
}

.field-block {
  display: grid;
  gap: 8px;
}

.pi-card {
  padding: 20px;
  border-radius: 26px;
  background: rgba(255,255,255,.035);
  border: 1px solid var(--bdr);
}

.spark {
  width: 28px;
  height: 28px;
  background: var(--accent2);
  color: var(--accent);
  border-radius: 12px;
  display: grid;
  place-items: center;
  margin-bottom: 12px;
}

.profile-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 7px 12px;
  border-radius: 999px;
  background: var(--accent2);
  color: var(--accent);
  font-size: 12px;
  font-weight: 700;
}

.profile-chip img {
  width: 22px;
  height: 22px;
  border-radius: 50%;
}

.primary-wide {
  width: fit-content;
}

.mood-screen {
  max-width: 1220px;
}

.mood-header {
  max-width: 900px;
  margin-bottom: 34px;
}

.mood-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(160px, 1fr));
  gap: 18px;
}

.mood-tile {
  position: relative;
  min-height: 178px;
  border-radius: 30px;
  border: 2px solid rgba(255,255,255,.10);
  background: rgba(255,255,255,.035);
  color: var(--ink);
  padding: 26px 24px;
  text-align: left;
  display: flex;
  flex-direction: column;
  justify-content: center;
  transition: border-color .2s, background .2s, transform .2s;
}

.mood-tile:hover {
  transform: translateY(-2px);
  border-color: rgba(255,255,255,.20);
}

.mood-tile.active {
  background:
    radial-gradient(circle at 80% 70%, rgba(0,212,170,.12), transparent 36%),
    rgba(26,115,232,.12);
  border-color: var(--blue);
}

.mood-icon {
  width: 54px;
  height: 54px;
  border-radius: 18px;
  display: grid;
  place-items: center;
  background: rgba(255,255,255,.06);
  color: rgba(255,255,255,.72);
  font-size: 24px;
  margin-bottom: 22px;
}

.mood-tile.active .mood-icon {
  background: rgba(66,133,244,.20);
  color: var(--blue2, #8ab4f8);
}

.mood-tile strong {
  display: block;
  font-size: 24px;
  line-height: 1.1;
  letter-spacing: -.02em;
}

.mood-tile p {
  margin: 8px 0 0;
  font-size: 15px;
  color: var(--ink2);
  line-height: 1.35;
}

.mood-check {
  position: absolute;
  top: 18px;
  right: 18px;
  width: 30px;
  height: 30px;
  border-radius: 999px;
  display: none;
  place-items: center;
  background: var(--blue);
  color: white;
  font-weight: 900;
}

.mood-tile.active .mood-check {
  display: grid;
}

.mood-image-strip {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-top: 22px;
}

.mood-image-card {
  height: 160px;
  border-radius: 28px;
  overflow: hidden;
  position: relative;
  border: 1px solid var(--bdr);
}

.mood-image-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.mood-image-card div {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,.70), transparent);
}

.mood-image-card span {
  position: absolute;
  left: 18px;
  bottom: 16px;
  font-weight: 800;
}

.bottom-cta {
  margin-top: 22px;
  padding: 16px 18px;
  border-radius: 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}

.selected-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.selected-chips span {
  padding: 6px 12px;
  border-radius: 999px;
  background: var(--accent2);
  color: var(--accent);
  font-size: 12px;
  font-weight: 800;
}

.loading-screen {
  min-height: calc(100vh - 64px);
  display: grid;
  place-items: center;
}

.loader-layout {
  width: min(860px, 100%);
  display: grid;
  gap: 28px;
  justify-items: center;
  text-align: center;
}

.constellation {
  width: min(420px, 72vw);
  height: 260px;
  display: grid;
  place-items: center;
}

.constellation svg {
  width: 100%;
  height: 100%;
  overflow: visible;
}

.constellation polyline {
  fill: none;
  stroke: url(#googleLine);
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 480;
  stroke-dashoffset: 480;
  animation: drawConstellation 2.2s ease forwards infinite;
  filter: drop-shadow(0 0 18px rgba(66,133,244,.25));
}

.constellation circle {
  opacity: .95;
  animation: pulseStar 2.2s ease-in-out infinite;
}

.constellation .blue { fill: #4285F4; }
.constellation .green { fill: #34A853; }
.constellation .yellow { fill: #FBBC04; }
.constellation .red { fill: #EA4335; }

@keyframes drawConstellation {
  0% { stroke-dashoffset: 480; opacity: .35; }
  45%, 100% { stroke-dashoffset: 0; opacity: 1; }
}

@keyframes pulseStar {
  0%,100% { transform: scale(1); transform-origin: center; }
  50% { transform: scale(1.24); transform-origin: center; }
}

.loading-copy h2 {
  margin-top: 6px;
}

.load-glass {
  width: min(620px, 100%);
  padding: 20px 22px;
  border-radius: 30px;
  background: rgba(19,25,32,.68);
  border: 1px solid var(--bdr);
  backdrop-filter: blur(18px);
}

.load-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 13px 0;
  border-bottom: 1px solid var(--bdr);
  font-size: 14px;
  color: var(--ink3);
  opacity: .32;
}

.load-row:last-child {
  border-bottom: 0;
}

.load-row.on {
  opacity: 1;
  color: var(--ink2);
}

.load-row b {
  width: 7px;
  height: 7px;
  background: var(--ink3);
  border-radius: 50%;
  flex: 0 0 auto;
}

.load-row.on b {
  background: var(--accent);
}

.load-row em {
  margin-left: auto;
  font-style: normal;
  font-size: 12px;
  color: var(--accent);
}

.api-error-card {
  width: min(620px, 100%);
  background: var(--s2);
  border: 1px solid var(--bdr2);
  border-radius: 30px;
  padding: 34px;
  text-align: left;
  box-shadow: 0 32px 80px rgba(0,0,0,.45);
}

.error-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 22px;
}

.result-screen {
  max-width: none;
  width: 100%;
  padding: 0 0 80px;
}

.res-hero {
  width: 100%;
  height: 480px;
  position: relative;
  overflow: hidden;
}

.res-hero img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: .35;
}

.res-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, rgba(8,10,14,0), rgba(8,10,14,.82) 74%, rgba(8,10,14,1));
}

.res-content {
  position: absolute;
  bottom: 0;
  left: 50%;
  width: min(1240px, 100%);
  transform: translateX(-50%);
  padding: 44px clamp(28px, 6vw, 80px);
}

.res-tag {
  display: inline-flex;
  padding: 5px 12px;
  background: var(--accent2);
  border: 1px solid rgba(0,212,170,.2);
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .08em;
  color: var(--accent);
  margin-bottom: 14px;
  text-transform: uppercase;
}

.res-content h2 {
  font-size: clamp(52px,7vw,80px);
  color: #fff;
  margin: 0 0 8px;
}

.res-summary {
  max-width: 720px;
  margin-top: 12px;
}

.res-dna-strip {
  display: flex;
  gap: 7px;
  flex-wrap: wrap;
  margin-top: 14px;
}

.res-dna-strip span {
  padding: 6px 12px;
  background: rgba(255,255,255,.08);
  border: 1px solid rgba(255,255,255,.12);
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  color: rgba(255,255,255,.72);
  backdrop-filter: blur(8px);
}

.action-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding: 16px clamp(28px, 6vw, 80px);
  border-bottom: 1px solid var(--bdr);
  border-top: 1px solid var(--bdr);
  background: rgba(8,10,14,.72);
  backdrop-filter: blur(18px);
  position: sticky;
  top: 64px;
  z-index: 10;
}

.timeline {
  max-width: 1040px;
  margin: 0 auto;
  padding: 52px clamp(28px, 6vw, 80px) 90px;
}

.stop {
  display: flex;
  position: relative;
  margin-bottom: 36px;
}

.stop:not(:last-child)::after {
  content: "";
  position: absolute;
  left: 15px;
  top: 32px;
  bottom: -36px;
  width: 1px;
  background: linear-gradient(var(--bdr), transparent);
}

.s-pin {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--s2);
  border: 1.5px solid var(--bdr);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-right: 18px;
  margin-top: 2px;
  color: var(--ink3);
  font-size: 12px;
}

.s-pin.featured {
  border-color: var(--accent);
  background: rgba(0,212,170,.1);
  color: var(--accent);
}

.s-body {
  flex: 1;
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(300px, 440px);
  column-gap: 34px;
  align-items: start;
}

.s-body > .s-cat,
.s-body > h3,
.s-body > h4,
.s-body > p,
.s-body > small,
.s-body > .place-meta {
  grid-column: 1;
}

.s-body > .s-photo {
  grid-column: 2;
  grid-row: 1 / span 7;
}

.s-cat {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: var(--ink3);
  margin-bottom: 2px;
}

.s-body h3 {
  font-size: 26px;
  margin: 0 0 5px;
}

.s-body h3 span {
  font-size: 12px;
  color: var(--ink3);
  margin-left: 4px;
}

.s-body h4 {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 5px;
}

.s-body p {
  font-size: 13px;
  line-height: 1.65;
  color: var(--ink3);
  margin-bottom: 14px;
}

.s-photo {
  border-radius: 26px;
  height: 240px;
  position: relative;
  overflow: hidden;
  margin-bottom: 8px;
  display: flex;
  align-items: end;
  padding: 14px;
  transition: transform .5s var(--ease), box-shadow .5s var(--ease);
  background: linear-gradient(135deg, #4285f4, #00d4aa);
  box-shadow: 0 18px 60px rgba(0,0,0,.28);
}

.s-photo:hover {
  transform: scale(1.015);
}

.s-photo img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform .7s var(--ease), filter .4s;
}

.s-photo:hover img {
  transform: scale(1.06);
  filter: saturate(1.08) contrast(1.02);
}

.s-photo-ov {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(to top, rgba(0,0,0,.68), transparent 58%),
    radial-gradient(circle at 78% 12%, rgba(66,133,244,.20), transparent 35%);
}

.s-photo span {
  position: relative;
  z-index: 1;
  font-size: 12px;
  font-weight: 700;
  color: rgba(255,255,255,.9);
  background: rgba(0,0,0,.36);
  border: 1px solid rgba(255,255,255,.12);
  backdrop-filter: blur(8px);
  padding: 6px 12px;
  border-radius: 999px;
}

.place-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 10px 0 10px;
}

.place-meta span,
.place-meta a {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(255,255,255,.06);
  border: 1px solid var(--bdr);
  color: var(--ink2);
  font-size: 12px;
  font-weight: 700;
  text-decoration: none;
}

.place-meta a {
  color: var(--accent);
  border-color: rgba(0,212,170,.20);
  background: rgba(0,212,170,.08);
}

small {
  color: var(--ink3);
}

@media(max-width: 1120px) {
  .mood-grid {
    grid-template-columns: repeat(3, minmax(160px, 1fr));
  }
}

@media(max-width: 980px) {
  .hero-inner {
    grid-template-columns: 1fr;
    gap: 48px;
  }

  .hero-cards {
    display: none;
  }

  .s-body {
    display: block;
  }

  .nav-steps {
    display: none;
  }
}

@media(max-width: 720px) {
  .mood-grid {
    grid-template-columns: repeat(2, minmax(140px, 1fr));
  }

  .mood-image-strip {
    grid-template-columns: 1fr;
  }

  .bottom-cta {
    flex-direction: column;
    align-items: stretch;
  }
}

@media(max-width: 600px) {
  .navbar {
    padding: 0 20px;
  }

  .screen {
    padding: 40px 20px;
  }

  .mood-grid {
    grid-template-columns: 1fr;
  }

  .mood-tile {
    min-height: 150px;
  }

  .res-hero {
    height: 420px;
  }

  .res-content h2 {
    font-size: 40px;
  }

  .action-bar {
    position: static;
  }

  .s-photo {
    height: 210px;
  }
}


/* Full-screen rounded image mood grid */
.mood-screen {
  max-width: none;
  padding-left: clamp(18px, 3vw, 44px);
  padding-right: clamp(18px, 3vw, 44px);
}

.mood-header {
  max-width: 1080px;
  margin: 0 auto 28px;
}

.mood-grid.image-mode {
  width: min(1440px, 100%);
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  grid-auto-rows: clamp(230px, 27vh, 330px);
  gap: 18px;
  padding: 0;
}

.image-tile {
  min-height: 0;
  height: 100%;
  padding: 0;
  border-radius: 34px;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,.13);
  background: var(--s2);
  position: relative;
  display: block;
  box-shadow: 0 18px 54px rgba(0,0,0,.26);
}

.image-tile:hover {
  transform: translateY(-3px);
  border-color: rgba(255,255,255,.24);
}

.image-tile.active {
  border-color: var(--blue);
  outline: 3px solid rgba(66,133,244,.55);
  outline-offset: -3px;
  background: var(--s2);
}

.image-tile img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: brightness(.58) saturate(.9);
  transition: transform .75s var(--ease), filter .35s ease;
}

.image-tile:hover img {
  transform: scale(1.11);
  filter: brightness(.76) saturate(1.12);
}

.image-tile::after {
  content: "";
  position: absolute;
  inset: 0;
  background:
    linear-gradient(to top, rgba(0,0,0,.88), rgba(0,0,0,.30) 52%, rgba(0,0,0,.06)),
    radial-gradient(circle at 80% 15%, rgba(66,133,244,.18), transparent 34%);
  pointer-events: none;
}

.image-tile .image-sheen {
  position: absolute;
  inset: -60%;
  background: linear-gradient(110deg, transparent 30%, rgba(255,255,255,.18), transparent 62%);
  transform: translateX(-50%);
  opacity: 0;
  z-index: 2;
  pointer-events: none;
}

.image-tile:hover .image-sheen {
  animation: imageSweep 1.4s ease-in-out infinite;
  opacity: 1;
}

@keyframes imageSweep {
  to { transform: translateX(55%); }
}

.mood-copy {
  position: absolute;
  left: 24px;
  right: 24px;
  bottom: 22px;
  z-index: 3;
}

.mood-copy strong {
  display: block;
  color: #fff;
  font-size: clamp(24px, 2.2vw, 34px);
  line-height: 1;
  letter-spacing: -.035em;
}

.mood-copy p {
  color: rgba(255,255,255,.72);
  margin: 8px 0 0;
  font-size: 14px;
  line-height: 1.35;
}

.mood-number {
  position: absolute;
  left: 24px;
  top: 22px;
  z-index: 3;
  color: rgba(255,255,255,.52);
  font-size: 12px;
  font-weight: 900;
  letter-spacing: .12em;
}

.image-tile .mood-check {
  top: 18px;
  right: 18px;
  z-index: 4;
  background: var(--accent);
  color: #07110f;
}

.image-tile.active .mood-check {
  display: grid;
}

.tile-1,
.tile-8 {
  grid-row: span 2;
}

.tile-9 {
  grid-column: span 2;
}

.mood-image-strip {
  display: none !important;
}

.bottom-cta {
  width: min(1440px, 100%);
  margin: 20px auto 0;
  border-radius: 32px;
}

@media(max-width: 1180px) {
  .mood-grid.image-mode {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    grid-auto-rows: 260px;
  }

  .tile-1,
  .tile-8,
  .tile-9 {
    grid-row: span 1;
    grid-column: span 1;
  }
}

@media(max-width: 760px) {
  .mood-grid.image-mode {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-auto-rows: 230px;
    gap: 14px;
  }

  .mood-copy {
    left: 18px;
    right: 18px;
    bottom: 18px;
  }

  .mood-copy strong {
    font-size: 22px;
  }

  .mood-number {
    left: 18px;
    top: 18px;
  }
}

@media(max-width: 520px) {
  .mood-grid.image-mode {
    grid-template-columns: 1fr;
    grid-auto-rows: 220px;
  }
}
`;

createRoot(document.getElementById("root")).render(<App />);
