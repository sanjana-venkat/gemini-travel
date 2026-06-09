const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Use GET." });

  const input = String(req.query.input || "").trim();

  if (!GOOGLE_MAPS_API_KEY) {
    return res.status(200).json({ suggestions: [], error: "Missing GOOGLE_MAPS_API_KEY" });
  }

  if (input.length < 2) return res.status(200).json({ suggestions: [] });

  try {
    const response = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
        "X-Goog-FieldMask":
          "suggestions.placePrediction.placeId,suggestions.placePrediction.text,suggestions.placePrediction.structuredFormat"
      },
      body: JSON.stringify({ input, languageCode: "en" })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Autocomplete API error:", data);
      return res.status(200).json({
        suggestions: [],
        error: data?.error?.message || "Google Places Autocomplete failed"
      });
    }

    const suggestions = (data.suggestions || [])
      .map((item) => {
        const prediction = item.placePrediction;
        if (!prediction) return null;

        const mainText = prediction.structuredFormat?.mainText?.text;
        const secondaryText = prediction.structuredFormat?.secondaryText?.text;
        const label =
          mainText && secondaryText ? `${mainText}, ${secondaryText}` : prediction.text?.text;

        return label ? { label, placeId: prediction.placeId, source: "google" } : null;
      })
      .filter(Boolean)
      .slice(0, 6);

    return res.status(200).json({ suggestions });
  } catch (error) {
    console.error("Autocomplete route crashed:", error);
    return res.status(200).json({
      suggestions: [],
      error: error.message || "Autocomplete route crashed"
    });
  }
}
