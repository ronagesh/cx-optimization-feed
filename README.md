# CX Optimization Feed

A prototype for a customer-facing AI support optimization product. Built for an interview.

## What it does

Customer ops/support leads at e-commerce companies can use this tool to:

1. **View a prioritized feed of issues** — the system surfaces where the AI agent is underperforming, ranked by frequency, CSAT drag, deflection drag, business impact, and model confidence
2. **Dig into each issue** — see real conversation examples where the bot failed, understand why the issue matters, and review a suggested knowledge base fix
3. **Apply fixes** — preview and edit the proposed KB article, then deploy it to production in one click
4. **Track impact** — after a fix is applied, monitor before/after CSAT and deflection rate trends segmented by issue category

## Running locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Stack

- React + TypeScript (Vite)
- Tailwind CSS
- Recharts

## Notes

This is a prototype — no backend, auth, or persistence. All data is mocked in `src/data/mockData.ts`.
