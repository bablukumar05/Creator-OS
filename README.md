# CreatorOS

The unified commercial operating system for modern creators, digital talent, and media agencies. Built with React 18, Tailwind CSS, Node.js/Express, and MongoDB.

---

## Key Features

- **Dynamic Media Kits:** Real-time analytics, audience demographics, and shareable public media kits.
- **Frame-Accurate Video Review:** Video playback review with timecoded visual annotations and client approvals.
- **CreatorOS Neural Engine:** AI Studio for viral script ideation, hook generation, and caption drafting.
- **Escrow Vault & Invoicing:** Milestone-based escrow security, automated invoice generation, and tax-ready PDF exports.
- **Digital Contracts:** In-app contract generation with legally binding cryptographic e-signatures.
- **Multi-Platform Calendar:** Unified scheduling and task boards across YouTube, Instagram, TikTok, LinkedIn, and X.

---

## Tech Stack

| Layer | Technologies |
| --- | --- |
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide Icons, Zustand |
| **Backend** | Node.js, Express, Socket.io, Zod |
| **Database** | MongoDB (Mongoose ORM) |
| **Storage & Media** | Cloudflare R2 / Cloudinary |

---

## Quick Start

### Prerequisites
- **Node.js**: v18.0.0 or newer (v22 recommended)
- **MongoDB**: Local daemon or MongoDB Atlas connection URI


### 2. Environment Configuration
Create `server/.env` based on the example:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
SERVER_URL=http://localhost:5000
MONGO_URI=mongodb://127.0.0.1:27017/creatoros
JWT_SECRET=your_secure_jwt_secret_here
DEMO_MODE=true
```

### 3. Run Development Server
```bash
npm run dev
```
- **Frontend:** [http://localhost:5173](http://localhost:5173)
- **API Server:** [http://localhost:5000](http://localhost:5000)

---

## Demo Credentials

When running in demo mode (`DEMO_MODE=true`), you can use the pre-configured accounts:

| Role | Email | Password |
| --- | --- | --- |
| **Creator** | `creator@creatoros.demo` | `Creator@123` |
| **Admin** | `admin@creatoros.demo` | `Admin@123` |

---

## Available Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start both frontend and backend concurrently in development mode |
| `npm run demo` | Start demo workspace with in-memory database and seeded accounts |
| `npm run build` | Build frontend production bundle (`client/dist`) |
| `npm run lint` | Run ESLint across the codebase |
| `npm run seed` | Seed development database with authentic demo records |
| `npm run seed:reset` | Reset demo records to fresh state |
