// api/save-itinerary.js
// Stores itinerary JSON by short ID. In-memory for prototype —
// resets on cold start but persists across warm requests.
// Swap `store` for Upstash Redis / Vercel KV / Postgres when ready.

const store = new Map(); // id → { itinerary, destination, date, selectedMoods, diet, planFor }

function nanoid(len = 7) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";
  for (let i = 0; i < len; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

export default async function handler(req, res) {
  // ── CORS for local dev ──
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  // ── POST /api/save-itinerary  →  save & return { id } ──
  if (req.method === "POST") {
    const payload = req.body;
    if (!payload?.itinerary) {
      return res.status(400).json({ error: "Missing itinerary in body." });
    }

    // Re-use an existing ID if this exact itinerary was already saved
    // (cheap dedup: compare destination + date + first stop name)
    const fingerprint = [
      payload.itinerary?.destination,
      payload.date,
      payload.itinerary?.stops?.[0]?.name,
    ]
      .filter(Boolean)
      .join("|");

    for (const [existingId, existingPayload] of store.entries()) {
      const ef = [
        existingPayload.itinerary?.destination,
        existingPayload.date,
        existingPayload.itinerary?.stops?.[0]?.name,
      ]
        .filter(Boolean)
        .join("|");
      if (ef === fingerprint) {
        return res.status(200).json({ id: existingId });
      }
    }

    const id = nanoid(7);
    store.set(id, payload);
    return res.status(200).json({ id });
  }

  // ── GET /api/save-itinerary?id=abc1234  →  return payload ──
  if (req.method === "GET") {
    const id = String(req.query.id || "").trim();
    if (!id) return res.status(400).json({ error: "Missing id." });
    const payload = store.get(id);
    if (!payload) return res.status(404).json({ error: "Itinerary not found." });
    return res.status(200).json(payload);
  }

  return res.status(405).json({ error: "Use GET or POST." });
}
