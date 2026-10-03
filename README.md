# Stockroom React frontend

React product management interface for the LavaLust backend in the parent folder.

```powershell
npm.cmd ci
npm.cmd run dev
npm.cmd run build
npm.cmd run lint
```

Development URL: http://localhost:5173. WAMP must be running. The Vite proxy routes `/api` to `http://localhost/lab6/public/api`.

The build is served by WAMP at http://localhost/lab6/frontend/dist/.
For a remote backend, configure `VITE_API_URL` before building (see `.env.example`). Never put database credentials in frontend environment variables.

See the project [README](../README.md) for setup, demo login, migration commands, API routes, tests, and screenshots.
