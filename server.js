
import express from "express";

// Create Express application
const app = express();

// Middleware to read JSON
app.use(express.json());

// First API route
app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

// Start server
app.listen(3000, () => {
  console.log("Tasker server is running!");
});
