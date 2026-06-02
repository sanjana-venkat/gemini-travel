# Travel DNA

A reusable Gemini Canvas/Gem starter package for creating personalized travel itineraries as beautiful interactive HTML visualizations.

This repo is designed around one principle:

> Optimize the trip around the person, not just the destination.

The LLM plans the itinerary first using `skills.md`, `personal-intelligence-schema.md`, and `itinerary-contract.json`. The final output is a polished self-contained HTML itinerary visualization.

## What this package does

Given:

- Place
- Dates
- Intent
- Optional mood
- Optional constraints
- Optional personal context

The model should:

1. Infer the user's travel mood and personal needs.
2. Create a personalized itinerary.
3. Render the final decided itinerary as a beautiful HTML page.
4. Include itinerary cards, visual place imagery, a static route preview, edit mode, add/delete stops, and a success confirmation modal.

## Folder structure

```txt
gemini-travel-intelligence/
  README.md
  design.md
  gem-instructions.md
  canvas-prompt.md
  personal-intelligence-schema.md
  itinerary-contract.json
  example-output.json
  skills.md
  app/
    index.html
```

## How to use in Gemini Canvas

1. Upload this folder or import it as a GitHub repo.
2. Open `canvas-prompt.md`.
3. Paste that prompt into Gemini Canvas.
4. Ask it to create a Canvas app using this package as the source of truth.
5. Give it a request like:

```txt
Place: Dallas
Dates: Saturday
Intent: hidden gems, vegetarian-friendly food, aesthetic but not too touristy
```

## Important constraint

The final HTML should not require API keys.

The model should plan the itinerary before writing the HTML. The HTML is a visualization of the already-decided itinerary. It should not call Google Maps, Places, Calendar, OpenTable, or any external booking API.

Use simulated route previews, simulated booking confirmations, and styled visual cards.
