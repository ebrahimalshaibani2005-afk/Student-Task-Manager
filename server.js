import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import { z } from "zod";

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(process.env.DATA_DIR || "./data");
fs.mkdirSync(dataDir, { recursive: true });
const db = new DatabaseSync(path.join(dataDir, "tasker.db"));

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS sessions (
    id_hash TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS subjects (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    UNIQUE(user_id, name)
  );
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    date TEXT NOT NULL,
    subject TEXT NOT NULL DEFAULT 'General',
    repeat TEXT NOT NULL DEFAULT 'none',
    done INTEGER NOT NULL DEFAULT 0,
    next_created INTEGER NOT NULL DEFAULT 0,
    CHECK(repeat IN ('none', 'daily', 'weekly'))
  );
`);

app.disable("x-powered-by");
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "20kb" }));
app.use(cookieParser());

// Same-origin requests only for state-changing API endpoints.
app.use("/api", (req, res, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  const origin = req.get("origin");
  const host = req.get("host");
  if (origin && new URL(origin).host !== host) return res.status(403).json({ error: "Invalid origin" });
  next();
});

const authLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: "draft-8", legacyHeaders: false });
const emailSchema = z.email().max(254);
const authSchema = z.object({ email: emailSchema, password: z.string().min(8).max(128) });
const taskSchema = z.object({
  name: z.string().trim().min(1).max(150),
  date: z.iso.date(),
  subject: z.string().trim().min(1).max(80),
  repeat: z.enum(["none", "daily", "weekly"]),
  done: z.boolean().optional()
});
const subjectSchema = z.object({ name: z.string().trim().min(1).max(80) });

function validate(schema, data, res) {
  const result = schema.safeParse(data);
  if (!result.success) {
    res.status(400).json({ error: "Invalid data", details: z.flattenError(result.error).fieldErrors });
    return null;
  }
  return result.data;
}
function publicUser(u) { return { id: u.id, email: u.email }; }
function hashSession(value) { return crypto.createHash("sha256").update(value).digest("hex"); }
const isProduction = process.env.NODE_ENV === "production";
const cookieOptions = { httpOnly: true, sameSite: "lax", secure: isProduction, path: "/" };
function createSession(res, id) {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
  db.prepare("INSERT INTO sessions (id_hash, user_id, expires_at) VALUES (?, ?, ?)").run(hashSession(token), id, expiresAt);
  res.cookie("tasker_sid", token, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });
}
function requireAuth(req, res, next) {
  const token = req.cookies.tasker_sid;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return res.status(401).json({ error: "Please login" });
  const session = db.prepare("SELECT users.id, users.email FROM sessions JOIN users ON users.id = sessions.user_id WHERE sessions.id_hash = ? AND sessions.expires_at > ?").get(hashSession(token), Date.now());
  if (!session) return res.status(401).json({ error: "Please login" });
  req.user = session;
  next();
}
function taskOutput(t) {
  return { id: t.id, name: t.name, date: t.date, subject: t.subject, repeat: t.repeat, done: !!t.done, nextCreated: !!t.next_created };
}
const getTask = db.prepare("SELECT * FROM tasks WHERE id = ? AND user_id = ?");

app.post("/api/auth/signup", authLimit, async (req, res) => {
  const values = validate(authSchema, req.body, res);
  if (!values) return;
  const email = values.email.trim().toLowerCase();
  if (db.prepare("SELECT id FROM users WHERE email = ?").get(email)) return res.status(409).json({ error: "Account already exists" });
  const hash = await bcrypt.hash(values.password, 12);
  try {
    const result = db.prepare("INSERT INTO users (email, password_hash) VALUES (?, ?)").run(email, hash);
    const user = { id: Number(result.lastInsertRowid), email };
    createSession(res, user.id);
    res.status(201).json({ user });
  } catch (error) {
    if (error.code?.includes("CONSTRAINT")) return res.status(409).json({ error: "Account already exists" });
    throw error;
  }
});
app.post("/api/auth/login", authLimit, async (req, res) => {
  const values = validate(authSchema, req.body, res);
  if (!values) return;
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(values.email.trim().toLowerCase());
  if (!user || !(await bcrypt.compare(values.password, user.password_hash))) return res.status(401).json({ error: "Wrong email or password" });
  createSession(res, user.id);
  res.json({ user: publicUser(user) });
});
app.post("/api/auth/logout", (req, res) => {
  const token = req.cookies.tasker_sid;
  if (token && /^[a-f0-9]{64}$/.test(token)) db.prepare("DELETE FROM sessions WHERE id_hash = ?").run(hashSession(token));
  res.clearCookie("tasker_sid", cookieOptions);
  res.json({ ok: true });
});
app.get("/api/me", requireAuth, (req, res) => res.json({ user: publicUser(req.user) }));

app.get("/api/subjects", requireAuth, (req, res) => {
  res.json(db.prepare("SELECT id, name FROM subjects WHERE user_id = ? ORDER BY name").all(req.user.id));
});
app.post("/api/subjects", requireAuth, (req, res) => {
  const input = validate(subjectSchema, req.body, res);
  if (!input) return;
  try {
    const result = db.prepare("INSERT INTO subjects (user_id, name) VALUES (?, ?)").run(req.user.id, input.name);
    res.status(201).json({ id: Number(result.lastInsertRowid), name: input.name });
  } catch (error) {
    if (error.code?.includes("CONSTRAINT")) return res.status(409).json({ error: "Subject already exists" });
    throw error;
  }
});
app.delete("/api/subjects/:id", requireAuth, (req, res) => {
  const result = db.prepare("DELETE FROM subjects WHERE id = ? AND user_id = ?").run(req.params.id, req.user.id);
  if (!result.changes) return res.status(404).json({ error: "Subject not found" });
  res.status(204).end();
});

app.get("/api/tasks", requireAuth, (req, res) => {
  const params = [req.user.id];
  let sql = "SELECT * FROM tasks WHERE user_id = ?";
  if (req.query.subject) { sql += " AND subject = ?"; params.push(req.query.subject); }
  if (req.query.status === "completed") sql += " AND done = 1";
  if (req.query.status === "pending") sql += " AND done = 0";
  if (req.query.search) { sql += " AND name LIKE ?"; params.push("%" + String(req.query.search).slice(0, 100) + "%"); }
  sql += " ORDER BY date ASC, id ASC";
  res.json(db.prepare(sql).all(...params).map(taskOutput));
});
app.post("/api/tasks", requireAuth, (req, res) => {
  const input = validate(taskSchema, req.body, res);
  if (!input) return;
  if (input.subject !== "General" && !db.prepare("SELECT id FROM subjects WHERE user_id = ? AND name = ?").get(req.user.id, input.subject)) {
    return res.status(400).json({ error: "Unknown subject" });
  }
  const result = db.prepare("INSERT INTO tasks (user_id, name, date, subject, repeat, done) VALUES (?, ?, ?, ?, ?, ?)").run(req.user.id, input.name, input.date, input.subject, input.repeat, Number(input.done ?? false));
  res.status(201).json(taskOutput(getTask.get(Number(result.lastInsertRowid), req.user.id)));
});
app.patch("/api/tasks/:id", requireAuth, (req, res) => {
  const original = getTask.get(req.params.id, req.user.id);
  if (!original) return res.status(404).json({ error: "Task not found" });
  const updates = validate(taskSchema.partial().refine(v => Object.keys(v).length > 0), req.body, res);
  if (!updates) return;
  const changed = { ...taskOutput(original), ...updates };
  if (changed.subject !== "General" && !db.prepare("SELECT id FROM subjects WHERE user_id = ? AND name = ?").get(req.user.id, changed.subject)) {
    return res.status(400).json({ error: "Unknown subject" });
  }
  db.exec("BEGIN");
  try {
    db.prepare("UPDATE tasks SET name = ?, date = ?, subject = ?, repeat = ?, done = ? WHERE id = ? AND user_id = ?")
      .run(changed.name, changed.date, changed.subject, changed.repeat, Number(changed.done), original.id, req.user.id);
    if (changed.done && !original.done && changed.repeat !== "none" && !original.next_created) {
      const next = new Date(changed.date + "T12:00:00Z");
      next.setUTCDate(next.getUTCDate() + (changed.repeat === "daily" ? 1 : 7));
      const date = next.toISOString().slice(0, 10);
      db.prepare("INSERT INTO tasks (user_id, name, date, subject, repeat) VALUES (?, ?, ?, ?, ?)")
        .run(req.user.id, changed.name, date, changed.subject, changed.repeat);
      db.prepare("UPDATE tasks SET next_created = 1 WHERE id = ? AND user_id = ?").run(original.id, req.user.id);
    }
    db.exec("COMMIT");
  } catch (error) { db.exec("ROLLBACK"); throw error; }
  res.json(taskOutput(getTask.get(original.id, req.user.id)));
});
app.delete("/api/tasks/:id", requireAuth, (req, res) => {
  const result = db.prepare("DELETE FROM tasks WHERE id = ? AND user_id = ?").run(req.params.id, req.user.id);
  if (!result.changes) return res.status(404).json({ error: "Task not found" });
  res.status(204).end();
});

app.get("/api/health", (req, res) => res.json({ ok: true }));
// Serve only public frontend files; NEVER expose server.js, database, or .env.
app.get(["/", "/index.html"], (req, res) => res.sendFile(path.join(__dirname, "index.html")));
app.get("/style.css", (req, res) => res.sendFile(path.join(__dirname, "style.css")));
app.get("/script.js", (req, res) => res.sendFile(path.join(__dirname, "script.js")));
app.use("/api", (req, res) => res.status(404).json({ error: "API route not found" }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Server error" });
});
const port = Number(process.env.PORT) || 3000;
app.listen(port, () => console.log("Tasker: http://localhost:" + port));
