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
  const [destination, setDestination] = useState("Kyoto, Japan");
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
                  {item.source === "google" && <span>Maps</span>}
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
              <span className="res-tag">{travelArchetype.name}</span>
              <h2>{itinerary?.destination || destination}</h2>
              <p>{itinerary?.dates || prettyDate(date)}</p>
              <div className="res-dna-strip">
                {selectedMoodObjects.map((mood) => (
                  <span key={mood.id}>Today: {mood.title}</span>
                ))}
              </div>
              <p className="archetype-line">{travelArchetype.line}</p>
              {itinerary?.summary && <p className="res-summary">{itinerary.summary}</p>}
              {itinerary?.generatedBy === "fallback" && (
                <div className="fallback-banner">
                  <span>Demo fallback</span>
                  <p>
                    Gemini free-tier credits are limited, so Travel DNA generated this
                    preview locally while still attempting to enrich places with Google Places.
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
            <button className="btn-outline" onClick={() => setStep("mood")}>
              Change mood
            </button>
            <button className="btn-accent" onClick={generatePlan}>
              Regenerate ✦
            </button>
            {tripMapsUrl && (
              <a className="btn-outline maps-trip-btn" href={tripMapsUrl} target="_blank" rel="noreferrer">
                Open trip in Google Maps
              </a>
            )}
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
                You’re on the list. For now this is saved locally for the prototype.
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

.nav-steps {
  display: flex;
  align-items: center;
  gap: 8px;
}

.nav-left {
  justify-content: flex-start;
}

.nav-steps button {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid transparent;
  background: transparent;
  font-size: 12px;
  font-weight: 800;
  color: var(--ink3);
  transition: background .2s, color .2s, border-color .2s;
}

.nav-steps button:hover:not(:disabled) {
  background: rgba(255,255,255,.05);
  color: var(--ink2);
}

.nav-steps button.active {
  color: var(--ink);
  background: rgba(255,255,255,.07);
  border-color: var(--bdr2);
}

.nav-steps button.done {
  color: var(--accent);
}

.nav-steps button:disabled {
  opacity: .32;
  cursor: not-allowed;
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

.mood-grid.image-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
  width: 100%;
}

.image-mood-tile {
  position: relative;
  overflow: hidden;
  border: 2px solid transparent;
  border-radius: 32px;
  padding: 0;
  text-align: left;
  background: var(--s2);
  color: white;
  height: 260px;
  min-height: 260px;
  box-shadow: 0 20px 70px rgba(0,0,0,.22);
  transition: transform .28s var(--ease), border-color .2s, box-shadow .2s, opacity .2s;
}

.image-mood-tile:hover {
  transform: translateY(-3px);
  box-shadow: 0 28px 90px rgba(0,0,0,.32);
}

.image-mood-tile.active {
  border-color: var(--blue);
  box-shadow:
    0 0 0 4px rgba(66,133,244,.18),
    0 28px 90px rgba(0,0,0,.34);
}

.image-mood-tile img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: brightness(.56) saturate(.92);
  transition: transform .75s var(--ease), filter .35s;
}

.image-mood-tile:hover img,
.image-mood-tile.active img {
  transform: scale(1.07);
  filter: brightness(.72) saturate(1.08);
}

.image-tile-overlay {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(to top, rgba(0,0,0,.84), rgba(0,0,0,.20) 54%, rgba(0,0,0,.08)),
    radial-gradient(circle at 80% 8%, rgba(66,133,244,.20), transparent 30%);
}

.tile-number {
  position: absolute;
  left: 22px;
  top: 20px;
  z-index: 2;
  font-size: 12px;
  letter-spacing: .12em;
  font-weight: 800;
  color: rgba(255,255,255,.58);
}

.image-tile-content {
  position: absolute;
  left: 22px;
  right: 22px;
  bottom: 22px;
  z-index: 2;
}

.image-tile-content strong {
  display: block;
  font-size: clamp(23px, 2.5vw, 32px);
  line-height: 1;
  letter-spacing: -.035em;
}

.image-tile-content p {
  margin: 9px 0 0;
  color: rgba(255,255,255,.70);
  font-size: 14px;
  line-height: 1.35;
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
  width: min(540px, 80vw);
  height: 290px;
  display: grid;
  place-items: center;
}

.constellation svg {
  width: 100%;
  height: 100%;
  overflow: visible;
}

.constellation .seg {
  stroke-width: 4;
  stroke-linecap: round;
  stroke-dasharray: 120;
  stroke-dashoffset: 120;
  opacity: 0;
  filter: drop-shadow(0 0 12px rgba(66,133,244,.35));
  transition: stroke-dashoffset .55s var(--ease), opacity .35s;
}

.blue-stroke { stroke: #4285F4; }
.green-stroke { stroke: #34A853; }
.yellow-stroke { stroke: #FBBC04; }
.red-stroke { stroke: #EA4335; }

.constellation .node {
  opacity: .15;
  transform: scale(.7);
  transform-origin: center;
  filter: url(#starGlow);
  transition: opacity .35s, transform .45s var(--spring);
}

.constellation .blue { fill: #4285F4; }
.constellation .green { fill: #34A853; }
.constellation .yellow { fill: #FBBC04; }
.constellation .red { fill: #EA4335; }

.constellation .halo {
  fill: none;
  stroke: rgba(255,255,255,.12);
  stroke-width: 1;
  opacity: 0;
  transform-origin: center;
  animation: haloPulse 2.8s ease-in-out infinite;
}

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

.constellation.progress-6 .halo {
  opacity: .7;
}

@keyframes haloPulse {
  0%,100% { transform: scale(.75); opacity: .10; }
  50% { transform: scale(1.15); opacity: .35; }
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
  .mood-grid.image-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
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
  .mood-grid.image-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .image-mood-tile {
    height: 230px;
    min-height: 230px;
  }

  .bottom-cta {
    flex-direction: column;
    align-items: stretch;
  }
}

@media(max-width: 600px) {
  .navbar {
    padding: 0 16px;
  }

  .nav-steps button {
    padding: 7px 10px;
  }

  .screen {
    padding: 40px 20px;
  }

  .mood-grid.image-grid {
    grid-template-columns: 1fr;
  }

  .image-mood-tile {
    height: 220px;
    min-height: 220px;
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


.fallback-banner {
  margin-top: 18px;
  width: min(760px, 100%);
  border: 1px solid rgba(251,188,4,.24);
  background:
    radial-gradient(circle at 12% 20%, rgba(251,188,4,.10), transparent 34%),
    rgba(255,255,255,.055);
  border-radius: 22px;
  padding: 16px 18px;
  backdrop-filter: blur(14px);
}

.fallback-banner span {
  display: inline-flex;
  color: #fbbc04;
  font-size: 11px;
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
  color: rgba(255,255,255,.70);
}

.fallback-banner button {
  border: 0;
  border-radius: 999px;
  padding: 9px 14px;
  background: rgba(251,188,4,.16);
  color: #ffd56a;
  font-weight: 900;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 500;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(0,0,0,.62);
  backdrop-filter: blur(16px);
}

.subscribe-modal {
  width: min(620px, 100%);
  border-radius: 34px;
  padding: 34px;
  position: relative;
}

.subscribe-modal h2 {
  margin-top: 6px;
  font-size: clamp(40px, 6vw, 64px);
}

.modal-close {
  position: absolute;
  right: 22px;
  top: 18px;
  width: 38px;
  height: 38px;
  border-radius: 999px;
  border: 1px solid var(--bdr);
  background: rgba(255,255,255,.06);
  color: var(--ink);
  font-size: 24px;
}

.subscribe-form {
  display: flex;
  gap: 10px;
  margin-top: 22px;
}

.subscribe-form input {
  flex: 1;
}

.subscribe-success {
  margin-top: 14px;
  border-radius: 18px;
  padding: 12px 14px;
  background: var(--accent2);
  color: var(--accent);
  font-size: 13px;
  font-weight: 800;
}


/* Equal image mood grid override */
.mood-grid.image-grid {
  display: grid !important;
  grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
  gap: 18px !important;
  width: 100% !important;
}

.image-mood-tile {
  height: 260px !important;
  min-height: 260px !important;
  grid-column: span 1 !important;
  grid-row: span 1 !important;
  border-radius: 32px !important;
}

.image-mood-tile.active .mood-check,
.mood-check {
  display: none !important;
}

@media(max-width: 900px) {
  .mood-grid.image-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  }
}

@media(max-width: 620px) {
  .mood-grid.image-grid {
    grid-template-columns: 1fr !important;
  }

  .subscribe-form {
    flex-direction: column;
  }
}


.place-meta.prominent {
  margin: 8px 0 14px;
}

.place-meta.prominent span,
.place-meta.prominent a {
  background: rgba(255,255,255,.075);
}

.place-meta .rating-pill {
  color: #fbbc04;
  border-color: rgba(251,188,4,.24);
  background: rgba(251,188,4,.10);
}

.place-meta .demo-pill {
  color: var(--ink3);
  border-color: rgba(255,255,255,.08);
  background: rgba(255,255,255,.035);
}


.nav-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.nav-subscribe {
  padding: 10px 18px;
}

.autocomplete-suggestions .suggestion {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.autocomplete-suggestions .suggestion span {
  color: var(--accent);
  background: var(--accent2);
  border-radius: 999px;
  padding: 2px 7px;
  font-size: 10px;
  font-weight: 900;
}

.autocomplete-loading {
  display: inline-flex;
  align-items: center;
  padding: 8px 12px;
  color: var(--ink3);
  font-size: 12px;
  font-weight: 700;
}

.result-screen {
  max-width: 1120px !important;
  width: 100% !important;
  padding: 48px 40px 80px !important;
  margin: 0 auto;
}

.res-hero {
  height: auto !important;
  min-height: 420px;
  border-radius: 36px;
  border: 1px solid var(--bdr);
  overflow: hidden;
  background: var(--s2);
}

.res-content {
  left: 0 !important;
  transform: none !important;
  width: 100% !important;
  padding: 52px clamp(28px, 6vw, 76px) !important;
}

.action-bar {
  position: static !important;
  top: auto !important;
  border: 1px solid var(--bdr);
  border-radius: 999px;
  margin: 22px 0 0;
  padding: 12px !important;
  width: fit-content;
  background: rgba(19,25,32,.74);
}

.timeline {
  max-width: 100% !important;
  padding-left: 0 !important;
  padding-right: 0 !important;
}

@media(max-width: 720px) {
  .nav-actions {
    gap: 6px;
  }

  .nav-subscribe {
    display: none;
  }

  .result-screen {
    padding: 28px 20px 70px !important;
  }

  .action-bar {
    width: 100%;
    justify-content: center;
    border-radius: 28px;
  }
}


/* Final navigation, archetype, and maps refinements */
.nav-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.nav-subscribe {
  padding: 10px 18px;
}

.archetype-line {
  margin: 14px 0 0;
  color: var(--accent);
  font-size: 15px;
  font-weight: 800;
}

.maps-trip-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
}

.s-photo span {
  max-width: calc(100% - 34px);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.autocomplete-suggestions .suggestion {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.autocomplete-suggestions .suggestion span {
  color: var(--accent);
  background: var(--accent2);
  border-radius: 999px;
  padding: 2px 7px;
  font-size: 10px;
  font-weight: 900;
}

.autocomplete-loading {
  display: inline-flex;
  align-items: center;
  padding: 8px 12px;
  color: var(--ink3);
  font-size: 12px;
  font-weight: 700;
}

@media(max-width: 720px) {
  .nav-subscribe {
    padding: 9px 13px;
  }

  .action-bar {
    gap: 8px;
  }

  .maps-trip-btn {
    width: 100%;
  }
}
`;

createRoot(document.getElementById("root")).render(<App />);
