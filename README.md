# E-Commerce Project Frontend

React + Vite frontend for the e-commerce studying project.

## Prerequisites

- Node.js 20 or newer
- npm
- Backend API running locally or remotely

## Start Guide

1. Install dependencies:

   ```bash
   npm ci
   ```

2. Configure the API URL:

   ```bash
   cp .env.example .env
   ```

   Set `VITE_API_URL` in `.env` if your backend is not running at the default URL.
   When `VITE_API_URL` is empty, the app uses `http://127.0.0.1:5000`.

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open the local URL printed by Vite, usually:

   ```text
   http://localhost:5173
   ```

## Available Scripts

- `npm run dev` - start the Vite development server.
- `npm run build` - create a production build in `dist`.
- `npm run preview` - preview the production build locally.
- `npm run lint` - run ESLint.
