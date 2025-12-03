const express = require("express");
const cors = require("cors");
const fs = require("fs/promises");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const RESULTS_PATH = path.join(__dirname, "data", "results.json");
const RESULTS_PASSWORD = "Happy";

app.use(cors());
app.use(express.json());

async function ensureResultsFile() {
  try {
    await fs.access(RESULTS_PATH);
  } catch {
    await fs.mkdir(path.dirname(RESULTS_PATH), { recursive: true });
    await fs.writeFile(RESULTS_PATH, "[]", "utf8");
  }
}

app.post("/api/results", async (req, res) => {
  const { studentName, studentId, score, totalQuestions, answers } = req.body;
  if (!studentName || !studentId || typeof score !== "number" || typeof totalQuestions !== "number") {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const entry = {
    studentName,
    studentId,
    score,
    totalQuestions,
    answers: Array.isArray(answers) ? answers : [],
    submittedAt: new Date().toISOString(),
  };

  try {
    await ensureResultsFile();
    const raw = await fs.readFile(RESULTS_PATH, "utf8");
    const parsed = raw ? JSON.parse(raw) : [];
    parsed.push(entry);
    await fs.writeFile(RESULTS_PATH, JSON.stringify(parsed, null, 2), "utf8");
    res.json({ ok: true });
  } catch (err) {
    console.error("Failed to save result", err);
    res.status(500).json({ error: "Failed to save result" });
  }
});

function authorizeResults(req, res) {
  const provided = req.query.password || req.headers["x-results-password"];
  if (provided === RESULTS_PASSWORD) return true;
  res.status(401).send("Unauthorized");
  return false;
}

app.use(express.static(path.join(__dirname, "public")));

app.get("/api/results", async (req, res) => {
  if (!authorizeResults(req, res)) return;
  try {
    await ensureResultsFile();
    const raw = await fs.readFile(RESULTS_PATH, "utf8");
    const parsed = raw ? JSON.parse(raw) : [];
    const lines = parsed.map((r) => `${r.studentName || ""}; ${r.studentId || ""}, ${r.score ?? ""}`);
    res.type("text/plain").send(lines.join("\n") || "No scores yet.");
  } catch (err) {
    console.error("Failed to read results", err);
    res.status(500).json({ error: "Failed to read results" });
  }
});

const buildResultsTable = (parsed) => {
  const rows = parsed
    .map(
      (r) => `
      <tr>
        <td>${r.studentName || ""}</td>
        <td>${r.studentId || ""}</td>
        <td>${r.score ?? ""}/${r.totalQuestions ?? ""}</td>
        <td>${r.submittedAt ? new Date(r.submittedAt).toLocaleString() : ""}</td>
      </tr>`
    )
    .join("");
  return `
    <table>
      <thead>
        <tr><th>Student Name</th><th>Student ID</th><th>Score</th><th>Submitted</th></tr>
      </thead>
      <tbody>
        ${rows || '<tr><td class="muted" colspan="4">No results yet.</td></tr>'}
      </tbody>
    </table>
  `;
};

app.get("/results/data", async (req, res) => {
  if (!authorizeResults(req, res)) return;
  try {
    await ensureResultsFile();
    const raw = await fs.readFile(RESULTS_PATH, "utf8");
    const parsed = raw ? JSON.parse(raw) : [];
    const table = buildResultsTable(parsed);
    res.send(table);
  } catch (err) {
    console.error("Failed to read results", err);
    res.status(500).send("Failed to read results");
  }
});

app.get(/^\/results\/?$/i, async (req, res) => {
  const provided = req.query.password || req.headers["x-results-password"];
  const authorized = provided === RESULTS_PASSWORD;

  if (authorized) {
    try {
      await ensureResultsFile();
      const raw = await fs.readFile(RESULTS_PATH, "utf8");
      const parsed = raw ? JSON.parse(raw) : [];
      const table = buildResultsTable(parsed);
      return res.send(`<!doctype html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Paranoia Quiz Results</title>
        <style>
          body { font-family: Arial, sans-serif; background: #0b0b0f; color: #f5f5f5; padding: 20px; }
          h1 { margin-bottom: 12px; }
          table { width: 100%; border-collapse: collapse; background: #111; box-shadow: 0 10px 30px rgba(0,0,0,0.35); }
          th, td { padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.08); text-align: left; }
          th { background: rgba(255,23,68,0.12); color: #ff1744; letter-spacing: 0.5px; }
          tr:hover { background: rgba(255,255,255,0.04); }
          .muted { color: #888; }
        </style>
      </head>
      <body>
        <h1>Paranoia Quiz Stored Results</h1>
        ${table}
      </body>
      </html>`);
    } catch (err) {
      console.error("Failed to read results", err);
      return res.status(500).send("Failed to read results");
    }
  }

  // Not authorized: prompt for password and fetch results via header (no URL param).
  res.send(`<!doctype html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>Paranoia Quiz Results</title>
    <style>
      body { font-family: Arial, sans-serif; background: #0b0b0f; color: #f5f5f5; padding: 20px; }
      h1 { margin-bottom: 12px; }
      button { padding: 10px 16px; border-radius: 8px; background: #ff1744; color: #fff; border: none; cursor: pointer; }
      #status { margin-top: 12px; color: #ff1744; min-height: 20px; }
      #results { margin-top: 18px; }
      table { width: 100%; border-collapse: collapse; background: #111; box-shadow: 0 10px 30px rgba(0,0,0,0.35); }
      th, td { padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.08); text-align: left; }
      th { background: rgba(255,23,68,0.12); color: #ff1744; letter-spacing: 0.5px; }
      tr:hover { background: rgba(255,255,255,0.04); }
      .muted { color: #888; }
    </style>
  </head>
  <body>
    <h1>Paranoia Quiz Stored Results</h1>
    <button id="unlock">Enter Password</button>
    <div id="status"></div>
    <div id="results"></div>
    <script>
      document.getElementById('unlock').addEventListener('click', async () => {
        const pwd = window.prompt('Enter results password:');
        if (!pwd) return;
        const status = document.getElementById('status');
        status.textContent = 'Checking...';
        try {
          const res = await fetch('/results/data', { headers: { 'x-results-password': pwd } });
          if (!res.ok) {
            status.textContent = 'Unauthorized';
            return;
          }
          const html = await res.text();
          document.getElementById('results').innerHTML = html;
          status.textContent = '';
        } catch (err) {
          status.textContent = 'Failed to load results.';
        }
      });
    </script>
  </body>
  </html>`);
});

app.use((_, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Paranoia quiz running on http://localhost:${PORT}`);
});
