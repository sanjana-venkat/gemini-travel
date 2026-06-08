const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

function stripCodeFence(text = "") {
  return text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
}

function safeJsonParse(text) {
  const clean = stripCodeFence(text);
  try {
    return JSON.parse(clean);
  } catch {
    const match = clean.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Gemini did not return JSON.");
    return JSON.parse(match[0]);
  }
}

async function searchGooglePlace({ query, destination }) {
  if (!GOOGLE_MAPS_API_KEY) return null;

  const textQuery = `${query} ${destination}`.trim();

  const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
      "X-Goog-FieldMask": [
        "places.id",
        "places.displayName",
        "places.formattedAddress",
        "places.rating",
        "places.userRatingCount",
        "places.googleMapsUri",
        "places.currentOpeningHours.openNow",
        "places.photos"
      ].join(",")
    },
    body: JSON.stringify({
      textQuery,
      maxResultCount: 1,
      languageCode: "en"
    })
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Places API error:", data);
    return null;
  }

  return data?.places?.[0] || null;
}

function photoUrlFromPlace(place) {
  const photoName = place?.photos?.[0]?.name;
  if (!photoName || !GOOGLE_MAPS_API_KEY) return null;

  return `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=1200&maxHeightPx=800&key=${GOOGLE_MAPS_API_KEY}`;
}

async function enrichStopWithPlaces(stop, destination) {
  const searchQuery = stop.photoQuery || stop.name;
  const place = await searchGooglePlace({ query: searchQuery, destination });

  if (!place) return stop;

  return {
    ...stop,
    name: stop.name || place.displayName?.text,
    placeId: place.id,
    googlePlaceName: place.displayName?.text,
    address: place.formattedAddress,
    rating: place.rating,
    userRatingCount: place.userRatingCount,
    openNow: place.currentOpeningHours?.openNow,
    mapsUrl: place.googleMapsUri,
    imageUrl: photoUrlFromPlace(place)
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Use POST." });
  }

  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: "Missing GEMINI_API_KEY in Vercel environment variables." });
  }

  try {
    const {
      user,
      destination,
      dates,
      diet,
      travelWith,
      travelerProfile = [],
      selectedMoods = []
    } = req.body || {};

    const travelerText = travelerProfile
      .map((item) => `${item.title}: ${item.description}`)
      .join("; ");

    const moodText = selectedMoods
      .map((item) => `${item.title}: ${item.signal || item.tag}`)
      .join("; ");

    const prompt = `
You are Travel DNA, a mood-first planner powered by Gemini.

Create a REAL, SPECIFIC itinerary for:
Destination: ${destination}
Date: ${dates}
Diet: ${diet}
Planning for: ${travelWith}
User: ${user?.name || "guest"}

Long-term traveler profile:
${travelerText || "No traveler profile selected"}

Today's mood layer:
${moodText || "No mood selected"}

Rules:
- Generate concrete places in or near the destination. No generic placeholders.
- Make the plan feel like traveler profile + today's mood combined.
- It should not feel like a generic tourist top-10.
- Respect dietary preference.
- Include 4 to 6 stops.
- For restaurants, choose places likely compatible with the dietary preference.
- Include routeFromPrevious for each stop.
- Include photoQuery as the exact Google Maps search query that should find that stop.
- Return ONLY valid JSON. No markdown.

JSON schema:
{
  "destination": "string",
  "dates": "string",
  "selectedMood": "string",
  "summary": "string",
  "stops": [
    {
      "time": "8:30",
      "period": "AM",
      "category": "DAWN · NATURE",
      "name": "Specific place name",
      "description": "Specific reason this stop matches the user's profile and today's mood",
      "photoQuery": "Specific place name, destination",
      "routeFromPrevious": "short route note"
    }
  ]
}
`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.8,
            responseMimeType: "application/json"
          }
        })
      }
    );

    const raw = await geminiRes.json();

    if (!geminiRes.ok) {
      return res.status(500).json({
        error: raw?.error?.message || "Gemini API request failed."
      });
    }

    const text = raw?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return res.status(500).json({ error: "Gemini returned an empty response." });
    }

    const itinerary = safeJsonParse(text);

    const stops = Array.isArray(itinerary.stops) ? itinerary.stops : [];
    itinerary.stops = await Promise.all(
      stops.map((stop) => enrichStopWithPlaces(stop, itinerary.destination || destination))
    );

    return res.status(200).json(itinerary);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: error.message || "Could not generate itinerary."
    });
  }
}
