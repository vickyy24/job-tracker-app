# Job Tracker Frontend

## Run locally with the API

1. Start MongoDB.
2. In `job-tracker-api`, install dependencies, copy `.env.example` to `.env`, set `MONGODB_URI` if needed, and run `npm start`.
3. In this directory, install dependencies, copy `.env.example` to `.env.local`, and run `npm start`.

The API defaults to `http://localhost:5000/api` and allows the frontend at `http://localhost:3000`. Set `REACT_APP_API_BASE_URL` in `.env.local` if the API uses another URL. Restart the frontend after changing environment values.

## Available commands

- `npm start` runs the frontend at `http://localhost:3000`.
- `npm run build` creates the production build in `build/`.

## Release notes

- A local demo needs the API and a reachable MongoDB database. Without them, the dashboard shows an API connection error and application workflows cannot be completed.
- Authentication is not included in this MVP.
