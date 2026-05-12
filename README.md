<p align="center">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/TanStack-FF4154?style=for-the-badge&logo=reactquery&logoColor=white" />
  <img src="https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white" />
  <img src="https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white" />
  <img src="https://img.shields.io/badge/AWS_EC2-FF9900?style=for-the-badge&logo=amazonec2&logoColor=white" />
  <img src="https://img.shields.io/badge/Nginx-009639?style=for-the-badge&logo=nginx&logoColor=white" />
</p>

# 🎬 ReccoFlix — AI-Powered Anime Discovery Platform

ReccoFlix is a full-stack anime discovery and tracking platform that uses **AI-driven recommendations** to help users find their next favorite anime. It combines real-time data from the **Kitsu** and **Jikan (MAL)** APIs with a custom **Groq LLM-powered recommendation engine** to deliver hyper-personalized suggestions based on a user's watch history, favorites, and mood.

> 🌐 **Live at:** [reccoflix.app](https://reccoflix.app)

---

## ✨ Key Features

### 🤖 AI Recommendation Engine
- **Personalized Recommendations**: Powered by Groq's `llama-3.3-70b-versatile` model, the engine analyzes the user's library to generate 15 unique, non-duplicate suggestions with reasoning.
- **Mood-Based Discovery**: Users describe a vibe (e.g., "melancholic rain", "hype battle") and the AI curates a list of anime matching that emotional tone.
- **AI Synopsis Generation**: When an anime's official synopsis is too short or missing, the AI writes a professional, atmospheric 2-paragraph synopsis.
- **Episode Narrative Synthesis**: Each episode page can be enriched with an AI-generated plot analysis, anchored by factual metadata to prevent hallucination.
- **Smart Caching**: AI results are cached per-user in the database and only refreshed when the user's library changes, minimizing redundant API calls.

### 📚 Anime Library & Tracking
- Full library management with statuses: **Watching**, **Planned**, **Completed**, **Dropped**, **On Hold**.
- **Favorites System**: Users can heart anime to prioritize them.
- **Recent in Library**: Powered by automatic `updated_at` timestamps, the most recently interacted-with anime always surfaces first.

### 🔐 Authentication
- **Dual Auth Strategy**: Supports both local email/password registration and **Google OAuth 2.0** via Passport.js.
- **Password Reset Flow**: Secure token-based password reset via **Resend** email service with rate limiting.
- **Profile Management**: Users can update their name, email, password, profile picture, and cover photo.

### 🔍 Discovery & Browsing
- **Search**: Full-text search powered by the Kitsu API.
- **Genre Browsing**: Filter by 15+ genres with randomized sort orders for content diversity.
- **Ongoing/Trending**: Real-time feed of currently airing and popular anime.
- **Franchise Mapping**: Automatic detection of related seasons and spin-offs via Kitsu media relationships.

### 📊 Deep Metadata Enrichment
- **Dual-Source Architecture**: Primary data from **Kitsu API**, with automatic fallback to **Jikan (MyAnimeList) API** for missing studios, episode counts, runtimes, and episode thumbnails.
- **Character Database**: Fetches cast and character data for each anime.
- **Episode-Level Detail**: Ratings, filler/recap flags, and air dates sourced from Jikan.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                     CLIENT                          │
│         React + TanStack Start + Tailwind           │
│              (Port 8080 / Dev)                      │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP (API Calls)
                       ▼
┌─────────────────────────────────────────────────────┐
│                  NGINX (Reverse Proxy)              │
│              SSL via Let's Encrypt                  │
│            reccoflix.app → 127.0.0.1:3000           │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│               EXPRESS.JS API SERVER                 │
│           (Port 3000 / Managed by PM2)              │
│                                                     │
│  ┌─────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │  Auth   │  │  Anime   │  │    AI Service     │  │
│  │ Routes  │  │ Routes   │  │  (Groq LLM)       │  │
│  └────┬────┘  └────┬─────┘  └────────┬──────────┘  │
│       │            │                 │              │
│       ▼            ▼                 ▼              │
│  ┌─────────────────────────────────────────────┐    │
│  │         Prisma ORM (Type-Safe Queries)      │    │
│  └──────────────────┬──────────────────────────┘    │
└─────────────────────┼───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│              SUPABASE (PostgreSQL)                  │
│         Connection Pooling via PgBouncer            │
│    Tables: users, user_library, session             │
└─────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
ReccoFlix/
├── .github/
│   └── workflows/
│       └── deploy.yml            # CI/CD Pipeline (GitHub Actions → EC2)
│
├── client/                       # Frontend (React + TanStack Start)
│   ├── src/
│   │   ├── components/           # Reusable UI components
│   │   │   ├── anime-card.tsx
│   │   │   ├── anime-row.tsx
│   │   │   ├── app-shell.tsx
│   │   │   ├── hero-banner.tsx
│   │   │   └── ui/              # shadcn/ui components
│   │   ├── routes/              # File-based routing (TanStack Router)
│   │   │   ├── index.tsx         # Home page
│   │   │   ├── anime.$id.tsx     # Anime detail page
│   │   │   ├── browse.tsx        # Genre browsing
│   │   │   ├── search.tsx        # Search page
│   │   │   ├── library.tsx       # User library
│   │   │   ├── mood.tsx          # Mood-based discovery
│   │   │   ├── profile.tsx       # User profile
│   │   │   ├── recommendations.tsx
│   │   │   ├── favorites.tsx
│   │   │   ├── dossier.$id.$episodeNum.tsx  # Episode detail
│   │   │   ├── archive.$id.tsx   # Episode archive
│   │   │   ├── login.tsx
│   │   │   ├── signup.tsx
│   │   │   └── ...
│   │   ├── hooks/               # Custom React hooks
│   │   ├── lib/                 # Utility functions
│   │   ├── styles.css           # Global styles (Tailwind)
│   │   └── router.tsx           # Router configuration
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
│
├── src/                          # Backend (Express.js API)
│   ├── config/
│   │   ├── database.js           # PostgreSQL + Prisma adapter setup
│   │   └── passport.js           # Authentication strategies (Local + Google)
│   ├── controllers/
│   │   ├── animeController.js    # Search, browse, description, episodes, AI
│   │   ├── authController.js     # Login, register, password reset
│   │   ├── userController.js     # Profile, library CRUD, favorites
│   │   └── infoController.js     # Static pages (about, terms, privacy)
│   ├── routes/
│   │   ├── animeRoutes.js
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   └── infoRoutes.js
│   ├── services/
│   │   └── aiService.js          # Groq LLM integration (5 AI functions)
│   └── middleware/               # Express middleware (extensible)
│
├── prisma/
│   └── schema.prisma             # Database schema (source of truth)
├── prisma.config.ts              # Prisma 7 configuration
│
├── index.js                      # Express server entry point
├── .env.example                  # Environment variable template
├── .gitignore
├── package.json
└── README.md
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|:------|:-----------|:--------|
| **Frontend** | React 19, TanStack Start, TanStack Router | SSR-capable SPA with file-based routing |
| **Styling** | Tailwind CSS 4, shadcn/ui, Radix UI | Utility-first CSS with accessible component primitives |
| **Backend** | Express 5, Node.js | RESTful API server |
| **ORM** | Prisma 7 with `@prisma/adapter-pg` | Type-safe database access with connection pooling |
| **Database** | PostgreSQL (Supabase) | Managed cloud database with PgBouncer |
| **Auth** | Passport.js (Local + Google OAuth 2.0) | Dual-strategy authentication |
| **AI Engine** | Groq SDK (`llama-3.3-70b-versatile`) | Recommendations, synopses, mood matching |
| **Email** | Resend | Transactional emails for password reset |
| **External APIs** | Kitsu API, Jikan (MAL) API | Anime metadata, episodes, characters |
| **Hosting** | AWS EC2 (Ubuntu) | Bare-metal Linux server |
| **Reverse Proxy** | Nginx + Let's Encrypt SSL | HTTPS termination and request routing |
| **Process Manager** | PM2 | Zero-downtime process management |
| **CI/CD** | GitHub Actions | Automated deployment on push to `main` |

---

## 🚀 Deployment

ReccoFlix is deployed on a **bare-metal AWS EC2 instance** with a fully automated CI/CD pipeline.

### Infrastructure
- **Server**: AWS EC2 (Ubuntu) running Node.js directly on the OS for maximum performance and minimal overhead.
- **Reverse Proxy**: Nginx handles SSL termination (via Let's Encrypt) and proxies all traffic to the Express server on port 3000.
- **Process Management**: PM2 keeps the application alive across restarts and server reboots.
- **Database**: Supabase-hosted PostgreSQL with PgBouncer connection pooling for efficient database connections.

### CI/CD Pipeline
Every push to the `main` branch triggers an automated deployment via **GitHub Actions**:

1. **SSH into EC2** using encrypted repository secrets.
2. **Pull latest code** from the repository.
3. **Inject environment variables** securely from GitHub Secrets.
4. **Install dependencies** and regenerate the Prisma Client.
5. **Restart the server** via PM2 with automatic fallback to a fresh start.

> The pipeline is designed with a **fail-fast strategy**: if any step fails, the deployment stops immediately, leaving the previous stable version running.

---

## ⚡ Getting Started (Local Development)

### Prerequisites
- Node.js 18+
- PostgreSQL (or a Supabase project)
- Google OAuth credentials
- Groq API key

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/ShreyasUday/ReccoFlix.git
cd ReccoFlix

# 2. Install backend dependencies
npm install

# 3. Install frontend dependencies
cd client && npm install && cd ..

# 4. Configure environment
cp .env.example .env
# Edit .env with your actual credentials

# 5. Generate Prisma Client
npx prisma generate

# 6. Start the backend server
npm start

# 7. Start the frontend (in a separate terminal)
cd client && npm run dev
```

The backend runs on `http://localhost:3000` and the frontend on `http://localhost:8080`.

---

## 📄 API Routes

### Authentication (`/api/auth`)
| Method | Endpoint | Description |
|:-------|:---------|:------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login with email/password |
| GET | `/api/auth/logout` | Logout and destroy session |
| GET | `/api/auth/google` | Initiate Google OAuth flow |
| POST | `/api/auth/forgot-password` | Request password reset email |
| POST | `/api/auth/reset-password/:token` | Reset password with token |

### User (`/api/user`)
| Method | Endpoint | Description |
|:-------|:---------|:------------|
| GET | `/api/user/profile` | Get user profile and library |
| PUT | `/api/user/profile` | Update name, email, password, avatar, cover |
| POST | `/api/user/library/add` | Add anime to library |
| POST | `/api/user/library/remove` | Remove anime from library |
| POST | `/api/user/library/favorite` | Toggle favorite status |

### Anime (`/api/anime`)
| Method | Endpoint | Description |
|:-------|:---------|:------------|
| GET | `/api/anime/category` | Get trending anime |
| GET | `/api/anime/browse` | Browse by genre with pagination |
| GET | `/api/anime/description` | Get full anime details + AI synopsis |
| GET | `/api/anime/episodes` | Get episode list with metadata |
| GET | `/api/anime/characters` | Get character data |
| GET | `/api/anime/ongoing` | Get currently airing anime |
| GET | `/api/anime/recommendations` | Get AI or trending recommendations |
| POST | `/api/anime/share-line` | Generate AI share text |
| GET | `/api/anime/mood` | Get mood-based recommendations |
| GET | `/api/anime/episode/:id/:num` | Get episode detail + AI narrative |

---

## 🔒 Security

- **Environment Variables**: All secrets are stored in `.env` (local) and GitHub Secrets (production). Never committed to the repository.
- **Password Hashing**: bcrypt with 10 salt rounds.
- **Rate Limiting**: Password reset endpoint is rate-limited (5 requests per 15 minutes).
- **Session Security**: Server-side sessions stored in PostgreSQL via `connect-pg-simple`.
- **CORS**: Restricted to the configured `CLIENT_URL` origin.
- **SSL**: End-to-end HTTPS via Let's Encrypt certificates managed by Nginx.

---

## 📜 License

This project is licensed under the ISC License.
