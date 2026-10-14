# Job Tracker

A personal job search dashboard with a searchable application list, Kanban board, status pipeline, and daily, weekly, or monthly activity chart. The React frontend stores application records through the [Job Tracker API](https://github.com/vickyy24/job-tracker-api), which persists them in MongoDB.

## Features

- Create, view, edit, search, sort, filter, and delete job applications.
- Track applications through Applied, Interview, Offer, and Rejected statuses in a Kanban board or table.
- See application totals, a status breakdown, and daily, weekly, or monthly activity on the dashboard.
- Filter the application list by selecting a status in the status chart or its status selector. Select the active status again to clear that filter.
- Choose the last 7 days, 8 weeks, or 6 months for the activity chart.
- Set a daily application goal and choose a light or dark theme. These preferences are saved in the current browser.
- Record company, job title, salary or stipend, location, application date, status, and notes.

Charts use application dates. Daily activity covers the last 7 days, weekly activity covers the last 8 weeks, and monthly activity covers the last 6 months. The daily goal counts records created today in UTC. Chart totals are calculated from the full application history; the status chart can also apply its selected status to the application list.

## Full-screen app screenshots

These captures show the dashboard, board, assets, and settings screens. Demo applications are stored in MongoDB through the API seeder; they are not bundled in this frontend repository. Hover a status segment in the dashboard pie chart to see its count and percentage, or select a segment to filter the application list.

### Dashboard

![Job Tracker dashboard with status breakdown and monthly application chart](screenshots/01-dashboard.png)

### Board

![Job Tracker board with all application companies across the four statuses](screenshots/02-board.png)

### Assets

![Job Tracker Assets page](screenshots/03-assets.png)

### Settings

![Job Tracker settings page](screenshots/04-settings.png)

## Run locally

Requirements: Node.js and a reachable MongoDB database.

1. Clone the [API repository](https://github.com/vickyy24/job-tracker-api), open its folder, install dependencies, and configure `MONGODB_URI` in `.env` using its `.env.example` file.

   ```sh
   npm install
   ```

2. From the API folder, optionally load a few fictional applications to preview chart changes across months and statuses:

   ```sh
   npm run seed:demo
   ```

   The seeder is safe to rerun. It adds up to seven sample applications dated May through September 2026, skips sample companies already present, and marks records with the `Demo ·` prefix. The monthly counts vary between one and two applications, and the sample statuses include Applied, Interview, Offer, and Rejected. Remove them by deleting applications with that prefix in the app or MongoDB.

3. Start the API in its folder:

   ```sh
   npm start
   ```

4. Clone this frontend repository into a separate folder, install dependencies, and start the app:

   ```sh
   npm install
   npm start
   ```

5. Open [http://localhost:3000](http://localhost:3000). By default, the frontend connects to `http://localhost:5000/api`.

To use a different API URL, create `.env.local` in this folder and set `REACT_APP_API_BASE_URL`, then restart the frontend:

```env
REACT_APP_API_BASE_URL=http://localhost:5000/api
```

## Commands

- `npm start` starts the React development server and Tailwind stylesheet watcher.
- `npm run build` creates an optimized production build in `build/`.
- `npm test` runs the React Scripts test runner.

## Project structure

- `src/App.js` manages application data, navigation, and modal flows.
- `src/components/` contains the dashboard, application forms, shared UI, and Kanban board.
- `src/services/applicationApi.js` contains the HTTP client for the API.
- `src/index.css` contains app styling and Tailwind directives.

## Data and limitations

- Application records are stored by the API in MongoDB. Do not put database credentials in this frontend repository.
- Authentication, multi-user workspaces, and synchronized preferences are not included.
- Assets currently describes the resource library feature; uploads and document storage are not available.
