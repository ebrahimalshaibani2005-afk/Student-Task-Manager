# Student Task Manager — Tasker

A responsive student task management app built with HTML, CSS, vanilla JavaScript, Node.js and Express.js.

## Run locally

Requires **Node.js 22.13+**.

```bash
npm install
npm run dev
```

Open http://localhost:3000 (do not open index.html directly).
Create an account using a test email and password (minimum 8 characters). Accounts and tasks are stored in the local SQLite database in `data/tasker.db`. Never commit this database.

## Architecture

Browser (HTML/CSS/JS) → same-origin REST API (Express) → SQLite.

- `index.html`: semantic markup and forms
- `style.css`: responsive Grid and Flexbox layout
- `script.js`: DOM updates, events, fetch, async/await
- `server.js`: middleware, routing, validation, sessions, database
- `data/tasker.db`: local persistent data (ignored by Git)

## REST API

| Method | Route | Meaning |
| --- | --- | --- |
| POST | /api/auth/signup | Sign up |
| POST | /api/auth/login | Log in |
| POST | /api/auth/logout | Log out |
| GET | /api/me | Current user |
| GET, POST | /api/tasks | List/create tasks |
| PATCH, DELETE | /api/tasks/:id | Update/delete own task |
| GET, POST | /api/subjects | List/create subjects |
| DELETE | /api/subjects/:id | Delete own subject |
| GET | /api/health | Health check |

`bcryptjs` hashes passwords. A random session cookie is `HttpOnly` and `SameSite=Lax`; the server stores only its SHA-256 hash. Authorization checks on every user-scoped route prevent access to other users' tasks. Set `NODE_ENV=production` for secure cookies on HTTPS.

## Deployment

**GitHub Pages only hosts static frontend content.** To use live login and saved tasks, deploy this as a Node.js web service. For hosted persistence, SQLite needs a persistent disk, with `DATA_DIR` pointing to its mount; otherwise redeploys can reset data. A managed PostgreSQL service is preferable for larger deployments. Do not expose the `data` directory to web clients.

## Course coverage

HTML semantic structure, forms and validation; responsive CSS with Grid and Flexbox; JavaScript DOM/events, arrays, async/await/fetch; Express routes and middleware; REST CRUD and HTTP status codes; relational persistence, validation, authentication, error handling and modular-monolith architecture.

## Figma

[Student Task Manager — Final Design](https://www.figma.com/design/KIlUXMrXqensgAmuqbYBlL/Student-Task-Manager---Final-Design?node-id=0-1)
