# QueueCure

> **Live digital queue manager for neighbourhood clinics**,  built for Queue Cure '26 hackathon on Wooble.
 
🔗 **Live Demo:** [queue-cure-bay.vercel.app](https://queue-cure-bay.vercel.app)  
📦 **Backend:** [queuecure-77y9.onrender.com](https://queuecure-77y9.onrender.com)
 
---
 
## The Problem
 
76% of India's 1.5 million clinics run on paper token slips and shouting. Patients wait 2–3 hours with zero visibility into when they'll be called. Receptionists manage everything from memory.
 
## The Solution
 
A real-time digital queue system with two screens:
 
- **Receptionist Panel** -> add patients, call next token, set consultation time
- **Patient Waiting Room** -> see current token, position in queue, estimated wait time

Both screens sync live the moment "Call Next" is clicked, no refresh needed.

A real-time clinic queue management system built with React, Node.js, Socket.IO, and MongoDB. It gives a **Receptionist** view to manage the queue and a **Waiting Room** display that updates live for patients.

---

## Features

- Token-based queue with auto-incrementing token numbers
- Real-time updates pushed to all connected clients via WebSocket
- Duplicate phone number detection (prevents same patient queuing twice)
- Adjustable average consultation time for dynamic wait estimates
- End-of-day queue reset
- Separate Receptionist and Waiting Room views
- Rate limiting, CORS, helmet, and compression on the server

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, react-router-dom, socket.io-client, axios |
| Backend | Node.js, Express 5, Socket.IO 4 |
| Database | MongoDB via Mongoose 9 |
| Deployment | Client → Vercel, Server → Render |

---

## Project Structure

```
QueueCure/
├── client/                     # React frontend (Vite)
│   └── src/
│       ├── config/
│       │   ├── api.js          # Axios instance with error interceptors
│       │   └── socket.js       # Socket.IO client singleton
│       └── pages/
│           ├── Receptionist.jsx  # Staff view: add patients, call next, reset
│           └── WaitingRoom.jsx   # Patient display: now serving + queue list
│
└── server/                     # Express backend
    ├── server.js               # Entry point: HTTP + Socket.IO setup
    └── src/
        ├── config/database.js
        ├── models/
        │   ├── Patient.js      # token, name, phone, status (waiting/serving/done)
        │   └── Session.js      # currentToken, lastToken, avgConsultTime, totalServed
        ├── controllers/
        │   ├── patientController.js
        │   ├── queueController.js
        │   └── sessionController.js
        ├── services/
        │   ├── queueService.js   # Core queue logic (add, callNext, reset, waitTime)
        │   └── socketService.js  # broadcastState helper
        └── routes/
            ├── patientRoutes.js
            ├── queueRoutes.js
            └── sessionRoutes.js
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A MongoDB Atlas cluster (or local MongoDB)

### 1. Clone and install

```bash
git clone <repo-url>
cd QueueCure

# Server
cd server && npm install

# Client
cd ../client && npm install
```

### 2. Environment variables

**server/.env**
```env
PORT=
MONGODB_URI=
CLIENT_URL=
NODE_ENV=development
```

**client/.env** (optional — defaults work for local dev)
```env
VITE_API_URL=http://localhost:PORT/api
VITE_SOCKET_URL=http://localhost:PORT
```

### 3. Run locally

```bash
# Terminal 1 — server
cd server && npm run dev

# Terminal 2 — client
cd client && npm run dev
```

Open `http://localhost:5173` in two tabs: one for `/` (Receptionist) and one for `/waiting` (Waiting Room).

---

## REST API

All endpoints are prefixed with `/api`.

### Patients

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/patients` | List all patients (filter by `?status=waiting`) |
| `POST` | `/patients` | Add a patient `{ name, phone(optional) }` |
| `GET` | `/patients/:token` | Get patient by token number |

### Queue

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/queue/state` | Current session + active patients |
| `POST` | `/queue/next` | Mark current as done, call next waiting patient |
| `DELETE` | `/queue/reset` | Clear all patients and reset session counters |
| `GET` | `/queue/wait/:token` | Estimated wait time in minutes for a given token |

### Sessions

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/sessions` | Get current session document |
| `PUT` | `/sessions` | Update `{ avgConsultTime }` |
| `GET` | `/sessions/stats` | Counts by status + totals |

### Utility

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Server health check with uptime |

---

## Socket.IO Events

The server uses a single **server → client** broadcast model. There are no client-emitted events.

| Event | Direction | Payload | When fired |
|---|---|---|---|
| `queue:state` | Server → All Clients | `{ session: { currentToken, avgConsultTime, totalServed }, patients: [...] }` | On connect (to that socket), and after any state change (add patient, call next, reset, update avg time) |

On connection, the server immediately emits `queue:state` with the current snapshot so new clients (or reconnecting ones) are always in sync without needing a separate REST call.

---

## Data Models

### Patient

```
token         Number   Auto-incremented, unique per session
name          String   Required, max 100 chars
phone         String   Optional, must be exactly 10 digits
status        String   "waiting" | "serving" | "done"
servedAt      Date     Set when status becomes "done"
createdAt     Date     Auto
```

### Session

```
currentToken  Number   Token number currently being served
lastToken     Number   Counter used to generate the next token
avgConsultTime Number  Minutes per patient (1–120, default 5)
totalServed   Number   Cumulative patients seen today
```

Only one Session document exists at a time. It is created on first access and reset (not deleted) at end of day.

---

## Deployment

### Server → Render

The `server/render.yaml` file is pre-configured. Set the following environment variables in the Render dashboard:

- `MONGODB_URI`
- `CLIENT_URL` (your Vercel domain)
- `NODE_ENV=production`

### Client → Vercel

The `client/vercel.json` is pre-configured with SPA rewrites. Set:

- `VITE_API_URL` (your Render service URL + `/api`)
- `VITE_SOCKET_URL` (your Render service URL)

---

## Key Design Decisions

**Single broadcast event** — rather than granular events (`patient:added`, `token:called`, etc.), every mutation re-fetches the full queue state from the DB and broadcasts it. This keeps clients stateless and eliminates edge cases from partial updates.

**MongoDB transaction for callNext** — calling the next patient involves two writes (marking current as `done`, marking next as `serving`) wrapped in a Mongo session/transaction to prevent race conditions.

**Token generation via Session atomic update** — `Patient.getNextToken()` uses `findOneAndUpdate` with `$inc` so concurrent requests can't produce duplicate tokens.

**Phone deduplication** — a patient cannot be added if their phone number is already attached to a `waiting` or `serving` record, preventing accidental double-registration.

---

## Future Improvements

The current implementation focuses strictly on the features requested in the problem statement.

Additional features that were considered but intentionally left out to avoid scope creep (since they were not part of evaluation criteria) include:

- Authentication & role-based access control (admin/receptionist login)
- Appointment booking before arrival
- SMS / WhatsApp token notifications
- Doctor-specific queues (multiple doctors/departments)
- Queue pause/resume functionality
- Priority queue for emergency patients
- Analytics dashboard (average wait time, peak hours)
- Patient history & visit records
- Audio announcements for token calling
- Email reports / daily export (CSV/PDF)
- Offline mode with sync
- Audit logs for receptionist actions

---
## License

This project is licensed under the MIT License

---