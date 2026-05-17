# Rabhana

Arabic RTL-first auction PWA. Users browse auctions, place bids, manage orders, and receive push notifications.

## Stack

React 19, TypeScript, Vite 7, Tailwind CSS 3, shadcn/ui, Zustand, React Router 7, Firebase Cloud Messaging.

## Setup

```bash
npm install
npm run dev      # start dev server
npm run build    # production build
npm run lint
```

## Environment

Create a `.env` file with:

```
VITE_API_URL=https://api.com
```

Plus the Firebase keys used in `src/lib/firebase.ts`.
