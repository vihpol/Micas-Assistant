# MICAS Internal Resource Hub

Minimal full-stack internal resource hub for department links, forms,
announcements, search, and future AI assistance.

## Stack

- Frontend: Next.js, TypeScript, Tailwind CSS
- Backend: FastAPI
- Runtime: Docker Compose

## Setup

Create an environment file:

```bash
cp .env.example .env
```

Optional: add a Google Programmable Search Engine ID for embedded Google-style
search. Without this value, the frontend uses a curated internal resource search
so the hub still works immediately.

```env
NEXT_PUBLIC_GOOGLE_CSE_ID=your_engine_id_here
```

Optional: add your OpenAI API key for future AI-assisted answers. The current
homepage is search-hub-first; the backend keeps `/analyze` available as an
upgrade path.

```env
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-4.1-mini
```

Security note: never put `OPENAI_API_KEY` in frontend code or expose it with a `NEXT_PUBLIC_` variable. The frontend calls FastAPI only; FastAPI reads `OPENAI_API_KEY` from the backend environment.

Start the app:

```bash
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend health: http://localhost:8000/health

## MVP Features

- Prominent central search bar
- Google Programmable Search embed when `NEXT_PUBLIC_GOOGLE_CSE_ID` is set
- Curated internal resource search fallback when no Google engine ID is set
- Department resource areas for HR, Operations, and Marketing
- Quick links for common workflows
- Announcements
- Feedback capture for missing pages or zero-result searches
- Lightweight in-page adoption signals for recent searches and zero-result state

## Google Programmable Search Setup

1. Create a Programmable Search Engine in Google.
2. Configure it to search the internal/public sites you want included.
3. Copy the engine ID.
4. Add it to `.env`:

```env
NEXT_PUBLIC_GOOGLE_CSE_ID=your_engine_id_here
```

5. Rebuild the frontend:

```bash
docker compose up --build
```

The embedded widget uses:

```html
<script async src="https://cse.google.com/cse.js?cx=YOUR_ENGINE_ID"></script>
<div class="gcse-search"></div>
```

## Adoption Plan

Start with the search hub, watch what people search for, improve the links and
pages, then add AI only after repeated searches show where direct answers would
save time.

The frontend calls the backend through Next.js rewrites:

- Browser request: `http://localhost:3000/api/health`
- Docker internal target: `http://backend:8000/health`

`docker-compose.yml` passes `BACKEND_URL=http://backend:8000` to the frontend at build time and runtime so `docker compose up --build` works from a clean checkout.
It passes `OPENAI_API_KEY` and `OPENAI_MODEL` into the backend container only.

If `OPENAI_API_KEY` is set, the backend calls the OpenAI API. If it is missing, the backend returns mock workflow outputs with the same response shape.

## Test The API

Health check:

```bash
curl http://localhost:8000/health
```

Agent analysis:

```bash
curl -X POST http://localhost:8000/analyze \
  -H "Content-Type: application/json" \
  -d '{"category":"Operations","request":"Coordinate an inventory count"}'
```

You can also call the backend through the frontend proxy:

```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"category":"HR","request":"Prepare onboarding steps"}'
```

## Local Development Without Docker

Backend:

```bash
cd backend
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```
