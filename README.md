# Hillclimbing Agent

A prototype of a customer-facing optimization product for AI support teams. Built for customer ops and support leads at e-commerce companies running trials of AI customer support software, it surfaces the highest-priority issues degrading CSAT and deflection, explains why each issue matters in plain language, and guides users through a two-step fix deployment flow (stage → deploy) with live KB article previews. Every deployed fix is tracked in an Impact Tracker showing before/after CSAT and deflection using a 7-day rolling average, confidence intervals on lift figures, and a counterfactual line showing where metrics would have trended without the fix.

**Live demo:** [cx-optimization-feed.vercel.app](https://cx-optimization-feed.vercel.app)

## Features

- **Prioritized issue feed** — issues ranked by an aggregate priority score across frequency, CSAT risk, escalation volume, business impact, fix effort, and model confidence
- **Filters** — slice the feed by priority, issue type, and product line
- **Issue detail** — conversation samples with an "Original / With fix applied" toggle to preview how the bot would respond after the fix
- **Two-step fix flow** — stage a knowledge base article for review, fill in any required variables (e.g. return window), then deploy to production
- **Impact Tracker** — per-issue charts with R7 lift metrics, 95% confidence intervals, counterfactual trend lines, and sample size disclosure

## Running locally

```bash
npm install
npm run dev
```

## Stack

React · TypeScript · Vite · Tailwind CSS · Recharts
