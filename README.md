# UpBro

UpBro is a self-hosted uptime monitor for websites and APIs. You add HTTP endpoints with check intervals and expected status codes, and a background worker periodically pings them, records response latency, and logs downtime incidents when a target goes down.

## Setup

### Prerequisites
- Docker and Docker Compose

### Running with Docker Compose
The easiest way to run the full stack (API server, background worker, React frontend, MongoDB, and Redis) is with Docker Compose:

```bash
git clone https://github.com/callmekriztal/UpBro.git
cd UpBro
docker-compose up --build
```

Once running:
- Frontend: http://localhost:3000
- API: http://localhost:5000
- Health Check: http://localhost:5000/health

### Local Setup (Without Docker)
If you prefer running services directly:

1. Start local instances of MongoDB (port 27017) and Redis (port 6379).
2. Copy `server/.env.example` to `server/.env` and adjust settings if needed:
   - `PORT`: API server port (default 5000)
   - `MONGO_URI`: MongoDB connection string (`mongodb://localhost:27017/uptime_monitor`)
   - `REDIS_HOST`: Redis host (`127.0.0.1`)
   - `REDIS_PORT`: Redis port (`6379`)
   - `WORKER_CONCURRENCY`: Max parallel check jobs per worker (default 10)
   - `JWT_SECRET`: Secret key for JWT signing
3. Install dependencies and start the API server and worker:
   ```bash
   cd server
   npm install
   npm run dev
   ```
4. In another terminal, install dependencies and start the React client:
   ```bash
   cd client
   npm install
   npm run dev
   ```

## Project Structure

```
UpBro/
├── client/              # React frontend (Vite, Tailwind CSS)
├── server/              # Express API server and BullMQ worker
│   ├── __tests__/       # Integration tests (Jest, Supertest)
│   └── src/
│       ├── config/      # DB, Redis, and logger configurations
│       ├── controllers/ # Route handlers for auth, monitors, checks, incidents
│       ├── middleware/  # JWT auth, rate limiting, error handling
│       ├── models/      # Mongoose schemas (User, Monitor, Check, Incident)
│       ├── queue/       # BullMQ queue setup and job producer
│       ├── routes/      # Express API routes
│       ├── services/    # HTTP check execution and notification handlers
│       └── worker.js    # Standalone background worker process
└── docker-compose.yml   # Docker Compose setup for all services
```

## Models

- **User**: Stores user credentials (`name`, `email`, `password` hash). Used to scope monitors and check data to the account that created them.
- **Monitor**: Represents an endpoint to check. Stores target `url`, HTTP `method`, `interval` (minutes), `timeout` (ms), `expectedStatus` (e.g. 200), and `isActive` toggle.
- **Check**: Log of a single check execution performed by the worker. Stores `monitorId`, `statusCode`, `responseTime` in ms, `success` boolean, `errorMessage`, and `checkedAt` timestamp.
- **Incident**: Tracks downtime periods for a monitor. Created when a monitor fails 2 consecutive checks (`ongoing`), and updated with a `resolvedAt` timestamp and duration when checks pass again (`resolved`).

## Auth, Permissions, and Background Queue

### Auth & Permissions
Authentication is handled via JSON Web Tokens (JWT). Upon registering or logging in (`POST /api/auth/register` or `POST /api/auth/login`), the server returns a token. Clients pass this token in the `Authorization: Bearer <token>` header on protected endpoints (`/api/monitors/*`). An authentication middleware decodes the token, extracts `userId`, and ensures queries only return or modify monitors owned by that user.

### Background Queue & Messaging System
To prevent long-running HTTP checks from blocking API server routes, health checks are decoupled into a background queue using Redis and BullMQ:
- **Producer:** Every 15 seconds, a scheduler loop in the API process queries MongoDB for active monitors due for a check. It enqueues check jobs into Redis (`ping-checks-queue`) using a deterministic job ID (`ping-<monitorId>-<timeBucket>`) to prevent duplicate checks.
- **Worker:** A separate Node process (`src/worker.js`) consumes jobs from Redis, executes the HTTP requests with Axios, records the `Check` log, and updates `Incident` state in MongoDB. If a network error occurs, BullMQ retries up to 3 times with exponential backoff before marking the job failed.
- **Worker Heartbeat:** The worker writes a periodic heartbeat key to Redis every 10 seconds. The `/health` endpoint checks MongoDB, Redis, and this heartbeat key, returning `503 Service Unavailable` if the worker process stops.
- **Notifications:** When an incident opens or resolves, alert details pass through a `NotificationService` module that formats notifications to stdout or external alert channels.
