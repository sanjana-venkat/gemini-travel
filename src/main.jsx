import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const vibeImages = [
  { id: "lantern", title: "Lantern alleys", tag: "Romantic + local", img: "https://images.unsplash.com/photo-1524413840807-0c3cb6fa508d?q=80&w=1200" },
  { id: "nature", title: "Slow nature", tag: "Quiet + scenic", img: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=1200" },
  { id: "food", title: "Local food", tag: "Taste + discovery", img: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1200" },
  { id: "luxury", title: "Soft luxury", tag: "Beautiful + calm", img: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=1200" },
  { id: "hidden", title: "Hidden gems", tag: "Unexpected + intimate", img: "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?q=80&w=1200" },
  { id: "culture", title: "Culture walks", tag: "History + depth", img: "https://images.unsplash.com/photo-1526481280693-3bfa7568e0f3?q=80&w=1200" }
];

function App() {
  const [user, setUser] = useState(null);
  const [step, setStep] = useState("login");
  const [destination, setDestination] = useState("Kyoto");
  const [dates, setDates] = useState("June 20–22");
  const [diet, setDiet] = useState("Vegetarian");
  const [travelWith, setTravelWith] = useState("Partner");
  const [story, setStory] = useState("Celebrate");
  const [selectedVibes, setSelectedVibes] = useState(["lantern", "luxury"]);
  const [dna, setDna] = useState({
    pacing: 35,
    socialEnergy: 25,
    adventure: 48,
    structure: 62,
    discovery: 72
  });
  const [loadingLine, setLoadingLine] = useState(0);
  const [itinerary, setItinerary] = useState(null);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !window.google) return;

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response) => {
        const payload = JSON.parse(atob(response.credential.split(".")[1]));
        setUser({
          name: payload.name,
          email: payload.email,
          picture: payload.picture
        });
        setStep("destination");
      }
    });

    window.google.accounts.id.renderButton(
      document.getElementById("googleSignIn"),
      { theme: "outline", size: "large", shape: "pill", text: "continue_with" }
    );
  }, []);

  const loadingItems = useMemo(() => [
    user?.name || "Google profile",
    "Destination context",
    "Dietary preferences",
    "Visual vibe signals",
    "Travel DNA sliders",
    "Local recommendations",
    "Gemini itinerary generation"
  ], [user]);

  function toggleVibe(id) {
    setSelectedVibes((current) => {
      if (current.includes(id)) return current.filter((v) => v !== id);
      if (current.length >= 3) return current;
      return [...current, id];
    });
  }

  function updateDna(key, value) {
    setDna({ ...dna, [key]: Number(value) });
  }

  async function generateTrip() {
    setStep("loading");
    setLoadingLine(0);

    const interval = setInterval(() => {
      setLoadingLine((v) => Math.min(v + 1, loadingItems.length - 1));
    }, 650);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user,
          destination,
          dates,
          diet,
          travelWith,
          story,
          selectedVibes: selectedVibes.map((id) => vibeImages.find((v) => v.id === id)),
          dna
        })
      });

      const data = await res.json();
      setItinerary(data);
    } catch {
      setItinerary({
        destination,
        dates,
        selectedMood: story,
        travelDNA: dna,
        summary: "A personalized trip shaped around your current mood, visual preferences, and lightweight Google profile.",
        stops: [
          {
            time: "8:30",
            period: "AM",
            category: "Quiet start",
            name: `${destination} morning walk`,
            description: "Start slow with a scenic, low-crowd experience that matches your selected travel energy.",
            photoQuery: destination,
            routeFromPrevious: "Start of itinerary"
          },
          {
            time: "12:30",
            period: "PM",
            category: "Local flavor",
            name: "Vegetarian-friendly lunch",
            description: "A thoughtful food stop chosen around your dietary preferences and mood.",
            photoQuery: "vegetarian lunch travel",
            routeFromPrevious: "Short transit from previous stop"
          },
          {
            time: "5:30",
            period: "PM",
            category: "Signature moment",
            name: "Golden hour experience",
            description: "A memorable evening moment designed around the story you want this trip to tell.",
            photoQuery: "golden hour travel",
            routeFromPrevious: "Easy evening route"
          }
        ]
      });
    } finally {
      clearInterval(interval);
      setTimeout(() => setStep("result"), 900);
    }
  }

  return (
    <div className="app-shell">
      <style>{css}</style>

      {step === "login" && (
        <main className="hero-card">
          <p className="eyebrow">Powered by Gemini</p>
          <h1>Travel built around who you want to be today.</h1>
          <p className="hero-sub">
            Sign in with Google for a lightweight personal layer. For this MVP, we only use your name and profile photo.
          </p>
          <div id="googleSignIn" />
          <button className="text-btn" onClick={() => setStep("destination")}>Continue without sign in</button>
        </main>
      )}

      {step === "destination" && (
        <main className="product-card">
          <TopBar label="Destination" step={1} />
          <section className="center-form">
            <p className="mini">Step 1 of 3</p>
            <h2>Where are you headed?</h2>
            <p>We'll shape the trip around who you want to be today.</p>

            <input className="big-input" value={destination} onChange={(e) => setDestination(e.target.value)} />
            <input className="big-input" value={dates} onChange={(e) => setDates(e.target.value)} placeholder="Dates" />

            <div className="intelligence-card">
              <p className="card-kicker">Personal Intelligence Preview</p>
              <h3>We don't have full access to your Google Personal Intelligence yet.</h3>
              <p>
                We're working on it. Soon, we'll be able to skip these questions with your Google data.
                For now, give us a quick feeler.
              </p>
              {user && (
                <div className="profile-pill">
                  <img src={user.picture} />
                  <span>Signed in as {user.name}</span>
                </div>
              )}
            </div>

            <div className="quick-grid">
              <Select label="Dietary preference" value={diet} setValue={setDiet} options={["Vegetarian", "Vegan", "No restrictions", "Gluten-free"]} />
              <Select label="Traveling with" value={travelWith} setValue={setTravelWith} options={["Solo", "Partner", "Friends", "Family"]} />
              <Select label="Trip story" value={story} setValue={setStory} options={["Celebrate", "Reconnect", "Explore", "Recharge", "Learn", "Surprise me"]} />
            </div>

            <button className="primary" onClick={() => setStep("vibes")}>Continue</button>
          </section>
        </main>
      )}

      {step === "vibes" && (
        <main className="product-card">
          <TopBar label="Visual Feeler" step={2} />
          <section className="wide-section">
            <p className="mini">Choose up to 3</p>
            <h2>What feels like this trip?</h2>
            <p>Images give Gemini a faster read on the emotional texture you want.</p>

            <div className="image-grid">
              {vibeImages.map((vibe) => (
                <button
                  key={vibe.id}
                  className={`vibe-img ${selectedVibes.includes(vibe.id) ? "selected" : ""}`}
                  onClick={() => toggleVibe(vibe.id)}
                >
                  <img src={vibe.img} />
                  <div>
                    <strong>{vibe.title}</strong>
                    <span>{vibe.tag}</span>
                  </div>
                </button>
              ))}
            </div>

            <button className="primary" onClick={() => setStep("dna")}>Fine tune Travel DNA</button>
          </section>
        </main>
      )}

      {step === "dna" && (
        <main className="product-card">
          <TopBar label="Travel DNA" step={3} />
          <section className="center-form">
            <p className="mini">Final tuning</p>
            <h2>Your Travel DNA</h2>
            <p>Fine tune how the itinerary should feel before Gemini builds it.</p>

            <Slider label="Pacing" left="Relaxed" right="Structured" value={dna.pacing} onChange={(v) => updateDna("pacing", v)} />
            <Slider label="Social Energy" left="Private" right="Social" value={dna.socialEnergy} onChange={(v) => updateDna("socialEnergy", v)} />
            <Slider label="Adventure" left="Comfort" right="Exploratory" value={dna.adventure} onChange={(v) => updateDna("adventure", v)} />
            <Slider label="Planning" left="Spontaneous" right="Planned" value={dna.structure} onChange={(v) => updateDna("structure", v)} />
            <Slider label="Discovery" left="Familiar" right="Novel" value={dna.discovery} onChange={(v) => updateDna("discovery", v)} />

            <button className="primary" onClick={generateTrip}>Build with Gemini</button>
          </section>
        </main>
      )}

      {step === "loading" && (
        <main className="product-card loading-card">
          <div className="sparkle">✦</div>
          <h2>Analyzing Personal Intelligence</h2>
          <p>Creating a trip from your profile, feeler signals, and Travel DNA.</p>
          <div className="loading-list">
            {loadingItems.map((item, i) => (
              <div className={i <= loadingLine ? "done" : ""} key={item}>
                <span>{i <= loadingLine ? "✓" : "○"}</span>{item}
              </div>
            ))}
          </div>
        </main>
      )}

      {step === "result" && (
        <main className="product-card result-card">
          <section className="result-top">
            <p className="mini">Your trip in</p>
            <h2>{itinerary?.destination || destination}</h2>
            <p>{itinerary?.summary}</p>

            <div className="dna-strip">
              <DnaPill label="Pacing" value={dna.pacing} />
              <DnaPill label="Social" value={dna.socialEnergy} />
              <DnaPill label="Adventure" value={dna.adventure} />
              <DnaPill label="Planning" value={dna.structure} />
              <DnaPill label="Discovery" value={dna.discovery} />
            </div>
          </section>

          <section className="timeline">
            {(itinerary?.stops || []).map((stop, i) => (
              <article className="stop" key={i}>
                <div className="pin">⌖</div>
                <div className="stop-body">
                  <p className="stop-cat">{stop.category}</p>
                  <h3>{stop.time} <span>{stop.period}</span></h3>
                  <h4>{stop.name}</h4>
                  <p>{stop.description}</p>
                  <div className="photo-card">
                    <span>{stop.photoQuery || stop.name}</span>
                  </div>
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

function TopBar({ label, step }) {
  return (
    <div className="topbar">
      <div className="progress">
        {[1, 2, 3].map((n) => <span key={n} className={n <= step ? "on" : ""} />)}
        <b>{label}</b>
      </div>
      <div className="theme-toggle"><b>Light</b><span>Dark</span></div>
    </div>
  );
}

function Select({ label, value, setValue, options }) {
  return (
    <div>
      <p className="field-label">{label}</p>
      <div className="chip-row">
        {options.map((option) => (
          <button className={value === option ? "chip active" : "chip"} onClick={() => setValue(option)} key={option}>{option}</button>
        ))}
      </div>
    </div>
  );
}

function Slider({ label, left, right, value, onChange }) {
  return (
    <div className="slider-card">
      <div className="slider-head"><b>{label}</b><span>{left} ↔ {right}</span></div>
      <input type="range" min="0" max="100" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function DnaPill({ label, value }) {
  return <div className="dna-pill"><b>{label}</b><span style={{ width: `${value}%` }} /></div>;
}

const css = `
body {
  margin: 0;
  font-family: 'Google Sans', Inter, system-ui, sans-serif;
  background: radial-gradient(circle at 80% 10%, #d7f8ff 0, transparent 32%), radial-gradient(circle at 10% 0%, #d7e4ff 0, transparent 34%), #e9eef7;
  color: #1f1f1f;
}
button, input { font: inherit; }
.app-shell { min-height: 100vh; padding: 34px; display: grid; place-items: center; }
.hero-card, .product-card {
  width: min(1180px, calc(100vw - 72px));
  min-height: 760px;
  border-radius: 44px;
  background: rgba(248,250,254,.86);
  box-shadow: 0 30px 90px rgba(35,48,80,.14);
  border: 1px solid rgba(255,255,255,.72);
}
.hero-card { padding: 150px 72px; }
.eyebrow, .mini, .card-kicker, .field-label, .stop-cat {
  text-transform: uppercase; letter-spacing: .12em; font-size: 12px; font-weight: 800; color: #747775;
}
h1 { font-size: 72px; max-width: 820px; line-height: .95; letter-spacing: -.06em; margin: 18px 0 28px; }
h2 { font-size: 54px; line-height: 1; letter-spacing: -.05em; margin: 10px 0 14px; }
p { color: #6f7275; font-size: 18px; line-height: 1.6; }
.hero-sub { max-width: 620px; }
.text-btn { border: 0; background: transparent; color: #1a73e8; font-weight: 800; margin-top: 18px; cursor: pointer; }
.topbar { display:flex; justify-content:space-between; align-items:center; padding: 34px 54px; }
.progress { display:flex; align-items:center; gap: 8px; color:#747775; font-size:12px; letter-spacing:.1em; text-transform:uppercase; }
.progress span { width: 8px; height: 3px; background:#cfd5df; border-radius:9px; }
.progress span.on { width: 42px; background:#1a73e8; }
.theme-toggle { display:flex; gap:18px; background:rgba(255,255,255,.72); padding:10px 18px; border-radius:999px; color:#747775; }
.theme-toggle b { color:#1f1f1f; }
.center-form { max-width: 720px; margin: 70px auto; }
.wide-section { max-width: 980px; margin: 26px auto 60px; }
.big-input {
  width:100%; border:1px solid rgba(0,0,0,.1); background:white; border-radius:28px; padding:20px 24px; margin:10px 0; font-size:20px; outline:none;
}
.primary {
  border:0; background:#1a73e8; color:white; padding:18px 34px; border-radius:999px; font-weight:800; box-shadow:0 18px 45px rgba(26,115,232,.22); margin-top:24px; cursor:pointer;
}
.intelligence-card {
  margin: 26px 0; padding: 24px; border:1px solid rgba(0,0,0,.08); background:white; border-radius:28px;
}
.intelligence-card h3 { margin: 6px 0; font-size:22px; }
.profile-pill { display:inline-flex; align-items:center; gap:10px; padding:8px 14px; border-radius:999px; background:#e8f0fe; color:#1557b0; font-weight:700; }
.profile-pill img { width:26px; height:26px; border-radius:50%; }
.quick-grid { display:grid; gap:22px; }
.chip-row { display:flex; flex-wrap:wrap; gap:10px; margin-top:10px; }
.chip {
  border:1px solid rgba(0,0,0,.1); background:white; padding:11px 18px; border-radius:999px; cursor:pointer;
}
.chip.active { border-color:#1a73e8; background:#e8f0fe; color:#1557b0; font-weight:800; }
.image-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; margin-top:24px; }
.vibe-img {
  border:2px solid transparent; background:white; padding:0; border-radius:28px; overflow:hidden; text-align:left; cursor:pointer; box-shadow:0 8px 30px rgba(35,48,80,.08);
}
.vibe-img.selected { border-color:#1a73e8; box-shadow:0 0 0 6px rgba(26,115,232,.12); }
.vibe-img img { width:100%; height:160px; object-fit:cover; display:block; }
.vibe-img div { padding:16px; display:grid; gap:4px; }
.vibe-img span { color:#747775; font-size:14px; }
.slider-card {
  background:white; border:1px solid rgba(0,0,0,.08); border-radius:24px; padding:18px 20px; margin:14px 0;
}
.slider-head { display:flex; justify-content:space-between; gap:18px; margin-bottom:12px; }
.slider-head span { color:#747775; font-size:13px; }
input[type=range] { width:100%; accent-color:#1a73e8; }
.loading-card { display:grid; place-items:center; text-align:center; padding:80px; }
.sparkle { font-size:54px; color:#1a73e8; animation:pulse 1.3s infinite; }
@keyframes pulse { 50% { transform:scale(1.18); opacity:.6; } }
.loading-list { margin-top:24px; display:grid; gap:14px; text-align:left; min-width:360px; }
.loading-list div { color:#9aa0a6; font-weight:700; }
.loading-list .done { color:#1f1f1f; }
.loading-list span { color:#1a73e8; margin-right:12px; }
.result-card { overflow:auto; }
.result-top { max-width:860px; margin:54px auto 20px; }
.dna-strip { display:grid; grid-template-columns:repeat(5,1fr); gap:12px; margin-top:24px; }
.dna-pill { background:white; border-radius:18px; padding:14px; border:1px solid rgba(0,0,0,.08); }
.dna-pill span { display:block; height:5px; background:#1a73e8; border-radius:10px; margin-top:10px; }
.timeline { max-width:760px; margin:30px auto 90px; }
.stop { display:grid; grid-template-columns:42px 1fr; gap:18px; position:relative; margin-bottom:36px; }
.stop:after { content:""; position:absolute; left:20px; top:44px; bottom:-36px; width:1px; background:rgba(0,0,0,.1); }
.stop:last-child:after { display:none; }
.pin { width:42px; height:42px; border-radius:50%; background:white; border:2px solid #1a73e8; display:grid; place-items:center; color:#1a73e8; z-index:1; }
.stop h3 { font-size:34px; margin:0; letter-spacing:-.04em; }
.stop h3 span { font-size:15px; color:#747775; }
.stop h4 { font-size:24px; margin:6px 0; }
.photo-card {
  height:220px; border-radius:26px; margin:18px 0 10px; background:linear-gradient(135deg,#2f6f44,#d16b3a); display:flex; align-items:end; padding:22px; color:white; font-weight:800;
}
small { color:#747775; }
@media(max-width:800px){
  .app-shell{padding:12px}.hero-card,.product-card{width:100%;border-radius:30px;min-height:calc(100vh - 24px)}.hero-card{padding:90px 28px}h1{font-size:46px}h2{font-size:38px}.center-form,.wide-section,.result-top,.timeline{margin:30px 24px}.image-grid,.dna-strip{grid-template-columns:1fr}.topbar{padding:24px}.vibe-img img{height:190px}
}
`;

createRoot(document.getElementById("root")).render(<App />);
