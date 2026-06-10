import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function getTravelArchetype(moods = []) {
  const ids = moods.map((m) => m.id);
  const titles = moods.map((m) => m.title);

  const has = (value) => ids.includes(value) || titles.includes(value);

  if (has("romantic") && has("active") && has("nature")) {
    return {
      name: "The Scenic Spark",
      line: "Romantic energy, movement, and open-air moments."
    };
  }

  if (has("romantic") && has("comfort")) {
    return {
      name: "The Soft Landing",
      line: "A gentle, intimate plan with room to slow down."
    };
  }

  if (has("culinary") && has("cultural")) {
    return {
      name: "The Local Romantic",
      line: "Food, texture, and cultural depth over tourist checklists."
    };
  }

  if (has("adventurous") && has("active")) {
    return {
      name: "The Momentum Seeker",
      line: "Built for movement, discovery, and a little edge."
    };
  }

  if (has("nature") && has("slow-easy")) {
    return {
      name: "The Quiet Wanderer",
      line: "Spacious, scenic, and intentionally unhurried."
    };
  }

  if (has("social") && has("culinary")) {
    return {
      name: "The Table Hopper",
      line: "A social plan shaped around conversation, flavor, and local energy."
    };
  }

  if (has("open")) {
    return {
      name: "The Open Compass",
      line: "Flexible by design, with Gemini choosing the strongest route."
    };
  }

  if (moods.length) {
    return {
      name: `The ${moods[0].title} Day`,
      line: `A plan shaped around ${moods.map((m) => m.title.toLowerCase()).join(", ")}.`
    };
  }

  return {
    name: "The Mood-Led Day",
    line: "A plan shaped around who you want to be today."
  };
}

function buildGoogleMapsTripUrl(stops = []) {
  const names = stops
    .map((stop) => stop.googlePlaceName || stop.name || stop.photoQuery)
    .filter(Boolean)
    .slice(0, 10);

  if (!names.length) return "";

  if (names.length === 1) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(names[0])}`;
  }

  const origin = names[0];
  const destination = names[names.length - 1];
  const waypoints = names.slice(1, -1).join("|");

  let url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=walking`;

  if (waypoints) {
    url += `&waypoints=${encodeURIComponent(waypoints)}`;
  }

  return url;
}

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
  const [destination, setDestination] = useState("Paris, France");
  const [placePredictions, setPlacePredictions] = useState([]);
  const [isAutocompleting, setIsAutocompleting] = useState(false);
  const [date, setDate] = useState(getToday());
  const [diet, setDiet] = useState("Vegetarian");
  const [planFor, setPlanFor] = useState("Date");
  const [selectedMoods, setSelectedMoods] = useState(["active", "romantic"]);
  const [loadingLine, setLoadingLine] = useState(0);
  const [itinerary, setItinerary] = useState(null);
  const [googleReady, setGoogleReady] = useState(false);
  const [error, setError] = useState("");
  const [showSubscribe, setShowSubscribe] = useState(false);
  const [subscribeEmail, setSubscribeEmail] = useState("");
  const [subscribeSaved, setSubscribeSaved] = useState(false);
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


  useEffect(() => {
    const query = destination.trim();

    if (query.length < 2) {
      setPlacePredictions([]);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setIsAutocompleting(true);
      try {
        const response = await fetch(`/api/place-autocomplete?input=${encodeURIComponent(query)}`);
        const data = await response.json();

        if (!cancelled && Array.isArray(data.suggestions)) {
          setPlacePredictions(data.suggestions);
        }
      } catch (error) {
        console.warn("Autocomplete fallback:", error);
        if (!cancelled) setPlacePredictions([]);
      } finally {
        if (!cancelled) setIsAutocompleting(false);
      }
    }, 220);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [destination]);

  const fallbackFilteredDestinations = fallbackDestinationSuggestions.filter((item) => {
    const query = destination.toLowerCase().trim();
    return (
      item.label.toLowerCase().includes(query) ||
      item.aliases.some((alias) => alias.includes(query))
    );
  });

  const destinationOptions = placePredictions.length
    ? placePredictions
    : fallbackFilteredDestinations.slice(0, 6).map((item) => ({
        label: item.label,
        source: "fallback"
      }));

  const selectedMoodObjects = selectedMoods
    .map((id) => moodVibes.find((vibe) => vibe.id === id))
    .filter(Boolean);

  const travelArchetype = getTravelArchetype(selectedMoodObjects);

  const tripMapsUrl = itinerary?.stops?.length
    ? buildGoogleMapsTripUrl(itinerary.stops)
    : "";

  const loadingItems = useMemo(
    () => [
      user?.name ? `${user.name}'s lightweight profile` : "Quick feeler profile",
      "Today's mood signals",
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

      <nav className="navbar">
        <div className="nav-steps nav-left">
          {[
            { label: "Setup", value: "setup" },
            { label: "Mood", value: "mood" },
            { label: "Result", value: "result" }
          ].map((item, i) => {
            const order = ["setup", "mood", "result"];
            const active = step === item.value;
            const done = order.indexOf(step) > i || step === "loading";
            const disabled = item.value === "result" && !itinerary;
            return (
              <button
                type="button"
                className={active ? "active" : done ? "done" : ""}
                key={item.value}
                disabled={disabled}
                onClick={() => {
                  if (!disabled) setStep(item.value);
                }}
              >
                <i /> {item.label}
              </button>
            );
          })}
        </div>

        <div className="nav-actions">
          <button className="btn-accent nav-subscribe" onClick={() => setShowSubscribe(true)}>
            Subscribe for updates
          </button>
        </div>
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
                Today feels <span>different.</span>
              </h1>
              <p>
                Because even the best recommendation system can't predict what you'll want today.
                Whether it's a single evening, a full day, or a whole trip.
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

            <div className="hero-cards itinerary-showreel" aria-label="Itinerary preview animation">
              <div className="showreel-frame">
                <div className="showreel-image-stack">
                  <img className="reel-img reel-img-1" src={moodVibes[8].img} alt="" />
                  <img className="reel-img reel-img-2" src={moodVibes[2].img} alt="" />
                  <img className="reel-img reel-img-3" src={moodVibes[3].img} alt="" />
                </div>

                <div className="showreel-overlay" />

                <div className="itinerary-lines">
                  <div className="itinerary-line line-1">
                    <b>08:30</b>
                    <span>Quiet temple morning</span>
                  </div>
                  <div className="itinerary-line line-2">
                    <b>12:00</b>
                    <span>Vegetarian lunch nearby</span>
                  </div>
                  <div className="itinerary-line line-3">
                    <b>17:30</b>
                    <span>Golden-hour walk</span>
                  </div>
                </div>

                <div className="generation-chip">
                  <i />
                  <span>Building itinerary</span>
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
            <p>
              We'll infer your longer-term travel style from your lightweight
              profile later. For now, tell us where, when, and what constraints matter.
            </p>
          </section>

          <section className="form-shell glass-panel">
            <label>
              <span>Destination</span>
              <input
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="City, neighborhood, or place"
                autoComplete="off"
              />
            </label>

            <div className="suggestions autocomplete-suggestions">
              {destinationOptions.map((item) => (
                <button
                  type="button"
                  key={item.placeId || item.label}
                  className={destination === item.label ? "suggestion active" : "suggestion"}
                  onClick={() => setDestination(item.label)}
                >
                  {item.label}

                </button>
              ))}
              {isAutocompleting && <div className="autocomplete-loading">Searching Google Maps…</div>}
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
                We're working on it. Soon, we'll skip these questions with your
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
              Choose today's mood
            </button>
          </section>
        </main>
      )}

      {step === "mood" && (
        <main className="screen mood-screen on">
          <section className="mood-header">
            <p className="label">Step 2 / 2 · Choose up to 3</p>
            <h2>
              What's your <span className="gem">mood today?</span>
            </h2>
            <p>
              This one input reshapes your entire day. It's the variable Gemini
              can't infer from data alone.
            </p>
          </section>

          <section className="mood-grid image-grid">
            {moodVibes.map((vibe, index) => (
              <button
                type="button"
                key={vibe.id}
                className={selectedMoods.includes(vibe.id) ? "image-mood-tile active" : "image-mood-tile"}
                onClick={() => toggleMood(vibe.id)}
              >
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
            <button className="btn-accent" onClick={generatePlan}>
              Build itinerary
            </button>
          </section>
        </main>
      )}

      {step === "loading" && (
        <main className="screen loading-screen on">
          <section className="loader-layout">
            <div className={`constellation progress-${Math.min(loadingLine, 6)}`} aria-hidden="true">
              <svg viewBox="0 0 520 320">
                <defs>
                  <filter id="starGlow" x="-80%" y="-80%" width="260%" height="260%">
                    <feGaussianBlur stdDeviation="5" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                <line className="seg seg-1 blue-stroke" x1="72" y1="220" x2="135" y2="148" />
                <line className="seg seg-2 green-stroke" x1="135" y1="148" x2="218" y2="186" />
                <line className="seg seg-3 yellow-stroke" x1="218" y1="186" x2="306" y2="92" />
                <line className="seg seg-4 red-stroke" x1="306" y1="92" x2="388" y2="136" />
                <line className="seg seg-5 blue-stroke" x1="388" y1="136" x2="455" y2="96" />

                <circle className="node node-1 blue" cx="72" cy="220" r="9" />
                <circle className="node node-2 green" cx="135" cy="148" r="9" />
                <circle className="node node-3 yellow" cx="218" cy="186" r="9" />
                <circle className="node node-4 blue" cx="306" cy="92" r="9" />
                <circle className="node node-5 red" cx="388" cy="136" r="9" />
                <circle className="node node-6 green" cx="455" cy="96" r="9" />

                <circle className="halo halo-1" cx="72" cy="220" r="22" />
                <circle className="halo halo-2" cx="135" cy="148" r="22" />
                <circle className="halo halo-3" cx="218" cy="186" r="22" />
                <circle className="halo halo-4" cx="306" cy="92" r="22" />
                <circle className="halo halo-5" cx="388" cy="136" r="22" />
                <circle className="halo halo-6" cx="455" cy="96" r="22" />
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
            <p className="label">Travel DNA preview</p>
            <h2>Live planning is taking a short pause.</h2>
            <p>The prototype could not finish a fresh plan right now. Review your setup or try again in a moment.</p>
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
              <span className="res-tag">{travelArchetype.name}</span>
              <h2>{itinerary?.destination || destination}</h2>
              <p>{itinerary?.dates || prettyDate(date)}</p>
              <p className="archetype-line">{travelArchetype.line}</p>
              {itinerary?.summary && <p className="res-summary">{itinerary.summary}</p>}
              {itinerary?.generatedBy === "fallback" && (
                <div className="fallback-banner">
                  <span>Preview mode</span>
                  <p>
                    Live planning is temporarily capped, so Travel DNA is showing
                    a designed preview while place details continue to enrich.
                  </p>
                  <button type="button" onClick={() => setShowSubscribe(true)}>
                    Like this idea? Get updates
                  </button>
                </div>
              )}
            </div>
          </section>

          <section className="action-bar">
            <button className="btn-outline" onClick={() => setStep("setup")}>
              Edit setup
            </button>
            <button className="btn-outline" onClick={generatePlan}>
              Regenerate
            </button>
            {tripMapsUrl && (
              <a className="btn-accent maps-trip-btn" href={tripMapsUrl} target="_blank" rel="noreferrer">
                Open trip in Google Maps
              </a>
            )}
          </section>

          <section className="timeline">
            <p className="label">Today's flow</p>
            {(itinerary?.stops || []).map((stop, i) => (
              <article className="stop" key={`${stop.name}-${i}`}>
                <div className={i === 0 ? "s-pin featured" : "s-pin"}>⌖</div>
                <div className="s-body">
                  <p className="s-cat">{stop.category}</p>
                  <h3>
                    {stop.time} <span>{stop.period}</span>
                  </h3>
                  <h4>{stop.name}</h4>

                  <div className="place-meta prominent">
                    {stop.rating && (
                      <span className="rating-pill">★ {stop.rating}{stop.userRatingCount ? ` · ${stop.userRatingCount.toLocaleString()} reviews` : ""}</span>
                    )}
                    {stop.openNow !== undefined && (
                      <span>{stop.openNow ? "Open now" : "Hours vary"}</span>
                    )}
                    {stop.address && <span>{stop.address}</span>}
                    {!stop.rating && stop.placesStatus !== "google-places" && (
                      <span className="demo-pill">Places details unavailable in fallback</span>
                    )}
                  </div>

                  <p>{stop.description}</p>

                  <div className="s-photo">
                    <img
                      src={stop.imageUrl || stop.photoUrl || selectedMoodObjects[i % Math.max(selectedMoodObjects.length, 1)]?.img || moodVibes[i % moodVibes.length].img}
                      alt={stop.name}
                      loading="lazy"
                    />
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
            <button
              className="modal-close"
              type="button"
              onClick={() => {
                setShowSubscribe(false);
                setSubscribeSaved(false);
              }}
            >
              ×
            </button>

            <div className="spark">✦</div>
            <p className="label">Early access</p>
            <h2>Like this idea?</h2>
            <p>
              Travel DNA is running in demo mode right now. Gemini API credits
              are limited, so fallback plans keep the experience alive while the
              product evolves.
            </p>
            <p>
              Subscribe to get updates when live personalization, better Google
              Places photos, saved preferences, and richer planning are ready.
            </p>

            <form
              className="subscribe-form"
              onSubmit={(event) => {
                event.preventDefault();
                if (!subscribeEmail.trim()) return;
                const existing = JSON.parse(localStorage.getItem("travelDnaSubscribers") || "[]");
                localStorage.setItem(
                  "travelDnaSubscribers",
                  JSON.stringify([...existing, subscribeEmail.trim()])
                );
                setSubscribeSaved(true);
              }}
            >
              <input
                type="email"
                placeholder="you@example.com"
                value={subscribeEmail}
                onChange={(event) => setSubscribeEmail(event.target.value)}
                required
              />
              <button className="btn-accent" type="submit">
                Keep me updated
              </button>
            </form>

            {subscribeSaved && (
              <div className="subscribe-success">
                You're on the list. For now this is saved locally for the prototype.
              </div>
            )}
          </div>
        </div>
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
@import url('https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400&display=swap');

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
  --bg:        #ECEAE3;
  --surface:   #E4E2DA;
  --surface-2: #DAD8D0;
  --surface-3: #D0CEC6;
  --line:      rgba(0,0,0,.08);
  --line-strong: rgba(0,0,0,.14);
  --ink:       #0A0A0A;
  --ink-2:     #3A3A38;
  --ink-3:     #888780;
  --cream:     #0A0A0A;
  --accent:    #C9A84C;
  --accent-soft: rgba(201,168,76,.12);
  --blue:      #0A0A0A;
  --green:     #3A3A38;
  --yellow:    #C9A84C;
  --red:       #0A0A0A;
  --ease: cubic-bezier(.2,.8,.2,1);
}

body {
  font-family: 'Inter', system-ui, sans-serif;
  background: var(--bg);
  color: var(--ink);
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
}

button,
input {
  font: inherit;
}

button {
  cursor: pointer;
}

.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 0 80px;
  background: var(--bg);
  overflow-x: hidden;
}

.stars,
.aurora {
  display: none !important;
}

/* ── NAVBAR ── */
.navbar {
  width: 100%;
  height: 64px;
  padding: 0 clamp(20px, 4vw, 56px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--line-strong);
  background: var(--bg);
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-steps,
.nav-actions,
.error-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.nav-steps button {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 14px;
  border-radius: 10px;
  border: none;
  background: transparent;
  font-size: 12px;
  font-weight: 700;
  color: var(--ink-3);
  letter-spacing: .01em;
  transition: background .15s, color .15s;
}

.nav-steps button:hover:not(:disabled) {
  background: var(--surface-2);
  color: var(--ink);
}

.nav-steps button.active {
  color: var(--ink);
  background: var(--surface-2);
}

.nav-steps button.done {
  color: var(--ink-2);
}

.nav-steps button:disabled {
  opacity: .3;
  cursor: not-allowed;
}

.nav-steps i {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
}

/* ── BUTTONS ── */
.btn-outline,
.btn-accent {
  border-radius: 10px;
  font-weight: 700;
  font-size: 13px;
  letter-spacing: .01em;
  transition: opacity .15s, transform .15s;
}

.btn-outline {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  background: var(--surface-2);
  border: none;
  padding: 11px 18px;
  color: var(--ink);
  text-decoration: none;
}

.btn-outline:hover {
  background: var(--surface-3);
}

.btn-accent {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: var(--ink);
  color: var(--bg);
  border: none;
  padding: 13px 24px;
  font-size: 13px;
  font-weight: 800;
}

.btn-accent:hover {
  opacity: .88;
}

.btn-accent:active {
  transform: scale(.98);
}

.nav-subscribe {
  padding: 9px 16px;
  font-size: 12px;
}

/* ── SCREENS ── */
.screen {
  display: block;
  width: 100%;
  max-width: 1160px;
  padding: clamp(40px, 6vw, 82px) clamp(20px, 4vw, 56px);
  animation: scIn .3s var(--ease) both;
}

@keyframes scIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── TYPE ── */
.label,
.field-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: var(--ink-3);
}

h1, h2 {
  font-family: 'Inter', system-ui, sans-serif;
  color: var(--ink);
}

h1 {
  font-size: clamp(52px, 7.5vw, 96px) !important;
  font-weight: 900;
  line-height: .92;
  letter-spacing: -.055em !important;
  margin: 0;
  max-width: 840px;
}

h2 {
  font-size: clamp(36px, 4.5vw, 60px);
  font-weight: 900;
  line-height: .98;
  letter-spacing: -.04em;
  margin: 10px 0 10px;
}

p {
  font-size: 16px;
  line-height: 1.72;
  color: var(--ink-2);
}

.gem,
h1 span {
  color: var(--accent) !important;
  background: none !important;
  -webkit-text-fill-color: currentColor !important;
}

/* ── PANELS ── */
.glass-panel {
  background: var(--surface);
  border: 1px solid var(--line-strong);
  box-shadow: none;
  backdrop-filter: none;
}

/* ── HERO ── */
.hero-screen {
  padding-top: clamp(64px, 8vw, 110px);
}

.hero-inner {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(360px, 520px) !important;
  gap: clamp(42px, 7vw, 96px);
  align-items: center;
  min-height: 68vh;
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
  width: fit-content;
  border-radius: 10px;
  border: 1px solid var(--line-strong);
  background: var(--surface);
  padding: 7px 12px;
}

.pulse {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent);
}

.hero-pill span {
  font-size: 11px;
  font-weight: 800;
  color: var(--ink-3);
  letter-spacing: .05em;
  text-transform: uppercase;
}

.hero-left > p {
  max-width: 620px;
  font-size: clamp(17px, 1.35vw, 20px);
  line-height: 1.6;
  color: var(--ink-2);
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
  color: var(--ink-3);
  font-size: 13px;
  font-weight: 700;
}

.hero-cards {
  position: relative;
  display: grid;
  gap: 18px;
  height: auto;
}

/* ── SHOWREEL ── */
.hero-cards.itinerary-showreel {
  height: 520px !important;
  display: grid !important;
  place-items: center !important;
}

.showreel-frame {
  position: relative;
  width: min(520px, 100%);
  height: 430px;
  border-radius: 24px;
  overflow: hidden;
  border: 1px solid var(--line-strong);
  background: var(--surface);
}

.showreel-image-stack {
  position: absolute;
  inset: 0;
}

.reel-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transform: scale(1.04);
  animation: reelFade 9s infinite;
  filter: brightness(.7) saturate(.85);
}

.reel-img-1 { animation-delay: 0s; }
.reel-img-2 { animation-delay: 3s; }
.reel-img-3 { animation-delay: 6s; }

@keyframes reelFade {
  0%   { opacity: 0; transform: scale(1.04); }
  8%   { opacity: 1; transform: scale(1); }
  30%  { opacity: 1; transform: scale(1.025); }
  38%  { opacity: 0; transform: scale(1.05); }
  100% { opacity: 0; transform: scale(1.05); }
}

.showreel-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(10,10,10,.22), rgba(10,10,10,.78));
}

.showreel-copy {
  position: absolute;
  left: 22px;
  right: 22px;
  top: 22px;
  z-index: 2;
}

.showreel-copy span {
  display: inline-flex;
  color: var(--accent);
  background: rgba(10,10,10,.55);
  border: 1px solid rgba(201,168,76,.3);
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: .08em;
  text-transform: uppercase;
}

.showreel-copy h3 {
  margin: 12px 0 0;
  max-width: 320px;
  color: #fff;
  font-size: 32px;
  font-weight: 900;
  line-height: .98;
  letter-spacing: -.045em;
}

.itinerary-lines {
  position: absolute;
  left: 22px;
  right: 22px;
  bottom: 72px;
  z-index: 2;
  display: grid;
  gap: 8px;
}

.itinerary-line {
  display: grid;
  grid-template-columns: 58px 1fr;
  gap: 12px;
  align-items: center;
  min-height: 46px;
  padding: 10px 13px;
  border-radius: 12px;
  background: rgba(236,234,227,.9);
  border: none;
  opacity: 0;
  transform: translateY(12px);
  animation: lineBuild 9s infinite;
}

.line-1 { animation-delay: .55s; }
.line-2 { animation-delay: 1.25s; }
.line-3 { animation-delay: 1.95s; }

@keyframes lineBuild {
  0%, 4%    { opacity: 0; transform: translateY(12px); }
  10%, 74%  { opacity: 1; transform: translateY(0); }
  82%, 100% { opacity: 0; transform: translateY(-6px); }
}

.itinerary-line b {
  color: var(--accent);
  font-size: 13px;
  font-weight: 800;
}

.itinerary-line span {
  color: var(--ink);
  font-size: 13px;
  font-weight: 700;
}

.generation-chip {
  position: absolute;
  left: 22px;
  bottom: 22px;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border-radius: 10px;
  padding: 9px 12px;
  background: var(--accent);
  border: none;
  color: var(--ink);
  font-size: 11px;
  font-weight: 900;
  letter-spacing: .04em;
  text-transform: uppercase;
}

.generation-chip i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--ink);
  animation: dotPulse 1.2s ease-in-out infinite;
}

@keyframes dotPulse {
  0%, 100% { opacity: .35; transform: scale(.8); }
  50%       { opacity: 1;   transform: scale(1.15); }
}

/* ── SETUP ── */
.setup-header,
.mood-header {
  margin-bottom: 30px;
  max-width: 840px;
}

.form-shell {
  max-width: 820px;
  border-radius: 20px;
  padding: clamp(22px, 4vw, 36px);
  display: grid;
  gap: 22px;
}

label {
  display: grid;
  gap: 8px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: var(--ink-3);
}

input {
  width: 100%;
  background: var(--surface-2);
  border: 1px solid var(--line-strong);
  border-radius: 12px;
  padding: 14px 16px;
  font-size: 15px;
  font-weight: 500;
  color: var(--ink);
  outline: none;
  transition: border-color .15s, background .15s;
}

input:focus {
  border-color: rgba(0,0,0,.3);
  background: var(--surface-3);
}

input::placeholder {
  color: var(--ink-3);
}

input[type="date"] {
  color-scheme: light;
}

/* ── CHIPS / SUGGESTIONS ── */
.suggestions,
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}

.suggestion,
.chip {
  padding: 8px 14px;
  background: var(--surface-2);
  border: 1px solid var(--line-strong);
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  color: var(--ink-2);
  transition: background .12s, color .12s;
}

.suggestion:hover,
.chip:hover {
  background: var(--surface-3);
  color: var(--ink);
}

.suggestion.active,
.chip.active {
  background: var(--ink);
  border-color: var(--ink);
  color: var(--bg);
  font-weight: 800;
}

.autocomplete-suggestions .suggestion {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.autocomplete-suggestions .suggestion span {
  color: var(--bg);
  background: var(--accent);
  border-radius: 6px;
  padding: 2px 7px;
  font-size: 10px;
  font-weight: 900;
}

.autocomplete-loading {
  display: inline-flex;
  align-items: center;
  padding: 8px 12px;
  color: var(--ink-3);
  font-size: 12px;
  font-weight: 700;
}

.field-block {
  display: grid;
  gap: 8px;
}

/* ── PI CARD ── */
.pi-card {
  padding: 20px;
  border-radius: 16px;
  background: var(--surface-2);
  border: 1px solid var(--line-strong);
}

.spark {
  width: 28px;
  height: 28px;
  background: var(--ink);
  color: var(--accent);
  border-radius: 8px;
  display: grid;
  place-items: center;
  margin-bottom: 12px;
  font-size: 13px;
}

.pi-card h3 {
  font-size: 15px;
  font-weight: 800;
  color: var(--ink);
  margin: 6px 0 6px;
  letter-spacing: -.02em;
}

.pi-card p {
  font-size: 13px;
  color: var(--ink-3);
  line-height: 1.6;
  margin: 0;
}

.profile-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 7px 12px;
  border-radius: 10px;
  background: var(--surface-3);
  color: var(--ink-2);
  font-size: 12px;
  font-weight: 700;
  border: 1px solid var(--line-strong);
}

.profile-chip img {
  width: 22px;
  height: 22px;
  border-radius: 50%;
}

.primary-wide {
  width: fit-content;
}

/* ── MOOD GRID ── */
.mood-screen {
  max-width: 1240px;
}

.mood-grid.image-grid {
  display: grid !important;
  grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
  gap: 14px !important;
  width: 100% !important;
}

.image-mood-tile {
  position: relative;
  overflow: hidden;
  border: 2px solid transparent !important;
  border-radius: 18px !important;
  padding: 0;
  text-align: left;
  background: var(--surface);
  color: var(--ink);
  height: 220px !important;
  min-height: 220px !important;
  grid-column: span 1 !important;
  grid-row: span 1 !important;
  box-shadow: none;
  transition: border-color .15s;
}

.image-mood-tile:hover {
  transform: none;
  border-color: var(--line-strong) !important;
  box-shadow: none;
}

.image-mood-tile.active {
  border-color: var(--accent) !important;
}

.image-mood-tile img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: brightness(.55) saturate(.8);
  transition: transform .4s var(--ease);
}

.image-mood-tile:hover img,
.image-mood-tile.active img {
  transform: scale(1.03);
  filter: brightness(.65) saturate(.9);
}

.image-tile-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(10,10,10,.88), rgba(10,10,10,.1) 65%);
}

.tile-number {
  position: absolute;
  left: 16px;
  top: 16px;
  z-index: 2;
  font-size: 11px;
  letter-spacing: .1em;
  font-weight: 800;
  color: rgba(255,255,255,.45);
}

.image-tile-content {
  position: absolute;
  left: 16px;
  right: 16px;
  bottom: 16px;
  z-index: 2;
}

.image-tile-content strong {
  display: block;
  font-size: clamp(18px, 1.8vw, 24px);
  font-weight: 900;
  line-height: 1;
  letter-spacing: -.03em;
  color: #fff;
}

.image-tile-content p {
  margin: 6px 0 0;
  color: rgba(255,255,255,.6);
  font-size: 12px;
  font-weight: 600;
  line-height: 1.3;
}

/* ── BOTTOM CTA ── */
.bottom-cta {
  margin-top: 18px;
  padding: 14px 16px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}

.selected-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}

.selected-chips span {
  padding: 6px 12px;
  border-radius: 8px;
  background: var(--surface-3);
  border: 1px solid var(--line-strong);
  color: var(--ink);
  font-size: 12px;
  font-weight: 700;
}

/* ── LOADING ── */
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
  width: min(500px, 76vw);
  height: 260px;
  display: grid;
  place-items: center;
}

.constellation svg {
  width: 100%;
  height: 100%;
  overflow: visible;
}

.constellation .seg {
  stroke-width: 3;
  stroke-linecap: round;
  stroke-dasharray: 120;
  stroke-dashoffset: 120;
  opacity: 0;
  transition: stroke-dashoffset .55s var(--ease), opacity .35s var(--ease);
}

.blue-stroke  { stroke: #0A0A0A; }
.green-stroke { stroke: #3A3A38; }
.yellow-stroke { stroke: #C9A84C; }
.red-stroke   { stroke: #888780; }

.constellation .node {
  opacity: .15;
  transform: scale(.7);
  transform-origin: center;
  transition: opacity .35s var(--ease), transform .45s var(--ease);
}

.constellation .blue   { fill: #0A0A0A; }
.constellation .green  { fill: #3A3A38; }
.constellation .yellow { fill: #C9A84C; }
.constellation .red    { fill: #888780; }

.constellation .halo { display: none; }

.constellation.progress-0 .node-1,
.constellation.progress-1 .node-1,
.constellation.progress-2 .node-1,
.constellation.progress-3 .node-1,
.constellation.progress-4 .node-1,
.constellation.progress-5 .node-1,
.constellation.progress-6 .node-1,
.constellation.progress-1 .node-2,
.constellation.progress-2 .node-2,
.constellation.progress-3 .node-2,
.constellation.progress-4 .node-2,
.constellation.progress-5 .node-2,
.constellation.progress-6 .node-2,
.constellation.progress-2 .node-3,
.constellation.progress-3 .node-3,
.constellation.progress-4 .node-3,
.constellation.progress-5 .node-3,
.constellation.progress-6 .node-3,
.constellation.progress-3 .node-4,
.constellation.progress-4 .node-4,
.constellation.progress-5 .node-4,
.constellation.progress-6 .node-4,
.constellation.progress-4 .node-5,
.constellation.progress-5 .node-5,
.constellation.progress-6 .node-5,
.constellation.progress-5 .node-6,
.constellation.progress-6 .node-6 {
  opacity: 1;
  transform: scale(1);
}

.constellation.progress-1 .seg-1,
.constellation.progress-2 .seg-1,
.constellation.progress-3 .seg-1,
.constellation.progress-4 .seg-1,
.constellation.progress-5 .seg-1,
.constellation.progress-6 .seg-1,
.constellation.progress-2 .seg-2,
.constellation.progress-3 .seg-2,
.constellation.progress-4 .seg-2,
.constellation.progress-5 .seg-2,
.constellation.progress-6 .seg-2,
.constellation.progress-3 .seg-3,
.constellation.progress-4 .seg-3,
.constellation.progress-5 .seg-3,
.constellation.progress-6 .seg-3,
.constellation.progress-4 .seg-4,
.constellation.progress-5 .seg-4,
.constellation.progress-6 .seg-4,
.constellation.progress-5 .seg-5,
.constellation.progress-6 .seg-5 {
  stroke-dashoffset: 0;
  opacity: 1;
}

.loading-copy h2 {
  margin-top: 6px;
}

.load-glass {
  width: min(620px, 100%);
  padding: 18px 20px;
  border-radius: 20px;
  background: var(--surface);
  border: 1px solid var(--line-strong);
}

.load-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 0;
  border-bottom: 1px solid var(--line);
  font-size: 14px;
  color: var(--ink-3);
  opacity: .35;
}

.load-row:last-child {
  border-bottom: 0;
}

.load-row.on {
  opacity: 1;
  color: var(--ink-2);
}

.load-row b {
  width: 7px;
  height: 7px;
  background: var(--surface-3);
  border: 1px solid var(--line-strong);
  border-radius: 50%;
  flex: 0 0 auto;
}

.load-row.on b {
  background: var(--accent);
  border-color: var(--accent);
}

.load-row em {
  margin-left: auto;
  font-style: normal;
  font-size: 11px;
  font-weight: 700;
  color: var(--ink-3);
  text-transform: uppercase;
  letter-spacing: .06em;
}

.load-row.on em {
  color: var(--accent);
}

/* ── ERROR ── */
.api-error-card {
  width: min(620px, 100%);
  background: var(--surface);
  border: 1px solid var(--line-strong);
  border-radius: 20px;
  padding: 34px;
  text-align: left;
}

/* ── RESULT ── */
.result-screen {
  max-width: 1120px !important;
  width: 100% !important;
  padding: 48px 40px 80px !important;
  margin: 0 auto;
}

.res-hero {
  width: 100%;
  height: auto !important;
  min-height: 420px;
  border-radius: 24px;
  border: 1px solid var(--line-strong);
  overflow: hidden;
  position: relative;
  background: var(--ink);
}

.res-hero img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: .38;
}

.res-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(10,10,10,.92), rgba(10,10,10,.65), rgba(10,10,10,.2));
}

.res-content {
  position: relative !important;
  left: 0 !important;
  bottom: auto !important;
  transform: none !important;
  width: 100% !important;
  padding: 52px clamp(28px, 6vw, 70px) !important;
}

.res-tag {
  display: inline-flex;
  padding: 5px 10px;
  background: var(--accent);
  border: none;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: .08em;
  color: var(--ink);
  margin-bottom: 14px;
  text-transform: uppercase;
}

.res-content h2 {
  font-size: clamp(48px, 6.5vw, 76px);
  color: #fff;
  margin: 0 0 8px;
  font-weight: 900;
  letter-spacing: -.05em;
}

.res-content > p {
  color: rgba(255,255,255,.55);
  font-size: 14px;
  font-weight: 500;
}

.res-summary {
  max-width: 720px;
  margin-top: 12px;
  color: rgba(255,255,255,.7) !important;
}

.res-dna-strip {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 14px;
}

.res-dna-strip span {
  padding: 5px 10px;
  background: rgba(255,255,255,.08);
  border: 1px solid rgba(255,255,255,.15);
  border-radius: 8px;
  font-size: 11px;
  font-weight: 700;
  color: rgba(255,255,255,.7);
}

.archetype-line {
  color: rgba(255,255,255,.55) !important;
  font-size: 14px !important;
  margin-top: 8px;
}

/* ── ACTION BAR ── */
.action-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  position: static !important;
  top: auto !important;
  border: 1px solid var(--line-strong);
  border-radius: 14px;
  margin: 18px 0 0;
  padding: 10px !important;
  width: fit-content;
  background: var(--surface);
}

/* ── TIMELINE ── */
.timeline {
  max-width: 100% !important;
  margin: 0 auto;
  padding: 48px 0 90px !important;
}

.stop {
  display: flex;
  position: relative;
  margin-bottom: 44px;
}

.stop:not(:last-child)::after {
  content: "";
  position: absolute;
  left: 14px;
  top: 30px;
  bottom: -44px;
  width: 1px;
  background: var(--line-strong);
}

.s-pin {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: var(--surface);
  border: 1px solid var(--line-strong);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-right: 22px;
  margin-top: 2px;
  color: var(--ink-3);
  font-size: 11px;
}

.s-pin.featured {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--ink);
}

.s-body {
  flex: 1;
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(300px, 440px);
  column-gap: 40px;
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
  font-size: 10px;
  font-weight: 800;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: var(--ink-3);
  margin-bottom: 5px;
}

.s-body h3 {
  font-size: 30px;
  font-weight: 900;
  letter-spacing: -.045em;
  color: var(--ink);
  margin: 0 0 4px;
}

.s-body h3 span {
  font-size: 12px;
  font-weight: 600;
  color: var(--ink-3);
  margin-left: 4px;
}

.s-body h4 {
  font-size: 16px;
  font-weight: 800;
  color: var(--ink);
  margin: 0 0 8px;
  letter-spacing: -.02em;
}

.s-body p {
  font-size: 14px;
  line-height: 1.68;
  color: var(--ink-2);
  margin-bottom: 14px;
}

.s-body small {
  display: block;
  color: var(--ink-3);
  font-size: 12px;
  line-height: 1.5;
}

/* ── PLACE PHOTO ── */
.s-photo {
  border-radius: 16px;
  height: 220px;
  position: relative;
  overflow: hidden;
  margin-bottom: 8px;
  display: flex;
  align-items: end;
  padding: 14px;
  background: var(--surface-2);
  border: 1px solid var(--line-strong);
  box-shadow: none;
  transition: none;
}

.s-photo img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform .4s var(--ease);
}

.s-photo:hover img {
  transform: scale(1.025);
}

.s-photo-ov {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(10,10,10,.72), transparent 56%);
}

.s-photo span {
  position: relative;
  z-index: 1;
  font-size: 11px;
  font-weight: 800;
  color: rgba(255,255,255,.9);
  background: rgba(10,10,10,.55);
  border: none;
  padding: 5px 10px;
  border-radius: 7px;
}

/* ── PLACE META ── */
.place-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin: 8px 0 14px;
}

.place-meta span,
.place-meta a {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 5px 10px;
  border-radius: 8px;
  background: var(--surface-2);
  border: 1px solid var(--line-strong);
  color: var(--ink-2);
  font-size: 12px;
  font-weight: 600;
  text-decoration: none;
}

.place-meta a {
  color: var(--ink);
  font-weight: 700;
}

.place-meta .rating-pill {
  color: var(--accent);
  border-color: rgba(201,168,76,.3);
  background: rgba(201,168,76,.1);
  font-weight: 800;
}

.place-meta .demo-pill {
  color: var(--ink-3);
  background: var(--surface-2);
}

/* ── FALLBACK BANNER ── */
.fallback-banner {
  margin-top: 18px;
  width: min(760px, 100%);
  border: 1px solid rgba(201,168,76,.25);
  background: rgba(201,168,76,.07);
  border-radius: 16px;
  padding: 16px 18px;
}

.fallback-banner span {
  display: inline-flex;
  color: var(--accent);
  font-size: 10px;
  font-weight: 900;
  letter-spacing: .08em;
  text-transform: uppercase;
  margin-bottom: 6px;
}

.fallback-banner p {
  margin: 0 0 12px;
  max-width: 650px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--ink-2);
}

.fallback-banner button {
  border: none;
  border-radius: 8px;
  padding: 8px 14px;
  background: var(--ink);
  color: var(--accent);
  font-size: 12px;
  font-weight: 800;
}

/* ── MODAL ── */
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 500;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(10,10,10,.55);
  backdrop-filter: blur(8px);
}

.subscribe-modal {
  width: min(620px, 100%);
  border-radius: 22px;
  padding: 34px;
  position: relative;
  background: var(--bg);
  border: 1px solid var(--line-strong);
}

.subscribe-modal h2 {
  margin-top: 6px;
  font-size: clamp(36px, 5vw, 56px);
}

.modal-close {
  position: absolute;
  right: 20px;
  top: 18px;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid var(--line-strong);
  background: var(--surface-2);
  color: var(--ink);
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.subscribe-form {
  display: flex;
  gap: 8px;
  margin-top: 22px;
}

.subscribe-form input {
  flex: 1;
}

.subscribe-success {
  margin-top: 14px;
  border-radius: 12px;
  padding: 12px 14px;
  background: var(--surface-2);
  border: 1px solid var(--line-strong);
  color: var(--ink-2);
  font-size: 13px;
  font-weight: 700;
}

/* ── RESPONSIVE ── */
@media(max-width: 980px) {
  .hero-inner {
    grid-template-columns: 1fr !important;
    gap: 42px;
  }

  .hero-cards {
    max-width: 620px;
  }

  .s-body {
    display: block;
  }

  .s-photo {
    margin-top: 18px;
  }

  .hero-cards.itinerary-showreel {
    max-width: 560px;
    height: auto !important;
  }

  .showreel-frame {
    height: 380px;
  }
}

@media(max-width: 900px) {
  .mood-grid.image-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  }
}

@media(max-width: 720px) {
  .bottom-cta,
  .subscribe-form {
    flex-direction: column;
    align-items: stretch;
  }

  .action-bar {
    border-radius: 16px;
    width: 100%;
  }
}

@media(max-width: 620px) {
  .navbar {
    padding: 0 16px;
  }

  .nav-steps {
    display: none;
  }

  .screen {
    padding: 40px 20px;
  }

  .mood-grid.image-grid {
    grid-template-columns: 1fr !important;
  }

  .image-mood-tile {
    height: 200px !important;
    min-height: 200px !important;
  }

  .result-screen {
    padding: 28px 18px 70px !important;
  }

  .res-hero {
    min-height: 400px;
  }

  .res-content h2 {
    font-size: 40px;
  }

  .s-photo {
    height: 200px;
  }

  h1 {
    font-size: 48px !important;
  }

  .showreel-frame {
    height: 320px;
    border-radius: 20px;
  }

  .showreel-copy h3 {
    font-size: 26px;
  }
}

/* ===== LIGHT MODE V3 FINAL: grey / white / black + restrained premium gold ===== */
:root {
  --bg: #ECEAE3;
  --page: #ECEAE3;
  --panel: #E2E0D8;
  --panel-2: #DAD8D0;
  --panel-3: #F4F3EE;
  --ink: #080808;
  --ink-2: #3E3E3A;
  --ink-3: #8A897F;
  --line: rgba(0,0,0,.10);
  --line-strong: rgba(0,0,0,.16);
  --gold: #BFA052;
  --gold-soft: rgba(191,160,82,.14);
  --gold-line: rgba(191,160,82,.30);
}

html, body, #root { background: var(--bg) !important; }
body, .app-shell { color: var(--ink) !important; }
.app-shell { background: var(--bg) !important; cursor: default !important; }
.stars, .aurora { display: none !important; }

/* sticky translucent grain nav */
.navbar {
  position: sticky !important;
  top: 0 !important;
  z-index: 999 !important;
  width: 100% !important;
  height: 72px !important;
  margin: 0 !important;
  padding: 0 clamp(24px, 4vw, 56px) !important;
  border-radius: 0 !important;
  border: 0 !important;
  border-bottom: 1px solid rgba(0,0,0,.10) !important;
  background:
    radial-gradient(circle at 12% 0%, rgba(255,255,255,.55), transparent 34%),
    linear-gradient(180deg, rgba(236,234,227,.84), rgba(236,234,227,.70)) !important;
  backdrop-filter: blur(22px) saturate(150%) !important;
  -webkit-backdrop-filter: blur(22px) saturate(150%) !important;
  box-shadow: none !important;
}
.navbar::after {
  content: "";
  position: absolute;
  inset: 0;
  opacity: .08;
  pointer-events: none;
  background-image: radial-gradient(circle at 1px 1px, #000 1px, transparent 0);
  background-size: 10px 10px;
  mix-blend-mode: multiply;
}
.nav-steps, .nav-actions { position: relative; z-index: 1; }
.nav-steps { gap: 24px !important; }
.nav-steps i, .hero-pill .pulse { display: none !important; }
.nav-steps button {
  padding: 0 !important;
  border: 0 !important;
  border-radius: 0 !important;
  background: transparent !important;
  color: rgba(0,0,0,.48) !important;
  font-size: 14px !important;
  font-weight: 800 !important;
  box-shadow: none !important;
}
.nav-steps button:hover:not(:disabled) { background: transparent !important; color: rgba(0,0,0,.74) !important; }
.nav-steps button.active { background: transparent !important; color: var(--ink) !important; }
.nav-steps button.done { color: rgba(0,0,0,.55) !important; }

/* typography */
h1 { font-size: clamp(46px, 6.2vw, 82px) !important; letter-spacing: -.06em !important; }
h1, h1 span, h2, h3, h4, .gem, .res-content h2, .s-body h3, .s-body h4 {
  color: var(--ink) !important;
  background: none !important;
  -webkit-text-fill-color: currentColor !important;
  text-shadow: none !important;
  animation: none !important;
}
.hero-left > p {
  max-width: 760px !important;
  font-size: clamp(22px, 2.35vw, 36px) !important;
  line-height: 1.38 !important;
  letter-spacing: -.035em !important;
  color: var(--ink-2) !important;
}
p, .subcopy, .res-summary, .s-body p, .s-body small { color: var(--ink-2) !important; }
.label, .field-label, .s-cat { color: var(--ink-3) !important; }

/* buttons */
.btn-accent, .nav-subscribe, .primary-wide, .build-cta-row .btn-accent, .bottom-cta .btn-accent,
.action-bar .btn-accent, .maps-trip-btn.btn-accent {
  min-height: 50px !important;
  padding: 0 26px !important;
  border-radius: 999px !important;
  background: var(--ink) !important;
  border: 1px solid var(--ink) !important;
  color: #fff !important;
  box-shadow: none !important;
  transform: none !important;
}
.btn-accent:hover, .nav-subscribe:hover, .primary-wide:hover, .build-cta-row .btn-accent:hover,
.bottom-cta .btn-accent:hover, .action-bar .btn-accent:hover, .maps-trip-btn.btn-accent:hover {
  background: #000 !important;
  border-color: #000 !important;
  color: #fff !important;
  opacity: 1 !important;
  transform: none !important;
}
.btn-outline, .action-bar .btn-outline, .error-actions .btn-outline {
  min-height: 50px !important;
  padding: 0 24px !important;
  border-radius: 999px !important;
  background: var(--panel-2) !important;
  border: 1px solid var(--line) !important;
  color: var(--ink) !important;
  box-shadow: none !important;
}
.btn-outline:hover, .action-bar .btn-outline:hover, .error-actions .btn-outline:hover {
  background: var(--panel-3) !important;
  color: var(--ink) !important;
  transform: none !important;
}
.nav-subscribe {
  background: transparent !important;
  border: 1px solid rgba(0,0,0,.16) !important;
  color: var(--ink) !important;
  min-height: 42px !important;
}
.nav-subscribe:hover { background: var(--panel-2) !important; color: var(--ink) !important; }

/* Google/Gmail connect as gold outline */
.google-wrap {
  border: 1px solid var(--gold-line) !important;
  border-radius: 999px !important;
  padding: 2px !important;
  background: transparent !important;
  display: inline-flex !important;
  align-items: center !important;
}
.google-wrap > div, #googleSignIn, #googleSignIn > div, #googleSignIn iframe { border-radius: 999px !important; }

/* hero pill */
.hero-pill {
  background: transparent !important;
  border: 1px solid rgba(0,0,0,.16) !important;
  border-radius: 999px !important;
  padding: 9px 15px !important;
  box-shadow: none !important;
}
.hero-pill span { color: var(--ink-3) !important; }

/* hero showreel */
.hero-cards.itinerary-showreel {
  height: 520px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}
.showreel-frame {
  width: min(560px, 100%) !important;
  height: 460px !important;
  margin: 0 auto !important;
  border-radius: 34px !important;
  border: 1px solid var(--line-strong) !important;
  box-shadow: none !important;
  background: var(--panel) !important;
}
.showreel-copy, .generation-chip, .preview-progress, .preview-progress::before, .preview-progress::after {
  display: none !important;
}
.showreel-overlay {
  background:
    linear-gradient(180deg, rgba(0,0,0,.08), rgba(0,0,0,.48)),
    linear-gradient(90deg, rgba(0,0,0,.26), rgba(0,0,0,.04)) !important;
}
.itinerary-lines { left: 24px !important; right: 24px !important; bottom: 28px !important; }
.itinerary-line {
  min-height: 54px !important;
  grid-template-columns: 72px 1fr !important;
  border-radius: 18px !important;
  background: rgba(244,243,238,.90) !important;
  border: 1px solid rgba(255,255,255,.62) !important;
  box-shadow: none !important;
}
.itinerary-line b, .itinerary-line span { color: var(--ink) !important; }

/* setup screen: keep only question cards */
.glass-panel, .form-shell, .api-error-card, .load-glass, .subscribe-modal {
  background: var(--panel) !important;
  border: 1px solid var(--line-strong) !important;
  box-shadow: none !important;
  backdrop-filter: none !important;
  border-radius: 28px !important;
}
.form-shell {
  background: transparent !important;
  border: 0 !important;
  padding: 0 !important;
  max-width: 880px !important;
}
.form-shell label, .field-block, .pi-card {
  background: var(--panel) !important;
  border: 1px solid var(--line-strong) !important;
  border-radius: 24px !important;
  padding: 24px !important;
}
input {
  background: var(--panel-2) !important;
  border: 1px solid var(--line-strong) !important;
  color: var(--ink) !important;
  border-radius: 18px !important;
  box-shadow: none !important;
}
input:focus { background: var(--panel-3) !important; border-color: rgba(0,0,0,.26) !important; }
.suggestion, .chip {
  background: var(--panel-2) !important;
  border: 1px solid var(--line-strong) !important;
  color: var(--ink-2) !important;
  border-radius: 999px !important;
  box-shadow: none !important;
}
.suggestion.active, .chip.active { background: var(--ink) !important; border-color: var(--ink) !important; color: #fff !important; }
.autocomplete-suggestions .suggestion span { display: none !important; }

/* mood */
.mood-header h2 { font-size: clamp(42px, 5.6vw, 76px) !important; }
.mood-header .gem { color: var(--ink) !important; }
.image-mood-tile {
  border-radius: 28px !important;
  border: 1px solid var(--line-strong) !important;
  box-shadow: none !important;
}
.image-mood-tile.active {
  border-color: var(--ink) !important;
  box-shadow: inset 0 0 0 2px var(--ink) !important;
}
.image-mood-tile:hover { transform: none !important; }
.bottom-cta.glass-panel, .build-cta-row {
  background: transparent !important;
  border: 0 !important;
  padding: 0 !important;
  margin: 34px 0 0 !important;
  display: flex !important;
  justify-content: flex-end !important;
  box-shadow: none !important;
}
.bottom-cta.glass-panel > div:first-child, .selected-chips, .profile-chip { display: none !important; }
.bottom-cta .btn-accent, .build-cta-row .btn-accent { min-width: 220px !important; }

/* loading visualization */
.loading-screen { background: var(--bg) !important; }
.loader-layout { width: min(980px, 100%) !important; gap: 34px !important; }
.constellation { width: min(560px, 84vw) !important; height: 280px !important; }
.constellation .halo { display: none !important; }
.constellation .seg { stroke-width: 5 !important; filter: none !important; }
.blue-stroke, .green-stroke, .red-stroke { stroke: var(--ink) !important; }
.yellow-stroke { stroke: var(--gold) !important; }
.constellation .blue, .constellation .green, .constellation .red { fill: var(--ink) !important; }
.constellation .yellow { fill: var(--gold) !important; }
.loading-copy { position: relative !important; }
.loading-copy::before, .loading-copy::after {
  position: absolute;
  top: -42px;
  border-radius: 999px;
  padding: 8px 14px;
  background: var(--panel-2);
  border: 1px solid var(--line-strong);
  color: var(--ink);
  font-size: 12px;
  font-weight: 900;
  animation: floatChip 3.4s ease-in-out infinite;
}
.loading-copy::before { content: "Places"; left: -80px; }
.loading-copy::after { content: "Diet"; right: -88px; animation-delay: .8s; }
@keyframes floatChip {
  0%, 100% { transform: translateY(0); opacity: .72; }
  50% { transform: translateY(-10px); opacity: 1; }
}
.load-glass {
  background: transparent !important;
  border: 0 !important;
  display: grid !important;
  grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  gap: 12px !important;
  padding: 0 !important;
}
.load-row {
  background: var(--panel) !important;
  border: 1px solid var(--line-strong) !important;
  border-radius: 18px !important;
  padding: 15px 16px !important;
  opacity: 1 !important;
  color: var(--ink-2) !important;
}
.load-row b { border: 0 !important; background: var(--panel-2) !important; }
.load-row.on b { background: var(--ink) !important; }
.load-row em { color: var(--ink-3) !important; }
.load-row.on em { color: var(--ink) !important; }

/* result */
.result-screen {
  max-width: 1280px !important;
  width: 100% !important;
  padding: 48px clamp(28px, 6vw, 80px) 80px !important;
}
.res-hero {
  min-height: 520px !important;
  border-radius: 34px !important;
  border: 1px solid var(--line-strong) !important;
  box-shadow: none !important;
}
.res-content h2 { color: #fff !important; font-size: clamp(48px, 6vw, 84px) !important; }
.res-dna-strip { display: none !important; }
.archetype-line { color: var(--gold) !important; font-weight: 800 !important; }
.res-summary { color: rgba(255,255,255,.72) !important; }
.res-tag {
  background: rgba(255,255,255,.14) !important;
  border: 1px solid rgba(255,255,255,.22) !important;
  color: #fff !important;
}
.action-bar {
  background: transparent !important;
  border: 0 !important;
  padding: 0 !important;
  margin: 24px 0 52px !important;
  box-shadow: none !important;
  display: flex !important;
  gap: 12px !important;
}
.action-bar .btn-accent, .action-bar .maps-trip-btn {
  background: var(--ink) !important;
  color: #fff !important;
  border-color: var(--ink) !important;
}
.action-bar .btn-outline {
  background: var(--panel-2) !important;
  color: var(--ink) !important;
  border-color: var(--line) !important;
}

/* timeline location icon */
.s-pin, .s-pin.featured {
  border-radius: 999px !important;
  background: var(--panel-2) !important;
  border: 1px solid var(--line-strong) !important;
  color: transparent !important;
  position: relative !important;
}
.s-pin::before {
  content: "";
  width: 10px;
  height: 10px;
  border: 2px solid var(--ink);
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
  display: block;
}
.s-pin::after {
  content: "";
  position: absolute;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: var(--ink);
  top: 11px;
  left: 12px;
}
.s-pin.featured { background: var(--gold) !important; border-color: var(--gold) !important; }
.s-photo {
  border-radius: 24px !important;
  box-shadow: none !important;
  border: 1px solid var(--line-strong) !important;
}
.s-photo:hover img { transform: none !important; }
.place-meta .rating-pill {
  color: var(--gold) !important;
  border-color: var(--gold-line) !important;
  background: var(--gold-soft) !important;
}

.modal-backdrop {
  background: rgba(120,120,114,.66) !important;
  backdrop-filter: blur(8px) !important;
}
.subscribe-modal { background: var(--panel-3) !important; }

@media(max-width: 900px) {
  .hero-inner { grid-template-columns: 1fr !important; }
  .load-glass { grid-template-columns: 1fr !important; }
}
@media(max-width: 760px) {
  .navbar {
    height: auto !important;
    min-height: 66px !important;
    padding: 10px 16px !important;
    gap: 12px !important;
  }
  .nav-steps { gap: 14px !important; overflow-x: auto !important; }
  .hero-left > p { font-size: 22px !important; }
  .showreel-frame { height: 410px !important; width: 100% !important; }
  .action-bar, .bottom-cta.glass-panel, .build-cta-row { width: 100% !important; }
  .action-bar button, .action-bar a, .bottom-cta .btn-accent, .build-cta-row .btn-accent {
    width: 100% !important;
    justify-content: center !important;
  }
}

`;

createRoot(document.getElementById("root")).render(<App />);
