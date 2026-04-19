# E-Commerce Project Frontend

React + Vite frontend for the e-commerce studying project.

## Prerequisites

- Node.js 20 or newer
- npm
- Docker, if you want to run the app in a container
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

## Docker

Build the production image:

```bash
docker build -t e-comm-project-front .
```

Run the container:

```bash
docker run --rm -p 8080:80 e-comm-project-front
```

Open the app at:

```text
http://localhost:8080
```

### API URL in Docker

`VITE_API_URL` is used when the app is built, not when the container starts.
Pass it as a Docker build argument if the backend is not available at the default URL:

```bash
docker build \
  --build-arg VITE_API_URL=http://localhost:5000 \
  -t e-comm-project-front .
```

Then run the image:

```bash
docker run --rm -p 8080:80 e-comm-project-front
```

For a backend running on the Docker host, use the host address that works for your Docker environment. On Docker Desktop, this is usually:

```text
http://host.docker.internal:5000
```

## Available Scripts

- `npm run dev` - start the Vite development server.
- `npm run build` - create a production build in `dist`.
- `npm run preview` - preview the production build locally.
- `npm run lint` - run ESLint.
