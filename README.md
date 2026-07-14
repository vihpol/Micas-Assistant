# micas-assistops

Minimal full-stack internal dashboard scaffold.

## Stack

- Frontend: Next.js, TypeScript, Tailwind CSS
- Backend: FastAPI
- Runtime: Docker Compose

## Setup

Create an environment file:

```bash
cp .env.example .env
```

Optional: add your OpenAI API key to `.env`.

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
