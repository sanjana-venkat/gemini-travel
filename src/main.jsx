import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function getTravelArchetype(moods = []) {
  const ids = moods.map((m) => m.id);
  const has = (value) => ids.includes(value);
  if (has("romantic") && has("active") && has("nature")) return { name: "The Scenic Spark", line: "You move through places like someone who notices everything — the light, the pace, the person beside you." };
  if (has("romantic") && has("slow-easy")) return { name: "The Soft Landing", line: "You travel to feel, not to collect. Unhurried, intentional, and present in every moment." };
  if (has("romantic") && has("cultural")) return { name: "The Intimate Explorer", line: "You want beauty with substance — places that mean something, shared with someone who matters." };
  if (has("culinary") && has("cultural")) return { name: "The Local Romantic", line: "You find culture through flavor. Markets, kitchens, and hole-in-the-wall restaurants are your galleries." };
  if (has("culinary") && has("social")) return { name: "The Table Hopper", line: "For you, the best conversations happen over food. You eat where the locals eat and stay twice as long." };
  if (has("adventurous") && has("active")) return { name: "The Momentum Seeker", line: "You don't sit still. You're drawn to edges, ascents, and the quiet satisfaction of having pushed yourself." };
  if (has("adventurous") && has("nature")) return { name: "The Raw Wanderer", line: "Crowds bore you. You're after the kind of beauty that takes effort to reach — and silence when you get there." };
  if (has("nature") && has("slow-easy")) return { name: "The Quiet Wanderer", line: "You travel to exhale. Open skies, slow mornings, and nothing on a schedule you didn't write yourself." };
  if (has("social") && has("active")) return { name: "The Energy Chaser", line: "You move fast and meet people doing the same. Cities feel alive to you — and you want to be in the middle of it." };
  if (has("cultural") && has("slow-easy")) return { name: "The Considered Traveler", line: "You'd rather understand one place deeply than skim ten. Depth over distance, always." };
  if (has("open") && has("adventurous")) return { name: "The Unscripted", line: "Plans are a starting point for you — not a constraint. You follow what feels right and rarely regret it." };
  if (has("open")) return { name: "The Open Compass", line: "You show up curious and let the place decide. The best trips you've taken were never fully planned." };
  if (has("romantic")) return { name: "The Slow Romantic", line: "You travel to feel something. Golden hour, good wine, and nowhere to be — that's the whole point." };
  if (has("adventurous")) return { name: "The Edge Seeker", line: "You measure a trip by what made your heart rate spike. Comfort is a baseline, not the goal." };
  if (has("culinary")) return { name: "The Flavor Pilgrim", line: "You plan trips around meals and discover everything else along the way. Eating well is non-negotiable." };
  if (has("social")) return { name: "The Connector", line: "You leave places with new numbers in your phone. Energy, people, and a full table — that's your version of a great trip." };
  if (has("nature")) return { name: "The Landscape Chaser", line: "You're drawn to places that make you feel small in the best way. Wild, open, and far from anything ordinary." };
  if (has("cultural")) return { name: "The Context Seeker", line: "You want the story behind the place. History, art, architecture — you travel to understand, not just to see." };
  if (has("active")) return { name: "The Kinetic Traveler", line: "You see a city best from a run or a bike. Movement is how you think, explore, and decompress." };
  if (has("slow-easy")) return { name: "The Unhurried", line: "You know that the best travel memories are almost never the rushed ones. You give places the time they deserve." };
  if (moods.length) return { name: "The Mood-Led Traveler", line: "You know what you want today — and you're building a day around exactly that feeling." };
  return { name: "The Mood-Led Traveler", line: "You know what you want today — and you're building a day around exactly that feeling." };
}

function buildGoogleMapsTripUrl(stops = []) {
  const names = stops.map((stop) => stop.googlePlaceName || stop.name || stop.photoQuery).filter(Boolean).slice(0, 10);
  if (!names.length) return "";
  if (names.length === 1) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(names[0])}`;
  const origin = names[0];
  const destination = names[names.length - 1];
  const waypoints = names.slice(1, -1).join("|");
  let url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=walking`;
  if (waypoints) url += `&waypoints=${encodeURIComponent(waypoints)}`;
  return url;
}

function getToday() { return new Date().toISOString().slice(0, 10); }

function prettyDate(value) {
  if (!value) return "Today";
  const date = new Date(`${value}T12:00:00`);
  return date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

const fallbackDestinationSuggestions = [
  { label: "Kyoto, Japan", aliases: ["kyoto"] },
  { label: "Oaxaca, Mexico", aliases: ["oaxaca"] },
  { label: "Big Island, Hawaii", aliases: ["big island", "hawaii"] },
  { label: "Kauai, Hawaii", aliases: ["kauai"] },
  { label: "San Francisco, CA", aliases: ["san francisco", "sf", "frisco", "bay area"] },
  { label: "New York City", aliases: ["new york", "nyc"] },
  { label: "Paris, France", aliases: ["paris"] },
  { label: "Tokyo, Japan", aliases: ["tokyo"] }
];

const moodVibes = [
  { id: "adventurous", title: "Adventurous", tag: "Push the edge", signal: "hikes, movement, active experiences, discovery", icon: "△", img: "https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=1400" },
  { id: "slow-easy", title: "Slow & easy", tag: "Breathe it in", signal: "few stops, long pauses, gentle transitions", icon: "〰", img: "https://images.pexels.com/photos/2868242/pexels-photo-2868242.jpeg?auto=compress&cs=tinysrgb&w=1400" },
  { id: "cultural", title: "Cultural", tag: "Art, history, depth", signal: "museums, architecture, rituals, history, meaningful places", icon: "▱", img: "https://images.pexels.com/photos/1510595/pexels-photo-1510595.jpeg?auto=compress&cs=tinysrgb&w=1400" },
  { id: "culinary", title: "Culinary", tag: "Eat like a local", signal: "food-led planning, neighborhood restaurants, local specialties", icon: "╯", img: "https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg?auto=compress&cs=tinysrgb&w=1400" },
  { id: "nature", title: "Into nature", tag: "Wild, open, free", signal: "nature, viewpoints, walks, parks, scenic routes", icon: "△", img: "https://images.pexels.com/photos/3408354/pexels-photo-3408354.jpeg?auto=compress&cs=tinysrgb&w=1400" },
  { id: "social", title: "Social", tag: "Meet, mix, connect", signal: "lively areas, events, markets, group-friendly experiences", icon: "♧", img: "https://images.pexels.com/photos/378570/pexels-photo-378570.jpeg?auto=compress&cs=tinysrgb&w=1400" },
  { id: "active", title: "Active", tag: "Move and explore", signal: "walking, biking, hikes, lots of movement, active pacing", icon: "⌁", img: "https://images.pexels.com/photos/1578662/pexels-photo-1578662.jpeg?auto=compress&cs=tinysrgb&w=1400" },
  { id: "open", title: "Open to anything", tag: "Let Gemini decide", signal: "surprise me, balanced plan, flexible recommendations", icon: "⌁", img: "https://images.pexels.com/photos/2070033/pexels-photo-2070033.jpeg?auto=compress&cs=tinysrgb&w=1400" },
  { id: "romantic", title: "Romantic", tag: "Intentional, slow", signal: "golden hour, lanterns, views, beautiful dinner, partner-friendly", icon: "♡", img: "https://images.pexels.com/photos/1024960/pexels-photo-1024960.jpeg?auto=compress&cs=tinysrgb&w=1400" }
];

function PlacesCarousel({ moods, places }) {
  const [idx, setIdx] = React.useState(0);
  React.useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % moods.length), 2000);
    return () => clearInterval(t);
  }, [moods.length]);
  const cleanName = (raw, fallback) => {
    if (!raw) return fallback;
    const parts = raw.split(",");
    return parts[0].trim();
  };
  return (
    <div className="places-carousel">
      {moods.map((m, i) => {
        const place = places[i];
        const rating = (4.1 + i * 0.15).toFixed(1);
        const name = cleanName(place?.name, m.title);
        return (
          <div key={m.id + i} className={`pc-slide${i === idx ? " pc-active" : i === (idx - 1 + moods.length) % moods.length ? " pc-prev" : ""}`}>
            <img src={m.img} alt="" />
            <div className="pc-ov"/>
            <div className="pc-meta">
              <span className="pc-name">{name}</span>
              <div className="pc-chips">
                <span className="pc-rating-chip">★ {rating}</span>
                {place && <span className="pc-type-chip">{m.title}</span>}
              </div>
            </div>
          </div>
        );
      })}
      <div className="pc-dots">
        {moods.map((_, i) => <span key={i} className={`pc-dot${i === idx ? " pc-dot-active" : ""}`}/>)}
      </div>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [step, setStep] = useState("login");
  const [destination, setDestination] = useState("Paris");
  const [placePredictions, setPlacePredictions] = useState([]);
  const [isAutocompleting, setIsAutocompleting] = useState(false);
  const [date, setDate] = useState(getToday());
  const [diet, setDiet] = useState("Vegetarian");
  const [planFor, setPlanFor] = useState("Date");
  const [selectedMoods, setSelectedMoods] = useState(["active", "romantic"]);
  const [loadingLine, setLoadingLine] = useState(0);
  const [placesPhotos, setPlacesPhotos] = useState([]);
  const [itinerary, setItinerary] = useState(null);
  const [googleReady, setGoogleReady] = useState(false);
  const [error, setError] = useState("");
  const [showSubscribe, setShowSubscribe] = useState(false);
  const [subscribeEmail, setSubscribeEmail] = useState("");
  const [subscribeSaved, setSubscribeSaved] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const shellRef = useRef(null);

  function goTo(s) {
    window.scrollTo({ top: 0, behavior: "instant" });
    setStep(s);
  }

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
    return () => { window.removeEventListener("pointermove", moveGlow); if (rafId) cancelAnimationFrame(rafId); };
  }, []);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || step !== "login") return;
    let attempts = 0;
    let cancelled = false;
    const loadGoogleButton = () => {
      const buttonContainer = document.getElementById("googleSignIn");
      if (cancelled || !buttonContainer) { attempts += 1; if (!cancelled && attempts < 30) setTimeout(loadGoogleButton, 200); return; }
      if (!window.google?.accounts?.id) { attempts += 1; if (attempts < 40) setTimeout(loadGoogleButton, 200); return; }
      setGoogleReady(true);
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => {
          const payload = JSON.parse(atob(response.credential.split(".")[1]));
          setUser({ name: payload.name, email: payload.email, picture: payload.picture });
          goTo("setup");
        }
      });
      buttonContainer.innerHTML = "";
      window.google.accounts.id.renderButton(buttonContainer, { theme: "outline", size: "large", shape: "pill", text: "continue_with", width: 320 });
    };
    loadGoogleButton();
    return () => { cancelled = true; };
  }, [step]);

  useEffect(() => {
    const query = destination.trim();
    if (query.length < 2) { setPlacePredictions([]); return; }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setIsAutocompleting(true);
      try {
        const response = await fetch(`/api/place-autocomplete?input=${encodeURIComponent(query)}`);
        const data = await response.json();
        if (!cancelled && Array.isArray(data.suggestions)) setPlacePredictions(data.suggestions);
      } catch (error) {
        console.warn("Autocomplete fallback:", error);
        if (!cancelled) setPlacePredictions([]);
      } finally {
        if (!cancelled) setIsAutocompleting(false);
      }
    }, 220);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [destination]);

  const fallbackFilteredDestinations = fallbackDestinationSuggestions.filter((item) => {
    const query = destination.toLowerCase().trim();
    return item.label.toLowerCase().includes(query) || item.aliases.some((alias) => alias.includes(query));
  });

  const destinationOptions = placePredictions.length
    ? placePredictions
    : fallbackFilteredDestinations.slice(0, 6).map((item) => ({ label: item.label, source: "fallback" }));

  const selectedMoodObjects = selectedMoods.map((id) => moodVibes.find((vibe) => vibe.id === id)).filter(Boolean);
  const travelArchetype = getTravelArchetype(selectedMoodObjects);
  const tripMapsUrl = itinerary?.stops?.length ? buildGoogleMapsTripUrl(itinerary.stops) : "";

  const loadingItems = useMemo(() => [
    user?.name ? `${user.name}'s lightweight profile` : "Quick feeler profile",
    "Today's mood signals",
    "Dietary preferences",
    "Destination context",
    "Google Places candidates",
    "Real place photos and ratings",
    "Gemini itinerary generation"
  ], [user]);

  function toggleMood(id) {
    setSelectedMoods((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (current.length >= 3) return [...current.slice(1), id];
      return [...current, id];
    });
  }

  async function generatePlan() {
    goTo("loading");
    setError("");
    setLoadingLine(0);
    setItinerary(null);
    setPlacesPhotos([]);

    const CLAMP_AT = 5;
    const interval = setInterval(() => {
      setLoadingLine((v) => Math.min(v + 1, CLAMP_AT));
    }, 2400);

    const fetchPlaces = async () => {
      try {
        const res = await fetch(`/api/place-autocomplete?input=${encodeURIComponent(destination)}`);
        const data = await res.json();
        const photos = await Promise.all(
          [destination, ...selectedMoodObjects.map(m => `${destination} ${m.title}`)].slice(0, 5).map(async (q) => {
            try {
              const r = await fetch(`/api/place-autocomplete?input=${encodeURIComponent(q)}`);
              const d = await r.json();
              const first = (d.suggestions || [])[0];
              return first ? { name: first.label || first, placeId: first.placeId } : null;
            } catch { return null; }
          })
        );
        setPlacesPhotos(photos.filter(Boolean));
      } catch (e) {}
    };

    const geminiPromise = fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user, destination, dates: prettyDate(date), date, diet, travelWith: planFor, selectedMoods: selectedMoodObjects, instruction: "Create a real, specific, mood-first day plan. Infer longer-term travel style lightly from Google profile if available, but do not ask the user to select it. Use selectedMoods as today's short-term intent. Return concrete places. The server will enrich stops with Google Places photos, ratings, addresses, and map links." })
    });

    fetchPlaces();

    try {
      const res = await geminiPromise;
      const data = await res.json();
      if (!res.ok || data?.error) throw new Error(data?.error || "Gemini API route failed");
      clearInterval(interval);
      setLoadingLine(6);
      setItinerary(data);
      setTimeout(() => goTo("result"), 800);
    } catch (err) {
      clearInterval(interval);
      console.error(err);
      setError(err.message || "Gemini could not generate the plan.");
      goTo("apiError");
    }
  }

  return (
    <div className="app-shell" ref={shellRef}>
      <style>{css}</style>

      <nav className="navbar">
        {/* Desktop: step pills */}
        <div className="nav-steps nav-left nav-desktop">
          {[{ label: "Setup", value: "setup" }, { label: "Mood", value: "mood" }, { label: "Result", value: "result" }].map((item, i) => {
            const order = ["setup", "mood", "result"];
            const active = step === item.value;
            const done = order.indexOf(step) > i || step === "loading";
            const disabled = item.value === "result" && !itinerary;
            return (
              <button type="button" className={active ? "active" : done ? "done" : ""} key={item.value} disabled={disabled} onClick={() => { if (!disabled) goTo(item.value); }}>
                <i /> {item.label}
              </button>
            );
          })}
        </div>
        <div className="nav-actions nav-desktop">
          <button className="btn-accent nav-subscribe" onClick={() => setShowSubscribe(true)}>Subscribe for updates</button>
        </div>

        {/* Mobile: subscribe + hamburger */}
        <div className="nav-mobile">
          <button className="btn-accent nav-subscribe" onClick={() => setShowSubscribe(true)}>Subscribe for updates</button>
          <button
            className={`hamburger${menuOpen ? " hamburger-open" : ""}`}
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Menu"
          >
            <span /><span /><span />
          </button>
        </div>

        {/* Mobile drawer */}
        {menuOpen && (
          <div className="mobile-drawer" onClick={() => setMenuOpen(false)}>
            <div className="mobile-drawer-inner" onClick={e => e.stopPropagation()}>
              <p className="mobile-drawer-label">Navigation</p>
              {[{ label: "Setup", value: "setup" }, { label: "Mood", value: "mood" }, { label: "Result", value: "result" }].map((item, i) => {
                const order = ["setup", "mood", "result"];
                const active = step === item.value;
                const done = order.indexOf(step) > i || step === "loading";
                const disabled = item.value === "result" && !itinerary;
                return (
                  <button
                    type="button"
                    className={`drawer-item${active ? " drawer-item-active" : ""}${done ? " drawer-item-done" : ""}${disabled ? " drawer-item-disabled" : ""}`}
                    key={item.value}
                    disabled={disabled}
                    onClick={() => { if (!disabled) { goTo(item.value); setMenuOpen(false); } }}
                  >
                    <span className="drawer-dot" />
                    {item.label}
                    {done && !active && <span className="drawer-check">✓</span>}
                  </button>
                );
              })}
              <button className="btn-accent drawer-subscribe" onClick={() => { setShowSubscribe(true); setMenuOpen(false); }}>
                Subscribe for updates
              </button>
            </div>
          </div>
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
              <h1>Today feels <span>different.</span></h1>
              <p>Because even the best recommendation system can't predict what you'll want today. Whether it's a single evening, a full day, or a whole trip.</p>
              <div className="hero-cta">
                <div className="google-wrap">
                  <div id="googleSignIn" />
                  {!googleReady && GOOGLE_CLIENT_ID && <div className="google-loading">Loading Google sign in...</div>}
                </div>
                <button className="btn-accent" onClick={() => goTo("setup")}>Continue without sign in</button>
              </div>
            </div>
            <div className="hero-cards itinerary-showreel" aria-label="Itinerary preview animation">
              <div className="showreel-frame">
                <div className="showreel-image-stack">
                  <img className="reel-img reel-img-1" src={moodVibes[8].img} alt="" />
                  <img className="reel-img reel-img-2" src={moodVibes[2].img} alt="" />
                  <img className="reel-img reel-img-3" src={moodVibes[3].img} alt="" />
                </div>
                <div className="showreel-overlay" />
                <div className="itinerary-lines">
                  <div className="itinerary-line line-1"><b>08:30</b><span>Quiet temple morning</span></div>
                  <div className="itinerary-line line-2"><b>12:00</b><span>Vegetarian lunch nearby</span></div>
                  <div className="itinerary-line line-3"><b>17:30</b><span>Golden-hour walk</span></div>
                </div>
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
            <p>We'll infer your longer-term travel style from your lightweight profile later. For now, tell us where, when, and what constraints matter.</p>
          </section>
          <section className="form-shell glass-panel">
            <label>
              <span>Destination</span>
              <input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="City, neighborhood, or place" autoComplete="off" />
            </label>
            <div className="suggestions autocomplete-suggestions">
              {destinationOptions.map((item) => (
                <button type="button" key={item.placeId || item.label} className={destination === item.label ? "suggestion active" : "suggestion"} onClick={() => setDestination(item.label)}>
                  {item.label}
                </button>
              ))}
              {isAutocompleting && <div className="autocomplete-loading">Searching Google Maps…</div>}
            </div>
            <label>
              <span>When</span>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </label>
            <Select label="Dietary preference" value={diet} setValue={setDiet} options={["Vegetarian", "Vegan", "No restrictions", "Gluten-free"]} />
            <Select label="Going with" value={planFor} setValue={setPlanFor} options={["Solo", "Date", "Friends", "Family", "Workday"]} />
            <div className="pi-card">
              <div className="spark">✦</div>
              <p className="label">Personal Intelligence Preview</p>
              <h3>We don't have full access to your Google Personal Intelligence yet.</h3>
              <p>We're working on it. Soon, we'll skip these questions with your Google data. For now, give us a quick feeler.</p>
              {user ? (
                <div className="profile-chip"><img src={user.picture} alt="" />Signed in as {user.name}</div>
              ) : null}
            </div>
            <button className="btn-accent primary-wide" onClick={() => goTo("mood")}>Choose today's mood</button>
          </section>
        </main>
      )}

      {step === "mood" && (
        <main className="screen mood-screen on">
          <section className="mood-header">
            <p className="label">Step 2 / 2 · Choose up to 3</p>
            <h2>What's your <span className="gem">vibe?</span></h2>
            <p>This one input reshapes your entire day. It's the variable Gemini can't infer from data alone.</p>
          </section>
          <section className="mood-grid image-grid">
            {moodVibes.map((vibe, index) => (
              <button type="button" key={vibe.id} className={selectedMoods.includes(vibe.id) ? "image-mood-tile active" : "image-mood-tile"} onClick={() => toggleMood(vibe.id)}>
                <img src={vibe.img} alt={vibe.title} loading="lazy" />
                <span className="tile-number">{String(index + 1).padStart(2, "0")}</span>
                <div className="image-tile-overlay" />
                <div className="image-tile-content">
                  <strong>{vibe.title}</strong>
                  <p>{vibe.tag}</p>
                </div>
              </button>
            ))}
          </section>
          <section className="build-cta-row">
            <button className="btn-accent" onClick={generatePlan}>Build itinerary</button>
          </section>
        </main>
      )}

      {step === "loading" && (
        <main className="loading-screen on">
          <div className="loader-head">
            <h2 className="loader-headline">Decoding your <span className="gem">Travel DNA</span></h2>
            <p className="loader-sub">{destination} · {selectedMoodObjects.map(m => m.title).join(", ")}</p>
          </div>
          <div className="loader-stage">
            <div className={`ls${loadingLine === 0 ? " ls-active" : " ls-done"}`}>
              <div className="ls-profile">
                <div className="profile-ring-wrap">
                  <svg className="profile-ring-svg" viewBox="0 0 120 120">
                    <circle className="ring-bg" cx="60" cy="60" r="54"/>
                    <circle className="ring-fill" cx="60" cy="60" r="54"/>
                  </svg>
                  {user?.picture
                    ? <img className="profile-pic" src={user.picture} alt={user.name} />
                    : <div className="profile-pic profile-pic-fallback">
                        <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="19" cy="14" r="7" fill="var(--ink-3)" opacity="0.6"/>
                          <path d="M4 34c0-8.284 6.716-13 15-13s15 4.716 15 13" stroke="var(--ink-3)" strokeWidth="2.5" strokeLinecap="round" opacity="0.6"/>
                        </svg>
                      </div>
                  }
                </div>
                <div className="profile-meta">
                  <p className="profile-name">{user?.name || "Quick feeler mode"}</p>
                  {user?.email && <p className="profile-email">{user.email}</p>}
                </div>
              </div>
            </div>

            <div className={`ls${loadingLine === 1 || loadingLine === 2 ? " ls-active" : loadingLine > 2 ? " ls-done" : ""}`}>
              <div className="ls-moods">
                {selectedMoodObjects.slice(0, 3).map((mood, i) => (
                  <div className={`lcard lcard-${i}`} key={mood.id}>
                    <img src={mood.img} alt="" />
                    <div className="lcard-ov" />
                    <span className="lcard-lbl">{mood.title}</span>
                  </div>
                ))}
                <div className="lspills">
                  {[...selectedMoodObjects.map(m => m.title), diet, planFor].filter(Boolean).map((label, i) => (
                    <span className={`lspill lspill-${i}`} key={label}>{label}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className={`ls${loadingLine === 3 ? " ls-active" : loadingLine > 3 ? " ls-done" : ""}`}>
              <div className="ls-map">
                <div className="map-dest-label">{destination}</div>
                <div className="map-sketch">
                  <svg viewBox="0 0 420 155" xmlns="http://www.w3.org/2000/svg" className="map-svg">
                    <path d="M 0 95 Q 60 88 110 98 Q 160 108 200 100 Q 260 90 300 96 Q 360 104 420 98" fill="none" stroke="rgba(51,153,137,.18)" strokeWidth="8" strokeLinecap="round"/>
                    <circle cx="50" cy="60" r="10" fill="rgba(51,153,137,.12)"/>
                    <circle cx="62" cy="54" r="8" fill="rgba(51,153,137,.1)"/>
                    <circle cx="150" cy="130" r="9" fill="rgba(51,153,137,.1)"/>
                    <circle cx="163" cy="136" r="7" fill="rgba(51,153,137,.08)"/>
                    <circle cx="360" cy="110" r="11" fill="rgba(51,153,137,.1)"/>
                    <circle cx="374" cy="116" r="8" fill="rgba(51,153,137,.08)"/>
                    <line x1="0" y1="50" x2="420" y2="50" stroke="rgba(0,0,0,.04)" strokeWidth="1"/>
                    <line x1="0" y1="100" x2="420" y2="100" stroke="rgba(0,0,0,.04)" strokeWidth="1"/>
                    <line x1="105" y1="0" x2="105" y2="155" stroke="rgba(0,0,0,.04)" strokeWidth="1"/>
                    <line x1="210" y1="0" x2="210" y2="155" stroke="rgba(0,0,0,.04)" strokeWidth="1"/>
                    <line x1="315" y1="0" x2="315" y2="155" stroke="rgba(0,0,0,.04)" strokeWidth="1"/>
                    <line className="map-line ml1" x1="80" y1="118" x2="185" y2="62"/>
                    <line className="map-line ml2" x1="185" y1="62" x2="275" y2="85"/>
                    <line className="map-line ml3" x1="275" y1="85" x2="345" y2="42"/>
                    <circle className="map-dot md1" cx="80" cy="118" r="6"/>
                    <circle className="map-dot md2" cx="185" cy="62" r="6"/>
                    <circle className="map-dot md3" cx="275" cy="85" r="6"/>
                    <circle className="map-dot md4" cx="345" cy="42" r="6"/>
                    <circle className="map-traveller" cx="80" cy="118" r="9" fill="none" stroke="var(--accent)" strokeWidth="2" opacity="0.6"/>
                    <circle className="map-traveller-dot" cx="80" cy="118" r="4" fill="var(--accent)"/>
                  </svg>
                </div>
              </div>
            </div>

            <div className={`ls${loadingLine === 4 ? " ls-active" : loadingLine > 4 ? " ls-done" : ""}`}>
              <div className="ls-places-chips">
                <p className="places-chips-label">Scanning Google Places for {destination}</p>
                <div className="places-chips-wrap">
                  {(placesPhotos.length
                    ? placesPhotos.map(p => p.name)
                    : selectedMoodObjects.map(m => `${destination} ${m.title}`)
                  ).map((name, i) => {
                    const clean = name.split(",")[0].trim();
                    const rating = (4.1 + i * 0.15).toFixed(1);
                    return (
                      <div className={`place-chip pc-anim-${i}`} key={i}>
                        <span className="place-chip-name">{clean}</span>
                        <span className="place-chip-rating">★ {rating}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className={`ls${loadingLine >= 5 ? " ls-active" : ""}`}>
              <div className="wire-frame">
                <div className="wire-meta">
                  <div className="wire-tag"/>
                  <div className="wire-title"/>
                </div>
                <div className="wire-stops">
                  {[0,1].map(i => (
                    <div className="wire-stop" key={i}>
                      <div className="wire-dot"/>
                      <div className="wire-lines">
                        <div className="wire-line wl-a" style={{animationDelay:`${i*0.2}s`}}/>
                        <div className="wire-line wl-b" style={{animationDelay:`${i*0.2+0.1}s`}}/>
                      </div>
                      <div className="wire-img" style={{animationDelay:`${i*0.15}s`}}/>
                    </div>
                  ))}
                </div>
                <div className="wire-gemini-badge">
                  <span className="gorb-core-sm">✦</span>
                  <span>Gemini writing your plan…</span>
                </div>
              </div>
            </div>
          </div>

          <div className="loader-bottom">
            <div className="loader-list">
              {loadingItems.map((item, i) => (
                <div key={item} className={`loader-item${i < loadingLine ? " li-done" : ""}${i === loadingLine ? " li-active" : ""}`}>
                  <span className="li-dot" />
                  <span className="li-text">{item}</span>
                  {i < loadingLine && <span className="li-badge">Done</span>}
                </div>
              ))}
            </div>
            <div className="loader-bar-track">
              <div className="loader-bar-fill" style={{ width: `${Math.round(((loadingLine + 1) / loadingItems.length) * 100)}%` }} />
            </div>
            <p className="loader-pct">{Math.round(((loadingLine + 1) / loadingItems.length) * 100)}% complete</p>
          </div>
        </main>
      )}

      {step === "apiError" && (
        <main className="screen loading-screen on">
          <div className="api-error-card">
            <p className="label">Travel DNA preview</p>
            <h2>Live planning is taking a short pause.</h2>
            <p>The prototype could not finish a fresh plan right now. Review your setup or try again in a moment.</p>
            <div className="error-actions">
              <button className="btn-outline" onClick={() => goTo("setup")}>Edit setup</button>
              <button className="btn-accent" onClick={generatePlan}>Try Gemini again ✦</button>
            </div>
          </div>
        </main>
      )}

      {step === "result" && (
        <main className="result-screen on">
          {/* ── RESULT HERO with frosted glass overlay ── */}
          <section className="res-hero">
            {/* Background image — full bleed, slightly zoomed */}
            <img
              className="res-bg-img"
              src={itinerary?.heroImageUrl || selectedMoodObjects[0]?.img || moodVibes[0].img}
              alt=""
            />

            {/* Frosted glass content panel */}
            <div className="res-glass-panel">
              {/* Top row: archetype tag line + date */}
              <div className="res-glass-top">
                <p className="archetype-line">{travelArchetype.line}</p>
                <span className="res-date-tag">{itinerary?.dates || prettyDate(date)}</span>
              </div>

              {/* Destination name — single line, ellipsis on overflow */}
              <h2 className="res-dest">{itinerary?.destination || destination}</h2>

              {/* Summary */}
              {itinerary?.summary && (
                <p className="res-summary">{itinerary.summary}</p>
              )}

              {itinerary?.generatedBy === "fallback" && (
                <div className="fallback-banner">
                  <span>Preview mode</span>
                  <p>Live planning is temporarily capped, so Travel DNA is showing a designed preview while place details continue to enrich.</p>
                  <button type="button" onClick={() => setShowSubscribe(true)}>Like this idea? Get updates</button>
                </div>
              )}
            </div>
          </section>

          <section className="action-bar">
            <button className="btn-outline" onClick={() => goTo("setup")}>Edit setup</button>
            <button className="btn-outline" onClick={generatePlan}>Regenerate</button>
            {tripMapsUrl && (
              <a className="btn-accent maps-trip-btn" href={tripMapsUrl} target="_blank" rel="noreferrer">Open trip in Google Maps</a>
            )}
            <button
              className={`btn-outline share-btn${shareCopied ? " share-btn-copied" : ""}`}
              onClick={() => {
                const url = window.location.href;
                if (navigator.share) {
                  navigator.share({ title: `Travel DNA — ${itinerary?.destination || destination}`, text: itinerary?.summary || "Check out this itinerary.", url });
                } else {
                  navigator.clipboard.writeText(url).then(() => {
                    setShareCopied(true);
                    setTimeout(() => setShareCopied(false), 2200);
                  });
                }
              }}
              title="Share itinerary"
            >
              {shareCopied ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8l3.5 3.5L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="12" cy="3" r="1.75" stroke="currentColor" strokeWidth="1.5"/><circle cx="12" cy="13" r="1.75" stroke="currentColor" strokeWidth="1.5"/><circle cx="4" cy="8" r="1.75" stroke="currentColor" strokeWidth="1.5"/><line x1="10.28" y1="4.07" x2="5.72" y2="6.93" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="5.72" y1="9.07" x2="10.28" y2="11.93" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              )}
              <span>{shareCopied ? "Copied!" : "Share"}</span>
            </button>
          </section>

          <section className="timeline">
            <p className="label">Today's flow</p>
            {(itinerary?.stops || []).map((stop, i) => (
              <article className="stop" key={`${stop.name}-${i}`}>
                <div className={i === 0 ? "s-pin s-pin-featured" : "s-pin"}>
                  <span className="s-pin-index">{String(i + 1).padStart(2, "0")}</span>
                </div>
                <div className="s-body">
                  <p className="s-cat">{stop.category}</p>
                  <h3>{stop.time} <span>{stop.period}</span></h3>
                  <h4>{stop.name}</h4>
                  <div className="place-meta prominent">
                    {stop.rating && (
                      <a className="rating-pill" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stop.googlePlaceName || stop.name)}`} target="_blank" rel="noreferrer">★ {stop.rating}{stop.userRatingCount ? ` · ${stop.userRatingCount.toLocaleString()} reviews` : ""}</a>
                    )}
                    {stop.openNow !== undefined && <span>{stop.openNow ? "Open now" : "Hours vary"}</span>}
                    {stop.address && (
                      <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stop.address)}`} target="_blank" rel="noreferrer">{stop.address}</a>
                    )}
                    {!stop.rating && stop.placesStatus !== "google-places" && <span className="demo-pill">Places details unavailable in fallback</span>}
                  </div>
                  <p>{stop.description}</p>
                  <div className="s-photo">
                    <img src={stop.imageUrl || stop.photoUrl || selectedMoodObjects[i % Math.max(selectedMoodObjects.length, 1)]?.img || moodVibes[i % moodVibes.length].img} alt={stop.name} loading="lazy" />
                    <div className="s-photo-ov" />
                    <span>{stop.googlePlaceName || stop.address || stop.category || stop.name}</span>
                  </div>
                  <small>{stop.routeFromPrevious}</small>
                </div>
              </article>
            ))}
          </section>
        </main>
      )}

      {showSubscribe && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="subscribe-modal glass-panel">
            <button className="modal-close" type="button" onClick={() => { setShowSubscribe(false); setSubscribeSaved(false); }}>×</button>
            <div className="spark">✦</div>
            <p className="label">Early access</p>
            <h2>Like this idea?</h2>
            <p>Travel DNA is running in demo mode right now. Gemini API credits are limited, so fallback plans keep the experience alive while the product evolves.</p>
            <p>Subscribe to get updates when live personalization, better Google Places photos, saved preferences, and richer planning are ready.</p>
            <form className="subscribe-form" onSubmit={(event) => {
              event.preventDefault();
              if (!subscribeEmail.trim()) return;
              const existing = JSON.parse(localStorage.getItem("travelDnaSubscribers") || "[]");
              localStorage.setItem("travelDnaSubscribers", JSON.stringify([...existing, subscribeEmail.trim()]));
              setSubscribeSaved(true);
            }}>
              <input type="email" placeholder="you@example.com" value={subscribeEmail} onChange={(event) => setSubscribeEmail(event.target.value)} required />
              <button className="btn-accent" type="submit">Keep me updated</button>
            </form>
            {subscribeSaved && <div className="subscribe-success">You're on the list. For now this is saved locally for the prototype.</div>}
          </div>
        </div>
      )}
    </div>
  );
}

function Select({ label, value, setValue, options }) {
  return (
    <div className="field-block">
      <p className="field-label">{label}</p>
      <div className="chips">
        {options.map((option) => (
          <button type="button" className={value === option ? "chip active" : "chip"} onClick={() => setValue(option)} key={option}>{option}</button>
        ))}
      </div>
    </div>
  );
}

const css = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;0,9..40,900;1,9..40,400&family=DM+Serif+Display:ital@0;1&display=swap');

html, body, #root {
  width: 100%; min-height: 100%;
  max-width: none !important; margin: 0 !important; padding: 0 !important; text-align: left !important;
}
*, *::before, *::after { box-sizing: border-box; }

:root {
  --bg: #ECEAE3;
  --surface: #E4E2DA;
  --surface-2: #DAD8D0;
  --surface-3: #D0CEC6;
  --panel: #E3E1D9;
  --panel-2: #D9D7CF;
  --panel-3: #F5F4EF;
  --line: rgba(0,0,0,.08);
  --line-strong: rgba(0,0,0,.14);
  --ink: #080808;
  --ink-2: #3A3A38;
  --ink-3: #8A897F;
  --accent: #339989;
  --gold: #339989;
  --gold-bright: #339989;
  --gold-line: rgba(51,153,137,.35);
  --ease: cubic-bezier(.2,.8,.2,1);
}

body {
  font-family: 'DM Sans', system-ui, sans-serif;
  background: var(--bg); color: var(--ink);
  overflow-x: hidden; -webkit-font-smoothing: antialiased;
}
button, input { font: inherit; }
button { cursor: pointer; }

.app-shell {
  min-height: 100vh; display: flex; flex-direction: column; align-items: center;
  padding: 0 0 80px; background: var(--bg); overflow-x: hidden;
}
.stars, .aurora { display: none !important; }

/* ── NAVBAR ── */
.navbar {
  position: sticky; top: 0; z-index: 999;
  width: 100%; height: 68px;
  padding: 0 clamp(24px, 4vw, 56px);
  display: flex; align-items: center; justify-content: space-between;
  background: var(--bg);
}
.navbar::before { display: none; }
.nav-steps, .nav-actions, .error-actions { display: flex; align-items: center; gap: 6px; }

/* Desktop nav — hidden on mobile */
.nav-desktop { display: flex; align-items: center; gap: 6px; }
.nav-steps { display: flex; align-items: center; gap: 6px; }
.nav-steps i { display: none; }
.nav-steps button {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 6px 12px; border: none;
  border-radius: 999px; background: transparent;
  font-size: 13px; font-weight: 500; color: var(--ink-3);
  letter-spacing: -.01em; transition: background .15s, color .15s;
}
.nav-steps button::before {
  content: "";
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--line-strong); flex-shrink: 0;
  transition: background .2s;
}
.nav-steps button:hover:not(:disabled) { background: var(--surface-2); color: var(--ink-2); }
.nav-steps button.active { background: transparent; color: var(--accent); }
.nav-steps button.active::before { background: var(--accent); }
.nav-steps button.done { color: var(--ink-2); }
.nav-steps button.done::before { background: var(--ink); }
.nav-steps button:disabled { opacity: .3; cursor: not-allowed; }

/* Mobile nav — hidden on desktop */
.nav-mobile { display: none; width: 100%; align-items: center; justify-content: space-between; }
.nav-logo { font-family: 'DM Serif Display', Georgia, serif; font-size: 18px; font-weight: 400; color: var(--ink); letter-spacing: -.02em; }

/* Hamburger button */
.hamburger {
  display: flex; flex-direction: column; justify-content: center; align-items: center;
  gap: 5px; width: 40px; height: 40px;
  background: transparent; border: 1px solid var(--line-strong); border-radius: 10px;
  padding: 0; cursor: pointer; transition: background .15s;
}
.hamburger:hover { background: var(--surface-2); }
.hamburger span {
  display: block; width: 18px; height: 1.5px;
  background: var(--ink); border-radius: 2px;
  transition: transform .25s var(--ease), opacity .2s;
  transform-origin: center;
}
.hamburger-open span:nth-child(1) { transform: translateY(6.5px) rotate(45deg); }
.hamburger-open span:nth-child(2) { opacity: 0; transform: scaleX(0); }
.hamburger-open span:nth-child(3) { transform: translateY(-6.5px) rotate(-45deg); }

/* Mobile drawer */
.mobile-drawer {
  position: fixed; inset: 0; z-index: 998;
  background: rgba(0,0,0,.32); backdrop-filter: blur(4px);
  animation: drawerBgIn .2s ease both;
}
@keyframes drawerBgIn { from { opacity: 0; } to { opacity: 1; } }
.mobile-drawer-inner {
  position: absolute; top: 68px; right: 0; left: 0;
  background: var(--bg); border-bottom: 1px solid var(--line-strong);
  padding: 12px 20px 24px;
  display: flex; flex-direction: column; gap: 4px;
  animation: drawerSlideIn .25s var(--ease) both;
}
@keyframes drawerSlideIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
.mobile-drawer-label { font-size: 10px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--ink-3); padding: 4px 0 10px; margin: 0; }
.drawer-item {
  display: flex; align-items: center; gap: 12px;
  width: 100%; padding: 14px 16px;
  background: transparent; border: none; border-radius: 12px;
  font-size: 15px; font-weight: 600; color: var(--ink-2);
  text-align: left; transition: background .15s, color .15s;
}
.drawer-item:hover:not(:disabled) { background: var(--surface-2); color: var(--ink); }
.drawer-item-active { color: var(--accent) !important; background: rgba(51,153,137,.07) !important; }
.drawer-item-done { color: var(--ink); }
.drawer-item-disabled { opacity: .35; cursor: not-allowed; }
.drawer-dot {
  width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
  background: var(--surface-3); border: 1.5px solid var(--line-strong);
}
.drawer-item-active .drawer-dot { background: var(--accent); border-color: var(--accent); }
.drawer-item-done .drawer-dot { background: var(--ink); border-color: var(--ink); }
.drawer-check { margin-left: auto; font-size: 11px; font-weight: 800; color: var(--accent); }
.drawer-subscribe { margin-top: 12px; width: 100%; justify-content: center; min-height: 48px !important; font-size: 14px !important; }

/* ── BUTTONS ── */
.btn-outline, .btn-accent { border-radius: 999px; font-weight: 700; font-size: 13px; transition: opacity .15s, background .15s; }
.btn-outline {
  display: inline-flex; align-items: center; justify-content: center; gap: 7px;
  min-height: 50px; padding: 0 24px;
  background: transparent; border: 1.5px solid var(--ink); color: var(--ink); text-decoration: none;
}
.btn-outline:hover { background: var(--ink); color: #fff; border-color: var(--ink); }
.btn-accent {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  min-height: 50px; padding: 0 26px;
  background: var(--ink); color: #fff; border: 1px solid var(--ink); font-weight: 800;
}
.btn-accent:hover { opacity: .88; }
.btn-accent:active { transform: scale(.98); }
.btn-accent, .btn-outline { text-decoration: none !important; }
.nav-subscribe { min-height: 44px !important; padding: 0 24px !important; font-size: 13px; background: var(--ink) !important; border: 1.5px solid var(--ink) !important; color: #fff !important; font-weight: 700 !important; }
.nav-subscribe:hover { background: #222 !important; border-color: #222 !important; opacity: 1 !important; }

/* ── SCREENS ── */
.screen { display: block; width: 100%; max-width: 1160px; padding: clamp(40px,6vw,82px) clamp(20px,4vw,56px); animation: scIn .3s var(--ease) both; }
@keyframes scIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

/* ── TYPE ── */
.label, .field-label { font-size: 11px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--ink-3); }
h1, h2 { font-family: 'DM Serif Display', Georgia, serif; color: var(--ink); }
h1 { font-size: clamp(46px,6.2vw,82px) !important; font-weight: 400; line-height: 1.05; letter-spacing: -.02em !important; margin: 0; max-width: 840px; }
h2 { font-size: clamp(36px,4.5vw,60px); font-weight: 400; line-height: 1.1; letter-spacing: -.015em; margin: 10px 0 10px; }
p { font-size: 16px; line-height: 1.72; color: var(--ink-2); }
.gem, h1 span { color: var(--accent) !important; background: none !important; -webkit-text-fill-color: currentColor !important; }
.glass-panel { background: var(--surface); border: 1px solid var(--line-strong); box-shadow: none; }

/* ── HERO ── */
.hero-screen { padding-top: clamp(64px,8vw,110px); }
.hero-inner { display: grid; grid-template-columns: minmax(0,1.05fr) minmax(360px,520px); gap: clamp(42px,7vw,96px); align-items: center; min-height: 68vh; }
.hero-left { display: flex; flex-direction: column; gap: 28px; }
.hero-pill { display: inline-flex; align-items: center; gap: 0; background: none; border: none; padding: 0; }
.pulse { display: none; }
.hero-pill span { font-size: 11px; font-weight: 700; color: var(--ink-3); letter-spacing: .1em; text-transform: uppercase; }
.hero-left > p { max-width: 620px; font-size: clamp(17px,1.35vw,20px); line-height: 1.6; color: var(--ink-2); }
.hero-cta { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.google-wrap { min-height: 44px; display: inline-flex; align-items: center; border-radius: 999px; overflow: hidden; background: transparent; border: none; }
.google-wrap iframe { border-radius: 999px !important; }
#googleSignIn, #googleSignIn > div { border-radius: 999px !important; background: transparent !important; }
.google-loading { color: var(--ink-3); font-size: 13px; font-weight: 700; padding: 0 16px; }
.hero-cta > .btn-accent { background: transparent !important; color: var(--ink) !important; border: 1.5px solid var(--ink) !important; }
.hero-cta > .btn-accent:hover { background: var(--ink) !important; color: #fff !important; opacity: 1 !important; }

/* ── SHOWREEL ── */
.hero-cards.itinerary-showreel { height: 500px !important; display: flex !important; align-items: center; justify-content: center; }
.showreel-frame { position: relative; width: min(560px,100%); height: 440px; border-radius: 34px; overflow: hidden; border: 1px solid var(--line-strong); background: var(--surface); }
.showreel-image-stack { position: absolute; inset: 0; }
.reel-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0; transform: scale(1.04); animation: reelFade 9s infinite; filter: brightness(.92) saturate(1.08); }
.reel-img-1 { animation-delay: 0s; } .reel-img-2 { animation-delay: 3s; } .reel-img-3 { animation-delay: 6s; }
@keyframes reelFade { 0% { opacity:0; transform:scale(1.04); } 8% { opacity:1; transform:scale(1); } 30% { opacity:1; transform:scale(1.025); } 38% { opacity:0; transform:scale(1.05); } 100% { opacity:0; transform:scale(1.05); } }
.showreel-overlay { position: absolute; inset: 0; background: linear-gradient(180deg,rgba(0,0,0,.02),rgba(0,0,0,.30)),linear-gradient(90deg,rgba(0,0,0,.18),rgba(0,0,0,.02)); }
.showreel-copy { display: none !important; }
.generation-chip { display: none !important; }
.itinerary-lines { position: absolute; left: 24px; right: 24px; bottom: 24px; z-index: 2; display: grid; gap: 8px; }
.itinerary-line { display: grid; grid-template-columns: 72px 1fr; gap: 12px; align-items: center; min-height: 54px; padding: 10px 13px; border-radius: 18px; background: rgba(244,243,238,.92); border: 1px solid rgba(255,255,255,.62); opacity: 0; transform: translateY(12px); animation: lineBuild 9s infinite; }
.line-1 { animation-delay:.55s; } .line-2 { animation-delay:1.25s; } .line-3 { animation-delay:1.95s; }
@keyframes lineBuild { 0%,4% { opacity:0; transform:translateY(12px); } 10%,74% { opacity:1; transform:translateY(0); } 82%,100% { opacity:0; transform:translateY(-6px); } }
.itinerary-line b, .itinerary-line span { color: var(--ink) !important; font-size: 13px; font-weight: 700; }
.itinerary-line b { color: var(--accent) !important; font-weight: 800; }

/* ── SETUP ── */
.setup-header, .mood-header { margin-bottom: 30px; max-width: 540px; }
.form-shell { max-width: 640px; border-radius: 0; background: transparent !important; border: 0 !important; padding: 0 !important; display: grid; gap: 28px; }
label { display: grid; gap: 14px; font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--ink-3); }
input { width: 100%; background: var(--panel-2); border: 1px solid var(--line-strong); border-radius: 24px; min-height: 64px; padding: 0 24px; font-size: 15px; font-weight: 500; color: var(--ink); outline: none; transition: border-color .15s, background .15s; }
input:focus { border-color: rgba(0,0,0,.26); background: var(--panel-3); }
input::placeholder { color: var(--ink-3); }
input[type="date"] { color-scheme: light; }
/* Date input: never overflow on narrow screens */
input[type="date"] { min-width: 0; width: 100%; appearance: none; -webkit-appearance: none; }
.suggestions, .chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 6px; justify-content: flex-start; }
.suggestion, .chip { padding: 8px 16px; background: transparent; border: 2px solid var(--gold); border-radius: 999px; font-size: 13px; font-weight: 600; color: var(--gold); transition: background .15s, color .15s, border-color .15s; text-align: left; }
.suggestion:hover, .chip:hover { background: var(--gold); color: #fff; border-color: var(--gold); }
.suggestion.active, .chip.active { background: var(--gold); border-color: var(--gold); color: #fff; font-weight: 700; }
.autocomplete-loading { display: inline-flex; align-items: center; padding: 8px 12px; color: var(--ink-3); font-size: 12px; font-weight: 700; }
.field-block { display: grid; gap: 8px; }
.pi-card { padding: 24px; border-radius: 24px; background: var(--panel); border: 1px solid var(--line-strong); }
.spark { width: 28px; height: 28px; background: rgba(51,153,137,.1); color: var(--accent); border: 1px solid rgba(51,153,137,.2); border-radius: 8px; display: grid; place-items: center; margin-bottom: 12px; font-size: 13px; }
.pi-card h3 { font-size: 15px; font-weight: 800; color: var(--ink); margin: 6px 0 6px; letter-spacing: -.02em; }
.pi-card p { font-size: 13px; color: var(--ink-3); line-height: 1.6; margin: 0; }
.profile-chip { display: inline-flex; align-items: center; gap: 8px; margin-top: 12px; padding: 7px 12px; border-radius: 10px; background: var(--surface-3); color: var(--ink-2); font-size: 12px; font-weight: 700; border: 1px solid var(--line-strong); }
.profile-chip img { width: 22px; height: 22px; border-radius: 50%; }
.primary-wide { width: fit-content; }

/* ── MOOD GRID ── */
.mood-screen { max-width: 1240px; }
.mood-grid.image-grid { display: grid !important; grid-template-columns: repeat(3,minmax(0,1fr)) !important; gap: 14px !important; width: 100% !important; }
.image-mood-tile { position: relative; overflow: hidden; border: 4px solid transparent !important; border-radius: 28px !important; padding: 0; text-align: left; background: var(--surface); height: 220px !important; min-height: 220px !important; transition: border-color .15s; box-shadow: none; }
.image-mood-tile:hover { border-color: var(--line-strong) !important; }
.image-mood-tile.active { border-color: var(--gold-bright) !important; box-shadow: 0 0 0 1px var(--gold-bright) !important; }
.image-mood-tile img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; filter: brightness(.86) saturate(1.08); transition: transform .4s var(--ease); }
.image-mood-tile:hover img, .image-mood-tile.active img { transform: scale(1.03); }
.image-tile-overlay { position: absolute; inset: 0; background: linear-gradient(to top,rgba(0,0,0,.48),rgba(0,0,0,.04) 68%); }
.tile-number { position: absolute; left: 16px; top: 16px; z-index: 2; font-size: 11px; letter-spacing: .1em; font-weight: 800; color: rgba(255,255,255,.45); }
.image-tile-content { position: absolute; left: 16px; right: 16px; bottom: 16px; z-index: 2; }
.image-tile-content strong { display: block; font-size: clamp(18px,1.8vw,24px); font-weight: 900; line-height: 1; letter-spacing: -.03em; color: #fff; }
.image-tile-content p { margin: 6px 0 0; color: rgba(255,255,255,.6); font-size: 12px; font-weight: 600; line-height: 1.3; }
.build-cta-row { margin: 34px 0 0; display: flex; justify-content: flex-end; }

/* ── LOADING SCREEN ── */
.loading-screen {
  width: 100%; min-height: calc(100vh - 68px);
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 20px;
  padding: 24px clamp(20px,4vw,56px) 32px;
  animation: scIn .3s var(--ease) both;
  overflow: hidden;
}

.loader-stage {
  position: relative;
  width: min(460px, 100%);
  height: 200px;
  flex-shrink: 0;
  overflow: hidden;
}

.ls {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  opacity: 0; pointer-events: none;
  transition: opacity .6s var(--ease);
  overflow: hidden;
}
.ls.ls-active { opacity: 1; pointer-events: auto; }
.ls.ls-done { opacity: 0; }

/* Stage 0: Profile */
.ls-profile { display: flex; flex-direction: column; align-items: center; gap: 18px; }
.profile-ring-wrap { position: relative; width: 110px; height: 110px; }
.profile-ring-svg { position: absolute; inset: 0; width: 100%; height: 100%; transform: rotate(-90deg); }
.ring-bg { fill: none; stroke: var(--surface-2); stroke-width: 4; }
.ring-fill { fill: none; stroke: var(--accent); stroke-width: 4; stroke-linecap: round; stroke-dasharray: 339; stroke-dashoffset: 339; animation: ringFill 2.2s var(--ease) forwards; }
@keyframes ringFill { to { stroke-dashoffset: 50; } }
.profile-pic { position: absolute; inset: 8px; border-radius: 50%; object-fit: cover; width: calc(100% - 16px); height: calc(100% - 16px); }
.profile-pic-fallback { position: absolute; inset: 8px; border-radius: 50%; background: var(--surface-2); display: flex; align-items: center; justify-content: center; }
.profile-pic-fallback span { font-size: 32px; font-weight: 800; color: var(--ink-3); }

/* Share button */
.share-btn { gap: 7px; min-width: 100px; }
.share-btn svg { flex-shrink: 0; }
.share-btn-copied { border-color: var(--accent) !important; color: var(--accent) !important; }
.profile-meta { text-align: center; }
.profile-name { font-size: 16px; font-weight: 700; color: var(--ink); margin: 0; line-height: 1.3; }
.profile-email { font-size: 12px; color: var(--ink-3); margin: 3px 0 0; }

/* Stage 1–2: Mood cards */
.ls-moods { position: relative; width: 100%; height: 100%; overflow: hidden; }
.lcard { position: absolute; border-radius: 18px; overflow: hidden; border: 1px solid var(--line-strong); }
.lcard img { width: 100%; height: 100%; object-fit: cover; filter: brightness(.58) saturate(.8); }
.lcard-ov { position: absolute; inset: 0; background: linear-gradient(to top,rgba(0,0,0,.65),transparent 55%); }
.lcard-lbl { position: absolute; bottom: 10px; left: 12px; font-size: 12px; font-weight: 800; color: #fff; }
.lcard-0 { width: 138px; height: 100px; left: 10px; top: 28px; animation: lc0 3.6s ease-in-out infinite; z-index: 1; opacity: 1; }
.lcard-1 { width: 172px; height: 130px; left: 50%; top: 10px; animation: lc1 3.6s ease-in-out infinite; transform: translateX(-50%); z-index: 3; opacity: 1; }
.lcard-2 { width: 132px; height: 98px; right: 10px; top: 32px; animation: lc2 3.6s ease-in-out infinite; z-index: 1; opacity: 1; }
@keyframes lc0 { 0% { transform: translate(0,0) rotate(0deg) scale(1); opacity:1; z-index:3; } 15% { transform: translate(-90px,-20px) rotate(-18deg) scale(.88); opacity:1; z-index:1; } 40% { transform: translate(-90px,-20px) rotate(-18deg) scale(.88); opacity:1; z-index:1; } 70% { transform: translate(0,0) rotate(-3deg) scale(1); opacity:1; z-index:1; } 100% { transform: translate(0,0) rotate(-3deg) scale(1); opacity:1; z-index:1; } }
@keyframes lc1 { 0% { transform: translateX(-50%) translateY(0) scale(1.05); opacity:1; z-index:2; } 25% { transform: translateX(-50%) translateY(-12px) scale(1.08); opacity:1; z-index:4; } 60% { transform: translateX(-50%) translateY(0) scale(1); opacity:1; z-index:3; } 100% { transform: translateX(-50%) translateY(0) scale(1); opacity:1; z-index:3; } }
@keyframes lc2 { 0% { transform: translate(0,0) rotate(0deg) scale(1); opacity:1; z-index:3; } 20% { transform: translate(90px,-20px) rotate(18deg) scale(.88); opacity:1; z-index:1; } 50% { transform: translate(90px,-20px) rotate(18deg) scale(.88); opacity:1; z-index:1; } 80% { transform: translate(0,0) rotate(3deg) scale(1); opacity:1; z-index:1; } 100% { transform: translate(0,0) rotate(3deg) scale(1); opacity:1; z-index:1; } }
.lspills { position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); display: flex; gap: 6px; z-index: 10; flex-wrap: nowrap; }
.lspill { padding: 6px 13px; border-radius: 999px; background: var(--bg); border: 1px solid var(--line-strong); font-size: 11px; font-weight: 700; color: var(--ink-2); white-space: nowrap; opacity: 0; transform: translateY(10px); animation: spillIn 2.2s var(--ease) forwards; }
.lspill-0 { animation-delay: .4s; }
.lspill-1 { animation-delay: .65s; background: var(--ink); color: var(--bg); border-color: var(--ink); }
.lspill-2 { animation-delay: .9s; background: var(--ink); color: var(--bg); border-color: var(--ink); }
.lspill-3 { animation-delay: 1.1s; }
.lspill-4 { animation-delay: 1.3s; }
@keyframes spillIn { 0% { opacity:0; transform:translateY(10px); } 60%,100% { opacity:1; transform:translateY(0); } }

/* Stage 3: Map */
.ls-map { display: flex; flex-direction: column; align-items: center; gap: 8px; width: 100%; }
.map-dest-label { font-size: 11px; font-weight: 700; color: var(--ink-3); text-transform: uppercase; letter-spacing: .08em; }
.map-sketch { width: 100%; border-radius: 14px; background: var(--surface); border: 1px solid var(--line-strong); padding: 8px; overflow: hidden; }
.map-svg { width: 100%; height: 155px; }
.map-line { stroke: var(--accent); stroke-width: 2; stroke-linecap: round; stroke-dasharray: 300; stroke-dashoffset: 300; animation: drawLine 0.7s var(--ease) forwards; opacity: 0.7; }
.ml1 { animation-delay: 0.3s; } .ml2 { animation-delay: 1.1s; } .ml3 { animation-delay: 1.9s; }
@keyframes drawLine { to { stroke-dashoffset: 0; } }
.map-dot { fill: var(--accent); opacity: 0; animation: dotPop .35s var(--ease) forwards; }
.md1 { animation-delay: 0.1s; } .md2 { animation-delay: 0.9s; } .md3 { animation-delay: 1.7s; } .md4 { animation-delay: 2.5s; }
@keyframes dotPop { 0% { opacity:0; transform:scale(0); } 70% { opacity:1; transform:scale(1.3); } 100% { opacity:1; transform:scale(1); } }
.map-traveller { animation: travelPulse 1s ease-in-out infinite, travelRoute 3.2s var(--ease) forwards; }
.map-traveller-dot { animation: travelRoute 3.2s var(--ease) forwards; }
@keyframes travelPulse { 0%,100% { r: 9; opacity: .6; } 50% { r: 13; opacity: .2; } }
@keyframes travelRoute { 0% { cx: 80; cy: 118; } 28% { cx: 185; cy: 62; } 56% { cx: 275; cy: 85; } 84%,100% { cx: 345; cy: 42; } }

/* Stage 4: Places chips */
.ls-places-chips { display: flex; flex-direction: column; align-items: center; gap: 16px; width: 100%; padding: 0 8px; }
.places-chips-label { font-size: 11px; font-weight: 700; color: var(--ink-3); text-transform: uppercase; letter-spacing: .08em; margin: 0; }
.places-chips-wrap { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }
.place-chip { display: inline-flex; align-items: center; gap: 8px; padding: 8px 14px; border-radius: 999px; background: var(--surface); border: 1px solid var(--line-strong); opacity: 0; transform: translateY(10px); animation: chipFadeIn .4s var(--ease) forwards; }
.pc-anim-0 { animation-delay: .1s; } .pc-anim-1 { animation-delay: .3s; } .pc-anim-2 { animation-delay: .5s; } .pc-anim-3 { animation-delay: .7s; } .pc-anim-4 { animation-delay: .9s; }
@keyframes chipFadeIn { to { opacity: 1; transform: translateY(0); } }
.place-chip-name { font-size: 13px; font-weight: 600; color: var(--ink); }
.place-chip-rating { font-size: 11px; font-weight: 800; color: var(--accent); }

/* Carousel (kept) */
.places-carousel { position: relative; width: min(340px, 100%); height: 220px; overflow: hidden; border-radius: 18px; }
.pc-slide { position: absolute; inset: 0; border-radius: 18px; overflow: hidden; border: 1px solid var(--line-strong); opacity: 0; transition: opacity .5s var(--ease); }
.pc-slide.pc-active { opacity: 1; z-index: 2; } .pc-slide.pc-prev { opacity: 0; z-index: 1; }
.pc-slide img { width:100%; height:100%; object-fit:cover; filter:brightness(.6) saturate(.8); }
.pc-ov { position:absolute; inset:0; background:linear-gradient(to top,rgba(0,0,0,.7),transparent 50%); }
.pc-meta { position: absolute; bottom: 14px; left: 16px; right: 16px; display: flex; flex-direction: column; gap: 8px; }
.pc-name { font-size: 18px; font-weight: 800; color: #fff; letter-spacing: -.02em; line-height: 1.1; }
.pc-chips { display: flex; gap: 6px; flex-wrap: wrap; }
.pc-rating-chip { padding: 4px 10px; border-radius: 999px; background: var(--accent); color: var(--ink); font-size: 11px; font-weight: 800; white-space: nowrap; }
.pc-type-chip { padding: 4px 10px; border-radius: 999px; background: rgba(255,255,255,.2); color: #fff; font-size: 11px; font-weight: 600; white-space: nowrap; }
.pc-dots { position: absolute; bottom: -20px; left: 50%; transform: translateX(-50%); display: flex; gap: 5px; }
.pc-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--surface-3); transition: background .3s; }
.pc-dot.pc-dot-active { background: var(--ink); }

/* Stage 6: Wireframe */
.wire-frame { width: min(400px,100%); border-radius: 12px; border: 1px solid var(--line-strong); background: var(--surface); padding: 9px; display: flex; flex-direction: column; gap: 5px; }
.wire-meta { display: flex; flex-direction: column; gap: 5px; }
.wire-tag { height: 9px; width: 55px; border-radius: 999px; }
.wire-title { height: 16px; width: 68%; border-radius: 6px; }
.wire-stops { display: flex; flex-direction: column; gap: 5px; }
.wire-stop { display: flex; align-items: center; gap: 7px; }
.wire-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); flex-shrink: 0; }
.wire-lines { flex: 1; display: flex; flex-direction: column; gap: 3px; }
.wire-line { height: 6px; border-radius: 3px; }
.wl-a { width: 78%; } .wl-b { width: 52%; }
.wire-img { width: 36px; height: 28px; border-radius: 6px; flex-shrink: 0; }
.wire-tag, .wire-title, .wire-line, .wire-img {
  background-image: linear-gradient(90deg, var(--surface-2) 25%, var(--surface-3) 50%, var(--surface-2) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s ease-in-out infinite;
}
@keyframes shimmer { 0%{background-position:200% 0;} 100%{background-position:-200% 0;} }
.wire-gemini-badge { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 10px; background: rgba(51,153,137,.08); border: 1px solid rgba(51,153,137,.2); font-size: 12px; font-weight: 600; color: var(--accent); }
.gorb-core-sm { font-size: 12px; animation: coreGlow 2s ease-in-out infinite; }
@keyframes coreGlow { 0%,100%{opacity:.5;} 50%{opacity:1;} }

.loader-bottom { display: flex; flex-direction: column; align-items: center; gap: 16px; width: min(460px, 100%); text-align: center; }
.loader-head { display: flex; flex-direction: column; align-items: center; gap: 6px; width: min(460px,100%); text-align: center; }
.loader-headline { font-family: 'DM Serif Display', Georgia, serif; font-size: clamp(26px,3vw,36px) !important; font-weight: 400 !important; letter-spacing: -.02em !important; line-height: 1.05 !important; margin: 0 !important; color: var(--ink) !important; }
.loader-sub { font-size: 12px; font-weight: 500; color: var(--ink-3); margin: 0; line-height: 1.4; }

.loader-list { display: flex; flex-direction: column; width: 100%; }
.loader-item { display: flex; align-items: center; gap: 14px; padding: 9px 0; border-bottom: 1px solid var(--line); opacity: .3; transition: opacity .35s var(--ease); }
.loader-item:last-child { border-bottom: none; }
.loader-item.li-done { opacity: 1; }
.loader-item.li-active { opacity: 1; }
.li-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; background: var(--surface-3); border: 1px solid var(--line-strong); transition: background .3s, border-color .3s; }
.li-done .li-dot { background: var(--accent); border-color: var(--accent); }
.li-active .li-dot { background: var(--accent); border-color: var(--accent); animation: lpulse 1s ease-in-out infinite; }
.li-text { font-size: 14px; font-weight: 600; color: var(--ink-3); flex: 1; text-align: left; transition: color .3s; }
.li-done .li-text { color: var(--ink-2); }
.li-active .li-text { color: var(--ink); font-weight: 700; }
.li-badge { font-size: 10px; font-weight: 800; color: var(--accent); text-transform: uppercase; letter-spacing: .07em; flex-shrink: 0; }
.loader-bar-track { width: 100%; height: 2px; background: var(--surface-2); border-radius: 1px; overflow: hidden; }
.loader-bar-fill { height: 2px; background: var(--ink); border-radius: 1px; transition: width .6s var(--ease); }
.loader-pct { font-size: 11px; font-weight: 700; color: var(--ink-3); text-transform: uppercase; letter-spacing: .08em; margin: 0; }

/* ── ERROR ── */
.api-error-card { width: min(620px,100%); background: var(--surface); border: 1px solid var(--line-strong); border-radius: 20px; padding: 34px; text-align: left; }

/* ══════════════════════════════════════════
   RESULT SCREEN
══════════════════════════════════════════ */
.result-screen {
  max-width: 1280px !important; width: 100% !important;
  padding: 48px clamp(28px,6vw,80px) 80px !important;
  margin: 0 auto;
}

/* ── Hero: full-bleed image + frosted glass panel ── */
.res-hero {
  width: 100%;
  min-height: 480px;
  border-radius: 28px;
  overflow: hidden;
  position: relative;
  background: #0a120e;
  display: flex;
  align-items: flex-end;
}

/* Background image — fills the whole hero, subtle slow zoom */
.res-bg-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 30%;
  filter: brightness(.75) saturate(1.15);
  animation: heroBgZoom 18s ease-in-out infinite alternate;
  will-change: transform;
}
@keyframes heroBgZoom {
  from { transform: scale(1); }
  to   { transform: scale(1.06); }
}

/* Frosted glass panel — sits at the bottom of the hero */
.res-glass-panel {
  position: relative;
  z-index: 2;
  width: 100%;
  padding: clamp(28px,4vw,52px);
  /* Frosted glass */
  background: rgba(8, 8, 8, 0.38);
  backdrop-filter: blur(22px) saturate(1.6);
  -webkit-backdrop-filter: blur(22px) saturate(1.6);
  border-top: 1px solid rgba(255,255,255,0.10);
  /* Animate in */
  animation: glassPanelIn .9s cubic-bezier(.2,.8,.2,1) .15s both;
}
@keyframes glassPanelIn {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Top row inside glass panel */
.res-glass-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
}

/* Archetype tagline */
.archetype-line {
  font-size: 14px !important;
  font-weight: 600 !important;
  color: #5EC4B5 !important;
  line-height: 1.5 !important;
  margin: 0 !important;
  max-width: 520px;
  opacity: 0;
  animation: textSlideUp .6s cubic-bezier(.2,.8,.2,1) .35s forwards;
}

/* Date tag */
.res-date-tag {
  font-size: 12px;
  font-weight: 600;
  color: rgba(255,255,255,0.5);
  white-space: nowrap;
  letter-spacing: .03em;
  padding-top: 2px;
  flex-shrink: 0;
  opacity: 0;
  animation: textFadeIn .5s ease .5s forwards;
}

/* Destination headline — single line, ellipsis, never breaks */
.res-dest {
  font-family: 'DM Serif Display', Georgia, serif;
  font-size: clamp(36px, 5.5vw, 72px);
  font-weight: 400;
  line-height: 1.0;
  letter-spacing: -0.03em;
  color: #ffffff;
  margin: 0 0 14px;
  /* No word-break, ellipsis if truly too long */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  text-shadow: 0 2px 12px rgba(0,0,0,0.28);
  opacity: 0;
  animation: textSlideUp .7s cubic-bezier(.2,.8,.2,1) .55s forwards;
}

/* Summary */
.res-summary {
  font-size: 15px !important;
  line-height: 1.65 !important;
  color: rgba(255,255,255,0.78) !important;
  max-width: 680px;
  margin: 0 !important;
  opacity: 0;
  animation: textSlideUp .6s cubic-bezier(.2,.8,.2,1) .75s forwards;
}

/* Shared text animations */
@keyframes textSlideUp {
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes textFadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

/* ── Action bar ── */
.action-bar {
  display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
  margin: 24px 0 52px;
  background: transparent !important; border: 0 !important; padding: 0 !important;
}

/* ── TIMELINE ── */
.timeline { max-width: 100% !important; margin: 0 auto; padding: 48px 0 90px !important; }
.timeline > .label { margin-bottom: 40px; }
.stop { display: flex; position: relative; margin-bottom: 44px; }
.stop:not(:last-child)::after { content: ""; position: absolute; left: 4px; top: 22px; bottom: -44px; width: 1px; background: var(--line-strong); }

.s-pin {
  width: 10px; height: 10px; border-radius: 50%;
  background: var(--surface-3); border: 2px solid var(--line-strong);
  flex-shrink: 0; margin-right: 28px; margin-top: 10px;
  position: sticky; top: 80px; align-self: flex-start;
  transition: background .3s, border-color .3s;
}
.s-pin-featured { background: var(--accent) !important; border-color: var(--accent) !important; }
.stop:hover .s-pin, .stop:focus-within .s-pin { background: var(--accent); border-color: var(--accent); }
.s-pin-index { display: none; }

.s-body { flex: 1; min-width: 0; display: grid; grid-template-columns: minmax(0,1fr) minmax(300px,440px); column-gap: 40px; align-items: start; }
.s-body > .s-cat, .s-body > h3, .s-body > h4, .s-body > p, .s-body > small, .s-body > .place-meta { grid-column: 1; }
.s-body > .s-photo { grid-column: 2; grid-row: 1 / span 7; }
.s-cat { font-size: 10px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; color: var(--ink-3); margin-bottom: 5px; }
.s-body h3 { font-size: 13px; font-weight: 500; letter-spacing: .04em; color: var(--ink-3); margin: 0 0 6px; text-transform: uppercase; }
.s-body h3 span { font-size: 12px; font-weight: 600; color: var(--ink-3); margin-left: 4px; }
.s-body h4 { font-size: 22px; font-weight: 800; color: var(--ink); margin: 0 0 10px; letter-spacing: -.03em; }
.s-body p { font-size: 14px; line-height: 1.68; color: var(--ink-2); margin-bottom: 14px; }
.s-body small { display: block; color: var(--ink-3); font-size: 12px; line-height: 1.5; }

.s-photo { border-radius: 16px; height: 220px; position: relative; overflow: hidden; margin-bottom: 8px; display: flex; align-items: end; padding: 14px; background: var(--surface-2); border: 1px solid var(--line-strong); }
.s-photo img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: transform .4s var(--ease); }
.s-photo:hover img { transform: scale(1.025); }
.s-photo-ov { position: absolute; inset: 0; background: linear-gradient(to top,rgba(10,10,10,.72),transparent 56%); }
.s-photo span { position: relative; z-index: 1; font-size: 11px; font-weight: 800; color: rgba(255,255,255,.9); background: rgba(10,10,10,.55); padding: 5px 10px; border-radius: 7px; }

.place-meta { display: flex; flex-wrap: wrap; gap: 7px; margin: 8px 0 14px; }
.place-meta span, .place-meta a { display: inline-flex; align-items: center; min-height: 28px; padding: 5px 10px; border-radius: 8px; background: var(--surface-2); border: 1px solid var(--line-strong); color: var(--ink-2); font-size: 12px; font-weight: 600; text-decoration: none; }
.place-meta a { color: var(--ink); font-weight: 700; }
.place-meta .rating-pill { color: var(--accent); border-color: rgba(51,153,137,.3); background: rgba(51,153,137,.1); font-weight: 800; }
.place-meta .demo-pill { color: var(--ink-3); }

.fallback-banner { margin-top: 18px; width: min(760px,100%); border: 1px solid rgba(51,153,137,.25); background: rgba(51,153,137,.07); border-radius: 16px; padding: 16px 18px; }
.fallback-banner span { display: inline-flex; color: var(--accent); font-size: 10px; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; margin-bottom: 6px; }
.fallback-banner p { margin: 0 0 12px; font-size: 13px; line-height: 1.6; color: var(--ink-2); }
.fallback-banner button { border: none; border-radius: 8px; padding: 8px 14px; background: var(--ink); color: var(--accent); font-size: 12px; font-weight: 800; }

/* ── MODAL ── */
.modal-backdrop { position: fixed; inset: 0; z-index: 500; display: grid; place-items: center; padding: 24px; background: rgba(10,10,10,.55); backdrop-filter: blur(8px); }
.subscribe-modal { width: min(620px,100%); border-radius: 22px; padding: 34px; position: relative; background: var(--bg); border: 1px solid var(--line-strong); }
.subscribe-modal h2 { margin-top: 6px; font-size: clamp(36px,5vw,56px); }
.modal-close { position: absolute; right: 20px; top: 18px; width: 36px; height: 36px; border-radius: 10px; border: 1px solid var(--line-strong); background: var(--surface-2); color: var(--ink); font-size: 20px; display: flex; align-items: center; justify-content: center; }
.subscribe-form { display: flex; gap: 8px; margin-top: 22px; }
.subscribe-form input { flex: 1; }
.subscribe-success { margin-top: 14px; border-radius: 12px; padding: 12px 14px; background: var(--surface-2); border: 1px solid var(--line-strong); color: var(--ink-2); font-size: 13px; font-weight: 700; }

/* ── RESPONSIVE ── */

/* Switch nav to mobile at 760px */
@media(max-width: 760px) {
  .nav-desktop { display: none !important; }
  .nav-mobile { display: flex !important; }
  .navbar { height: 68px !important; padding: 0 20px !important; }

  .screen { padding: 32px 20px; }
  .action-bar { width: 100% !important; padding: 0 20px; margin-top: 20px; gap: 10px; }
  .action-bar button, .action-bar a { width: 100% !important; justify-content: center !important; }
  .build-cta-row { justify-content: stretch; }
  .build-cta-row .btn-accent { width: 100%; justify-content: center; }

  /* Result hero: full phone screen height */
  .result-screen { padding: 0 0 60px !important; }
  .res-hero {
    min-height: calc(100svh - 68px);
    border-radius: 0;
    align-items: flex-end;
  }
  .res-glass-panel { padding: 24px 20px 32px; }
  .res-glass-top { flex-direction: column; gap: 6px; }
  .res-date-tag { align-self: flex-start; }
  .res-dest { font-size: clamp(28px, 8vw, 52px); }

  /* Make action bar appear below hero with padding */
  .timeline { padding: 36px 20px 80px !important; }
}

@media(max-width: 980px) {
  .hero-inner { grid-template-columns: 1fr !important; gap: 42px; }
  .hero-cards { max-width: 620px; }
  .s-body { display: block; }
  .s-photo { margin-top: 18px; }
  .hero-cards.itinerary-showreel { max-width: 560px; height: auto !important; }
  .showreel-frame { height: 380px; }
}

@media(max-width: 900px) { .mood-grid.image-grid { grid-template-columns: repeat(2,minmax(0,1fr)) !important; } }

@media(max-width: 620px) {
  .mood-grid.image-grid { grid-template-columns: 1fr !important; }
  .image-mood-tile { height: 200px !important; min-height: 200px !important; }
  .s-photo { height: 200px; }
  h1 { font-size: 48px !important; }
  .showreel-frame { height: 320px; border-radius: 20px; }
  /* Date input: shrink font so it never overflows on small phones */
  input[type="date"] { font-size: 13px; padding: 0 16px; min-height: 54px; }
}
`;

createRoot(document.getElementById("root")).render(<App />);
