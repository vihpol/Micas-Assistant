# MICAS Google + Gemini Search

Minimal full-stack search page using Google Programmable Search for results and
Gemini for a concise AI answer panel.

## Stack

- Frontend: Next.js, TypeScript, Tailwind CSS
- Backend: FastAPI
- Runtime: Docker Compose

## Setup

Create an environment file:

```bash
cp .env.example .env
```

Add a Google Programmable Search Engine ID so Google results can render on the
site:

```env
NEXT_PUBLIC_GOOGLE_CSE_ID=your_engine_id_here
```

Add a Gemini API key for the backend answer panel:

```env
GEMINI_API_KEY=your_gemini_key_here
GEMINI_MODEL=gemini-3.5-flash
```

Security note: never put `GEMINI_API_KEY` or `OPENAI_API_KEY` in frontend code or
expose them with a `NEXT_PUBLIC_` variable. The frontend calls FastAPI only;
FastAPI reads private keys from backend environment variables.

Start the app:

```bash
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend health: http://localhost:8000/health

## How It Works

The homepage has one search bar.

When a user searches:

- The page executes Google Programmable Search results in the browser.
- The frontend calls `POST /gemini-answer`.
- FastAPI calls Gemini from the backend using `GEMINI_API_KEY`.
- The page shows a Gemini answer beside Google results.

If `NEXT_PUBLIC_GOOGLE_CSE_ID` is missing, the page shows a setup message for
Google Programmable Search.

If `GEMINI_API_KEY` is missing, the Gemini panel shows a setup message instead
of making a fake response.

## Google Programmable Search

Create an engine in Google Programmable Search, copy the engine ID, and set:

```env
NEXT_PUBLIC_GOOGLE_CSE_ID=your_engine_id_here
```

The frontend loads:

```html
<script async src="https://cse.google.com/cse.js?cx=YOUR_ENGINE_ID"></script>
```

## API Checks

Health check:

```bash
curl http://localhost:8000/health
```

Gemini answer:

```bash
curl -X POST http://localhost:8000/gemini-answer \
  -H "Content-Type: application/json" \
  -d '{"query":"best inventory checklist"}'
```

You can also call the backend through the frontend proxy:

```bash
curl -X POST http://localhost:3000/api/gemini-answer \
  -H "Content-Type: application/json" \
  -d '{"query":"best inventory checklist"}'
```

## Existing OpenAI Endpoint

The previous `/analyze` endpoint remains in the backend as an optional future
workflow endpoint. It is not used by the current Google + Gemini search page.
