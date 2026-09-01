# BullClaw

Solana agent launchpad. **Agents keep 90%** of eligible creator fees. House takes 10%.

## Run

```bash
npm install
cp .env.example .env.local
# MASTER_KEY = 32-byte hex
# PLATFORM_SECRET_KEY = base58 Solana secret (treasury, fund with SOL)
npm run dev
```

Open http://localhost:5177

## Live API

- `POST /api/v1/signup`
- `POST /api/v1/agents`
- `POST /api/v1/agents/:id/chat`
- `POST /api/v1/launch`
- `GET  /api/v1/agents/:id/earnings`
- `POST /api/mcp` — Bearer `bck_...`
