# Stellar-Star — Runbook

Step-by-step guide to get Stellar-Star running locally.

---

## 1. Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 18 (LTS recommended) |
| npm | ≥ 9 |
| Git | any recent |
| [Freighter Wallet](https://www.freighter.app/) | Browser extension |

## 2. Clone & Install

```bash
git clone https://github.com/your-org/stellar-star.git
cd stellar-star
npm install
```

## 3. Environment Setup

```bash
cp .env.local.example .env.local
```

Fill in the values:

| Variable | Where to get it |
|----------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | [Supabase Dashboard](https://app.supabase.com) → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same location |
| `NEXT_PUBLIC_STELLAR_NETWORK` | `TESTNET` for dev, `PUBLIC` for production |
| `NEXT_PUBLIC_STELLAR_HORIZON_URL` | `https://horizon-testnet.stellar.org` (testnet) |
| `NEXT_PUBLIC_CONTRACT_ID` | Optional — see [Contract Deployment](#5-contract-deployment-optional) |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` for dev |

> **Note:** The app works fully without Supabase or a contract ID. It falls back to localStorage for data and `partial_success` for payments.

## 4. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Open the **SQL Editor** in the Supabase Dashboard
3. Paste the contents of `supabase-setup.sql` and click **Run**
4. Copy the API URL and anon key into your `.env.local`

This creates:
- `users` table — wallet-linked user profiles
- `expenses` table — expense records with split data
- `trips` table — trip groupings
- Row Level Security (RLS) policies
- Auto-updating `updated_at` triggers

## 5. Contract Deployment (Optional)

The Soroban smart contract records payments on-chain. **The app works without it** — payments succeed as `partial_success` and settle via Stellar native transfers.

### Requirements
- [Stellar CLI](https://soroban.stellar.org/docs/tools/cli) (`soroban`)
- Rust + `wasm32-unknown-unknown` target
- A funded deployer key

### Deploy

```bash
# Set your deployer secret key
export DEPLOYER_KEY="S..."

# Run the deploy script
chmod +x scripts/deploy-contract.sh
./scripts/deploy-contract.sh
```

The script will output a `CONTRACT_ID`. Add it to `.env.local`:

```
NEXT_PUBLIC_CONTRACT_ID=C...
```

## 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## 7. Freighter Wallet Setup

1. Install the [Freighter extension](https://www.freighter.app/) for your browser
2. Create or import a wallet
3. **Switch to Testnet**: Settings → Network → Test Net
4. **Fund your account** with Friendbot:

```
https://friendbot.stellar.org/?addr=YOUR_PUBLIC_KEY
```

Replace `YOUR_PUBLIC_KEY` with your Freighter G-address. Each call provides 10,000 test XLM.

5. Click **Connect Wallet** on Stellar-Star and approve in Freighter

## 8. Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific suite
npm test -- --testPathPattern=split
```

## 9. Production Build

```bash
npm run build
npm start
```

## 10. Troubleshooting

| Issue | Fix |
|-------|-----|
| Blank page on first load | Clear browser cache; ensure `"use client"` on context providers |
| "Freighter not installed" | Install extension & refresh page |
| Supabase connection errors | Verify URL/key in `.env.local`; check RLS policies |
| Contract errors | App degrades gracefully; check `NEXT_PUBLIC_CONTRACT_ID` |
| Build fails with CSS errors | Run `npm install` and ensure PostCSS + Tailwind are configured |
