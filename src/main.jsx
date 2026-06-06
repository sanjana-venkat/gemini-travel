import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const vibeCards = [
  { id: 'hidden', title: 'Hidden alleys', sub: 'Quiet local details', img: 'linear-gradient(135deg,#2D3748,#8B5E34)', tags: ['local', 'intimate'] },
  { id: 'temple', title: 'Temple mornings', sub: 'Calm and reflective', img: 'linear-gradient(135deg,#31572C,#90A955)', tags: ['culture', 'slow'] },
  { id: 'market', title: 'Food markets', sub: 'Taste and texture', img: 'linear-gradient(135deg,#9A3412,#FDBA74)', tags: ['food', 'social'] },
  { id: 'nature', title: 'Nature escape', sub: 'Open air reset', img: 'linear-gradient(135deg,#064E3B,#5EEAD4)', tags: ['nature', 'exploratory'] },
  { id: 'ryokan', title: 'Soft luxury', sub: 'Romantic and polished', img: 'linear-gradient(135deg,#581C87,#F0ABFC)', tags: ['romantic', 'planned'] },
  { id: 'creative', title: 'Design walk', sub: 'Shops, craft, beauty', img: 'linear-gradient(135deg,#1E3A8A,#93C5FD)', tags: ['creator', 'novel'] }
];

const defaultSliders = {
  pacing: 35,
  socialEnergy: 25,
  adventure: 48,
  structure: 64,
  discovery: 70
};

function decodeJwt(token) {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
}

function GoogleLogin({ onUser }) {
  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId || !window.google) return;
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => {
        const profile = decodeJwt(response.credential);
        if (profile) {
          onUser({ name: profile.name, email: profile.email, picture: profile.picture });
        }
      }
    });
    window.google.accounts.id.renderButton(document.getElementById('googleSignIn'), {
      theme: 'outline',
      size: 'large',
      shape: 'pill',
      text: 'continue_with',
      width: 280
    });
  }, [onUser]);

  return <div id="googleSignIn" className="google-btn" />;
}

function Slider({ label, left, right, value, onChange }) {
  return (
    <div className="slider-row">
      <div className="slider-top"><span>{label}</span><span>{value}</span></div>
      <input type="range" min="0" max="100" value={value} onChange={(e) => onChange(Number(e.target.value))} />
      <div className="slider-labels"><span>{left}</span><span>{right}</span></div>
    </div>
  );
}

function App() {
  const [screen, setScreen] = useState('login');
  const [user, setUser] = useState(null);
  const [destination, setDestination] = useState('Kyoto');
  const [dates, setDates] = useState('June 20–22');
  const [intent, setIntent] = useState('Romantic anniversary trip');
  const [dietary, setDietary] = useState('Vegetarian');
  const [selectedVibes, setSelectedVibes] = useState(['ryokan', 'temple']);
  const [sliders, setSliders] = useState(defaultSliders);
  const [loadingStep, setLoadingStep] = useState(0);
  const [itinerary, setItinerary] = useState(null);
  const [error, setError] = useState('');

  const selectedTags = useMemo(() => {
    return vibeCards.filter(v => selectedVibes.includes(v.id)).flatMap(v => v.tags);
  }, [selectedVibes]);

  function toggleVibe(id) {
    setSelectedVibes(prev => prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id].slice(-3));
  }

  async function generateTrip() {
    setScreen('loading');
    setError('');
    setLoadingStep(0);
    const timer = setInterval(() => setLoadingStep(v => Math.min(v + 1, 4)), 650);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: user ? { name: user.name } : null,
          destination,
          dates,
          intent,
          dietary,
          selectedVibes: vibeCards.filter(v => selectedVibes.includes(v.id)),
          sliders
        })
      });
      if (!res.ok) throw new Error('Could not generate itinerary');
      const data = await res.json();
      setItinerary(data);
      setScreen('itinerary');
    } catch (e) {
      setError(e.message || 'Something went wrong.');
      setScreen('taste');
    } finally {
      clearInterval(timer);
    }
  }

  return (
    <div className="page-shell">
      <main className="app-shell">
        {screen === 'login' && (
          <section className="screen hero-screen">
            <div className="brand-pill">Powered by Gemini</div>
            <h1>Travel built around who you want to be today.</h1>
            <p>Sign in with Google for a lightweight personal layer. For this MVP, we only use your name and profile photo.</p>
            <GoogleLogin onUser={(u) => { setUser(u); setScreen('setup'); }} />
            <button className="ghost-btn" onClick={() => setScreen('setup')}>Continue without sign in</button>
          </section>
        )}

        {screen === 'setup' && (
          <section className="screen setup-screen">
            <Header user={user} />
            <h2>Where are you headed?</h2>
            <div className="form-grid">
              <label>Destination<input value={destination} onChange={e => setDestination(e.target.value)} /></label>
              <label>Dates<input value={dates} onChange={e => setDates(e.target.value)} /></label>
              <label>Intent<input value={intent} onChange={e => setIntent(e.target.value)} /></label>
              <label>Dietary needs<input value={dietary} onChange={e => setDietary(e.target.value)} /></label>
            </div>
            <button className="primary-btn" onClick={() => setScreen('taste')}>Choose my travel DNA</button>
          </section>
        )}

        {screen === 'taste' && (
          <section className="screen taste-screen">
            <Header user={user} />
            <h2>Pick the images that feel like this trip.</h2>
            <p className="muted">Choose up to 3. These become your implicit vibe signal.</p>
            <div className="vibe-grid">
              {vibeCards.map(card => (
                <button key={card.id} className={`vibe-card ${selectedVibes.includes(card.id) ? 'selected' : ''}`} onClick={() => toggleVibe(card.id)}>
                  <div className="vibe-img" style={{ background: card.img }} />
                  <div><strong>{card.title}</strong><span>{card.sub}</span></div>
                </button>
              ))}
            </div>
            <div className="dna-panel">
              <h3>Fine tune your Travel DNA</h3>
              <Slider label="Pacing" left="Relaxed" right="Structured" value={sliders.pacing} onChange={v => setSliders({ ...sliders, pacing: v })} />
              <Slider label="Social Energy" left="Private" right="Social" value={sliders.socialEnergy} onChange={v => setSliders({ ...sliders, socialEnergy: v })} />
              <Slider label="Adventure" left="Comfort" right="Exploratory" value={sliders.adventure} onChange={v => setSliders({ ...sliders, adventure: v })} />
              <Slider label="Structure" left="Spontaneous" right="Planned" value={sliders.structure} onChange={v => setSliders({ ...sliders, structure: v })} />
              <Slider label="Discovery" left="Familiar" right="Novel" value={sliders.discovery} onChange={v => setSliders({ ...sliders, discovery: v })} />
            </div>
            {error && <p className="error">{error}</p>}
            <button className="primary-btn sticky" onClick={generateTrip}>Generate itinerary</button>
          </section>
        )}

        {screen === 'loading' && (
          <section className="screen loading-screen">
            <div className="gemini-spinner"><span/><span/><span/><span/></div>
            <h2>Reading your travel self</h2>
            {['Profile basics', 'Visual vibe signals', 'Travel DNA sliders', 'Dietary preferences', 'Local itinerary design'].map((s, i) => (
              <div className={`load-row ${i <= loadingStep ? 'on' : ''}`} key={s}><b />{s}<span>{i <= loadingStep ? 'Done' : ''}</span></div>
            ))}
          </section>
        )}

        {screen === 'itinerary' && itinerary && (
          <section className="screen itinerary-screen">
            <Header user={user} />
            <button className="back-btn" onClick={() => setScreen('taste')}>← Edit DNA</button>
            <p className="eyebrow">Your day in</p>
            <h2>{itinerary.destination}</h2>
            <p className="muted">{itinerary.dates} · {itinerary.intent}</p>
            <div className="dna-chips">
              {Object.entries(itinerary.travelDNA || sliders).map(([k, v]) => <span key={k}>{k}: {v}</span>)}
            </div>
            <div className="map-preview">
              <h3>Route preview</h3>
              <a href={`https://www.google.com/maps/dir/${(itinerary.stops || []).map(s => encodeURIComponent(s.mapsQuery || s.name)).join('/')}`} target="_blank" rel="noreferrer">Open full route in Google Maps</a>
            </div>
            <div className="timeline">
              {(itinerary.stops || []).map((stop, index) => (
                <article className="stop" key={index}>
                  <div className="stop-rail"><div className="stop-dot">✦</div></div>
                  <div className="stop-main">
                    <p className="stop-time">{stop.time} · {stop.duration}</p>
                    <h3>{stop.name}</h3>
                    <p>{stop.description}</p>
                    <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stop.mapsQuery || stop.name)}`} target="_blank" rel="noreferrer">Open in Maps</a>
                    <div className="stop-photo" style={{ backgroundImage: `url('https://source.unsplash.com/900x600/?${encodeURIComponent(stop.photoQuery || stop.name)}')` }}>
                      <span>{stop.category}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function Header({ user }) {
  return <div className="topbar"><div className="logo">Travel DNA</div>{user && <div className="user-chip"><img src={user.picture} />{user.name?.split(' ')[0]}</div>}</div>;
}

createRoot(document.getElementById('root')).render(<App />);
