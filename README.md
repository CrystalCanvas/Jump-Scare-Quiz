# Paranoia Quiz

Short, spooky quiz that grabs a student name/ID, jump-scares you on wrong answers, and records every run.

## Run under a subpath (e.g., `/ENL3Final`)

You can mount this app as an isolated section of a larger site by proxying a subpath to the Node server:

1) Start the app with a base path: `PORT=4000 BASE_PATH=/ENL3Final node server.js`.  
2) Reverse proxy `/ENL3Final` on your main site to `http://127.0.0.1:4000` (keep the prefix). Example Nginx block:
   ```nginx
   location /ENL3Final {
     proxy_pass http://127.0.0.1:4000;
     proxy_set_header Host $host;
     proxy_set_header X-Real-IP $remote_addr;
     proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
     proxy_set_header X-Forwarded-Proto $scheme;
   }
   ```
3) Requests to `https://yoursite.com/ENL3Final` (including `/results`) will reach this quiz, while the rest of your site stays unchanged.

## Quick start
```bash
npm install
npm run dev
```
Open http://localhost:3000 to play.

## How it plays
- Name/ID gate before the quiz begins.
- Horror UI with a local foxy gif/scream when you miss a question.
- Timer on each question, immediate feedback, and a review screen showing your answers.

## Data and results
- Attempts are saved to `data/results.json`.
- View stored results at http://localhost:3000/results. Click “Enter Password,” type `Happy`, and the table will load. (Password is configurable via `RESULTS_PASSWORD`.)
- Text view is available at `/api/results` with the same password (via `?password=Happy` or header `x-results-password: Happy`).
- Alternate POST endpoints exist to dodge strict WAFs: `/api/results`, `/api/store`, `/api/enl3results.php`. Set `RESULTS_ENDPOINT` to choose which the client uses.

## Configuration
- Copy `.env.example` to `.env` to override defaults:
  - `PORT` (default 3000)
  - `BASE_PATH` for subpath hosting (e.g., `/ENL3Final`)
  - `RESULTS_ENDPOINT` to pick a POST path
  - `HEALTH_ENDPOINT` to pick a health path
  - `RESULTS_PASSWORD` to secure reads (default `Happy`; compare case-insensitively)
- The server exposes runtime config at `/config.js` so the client picks up `BASE_PATH`/`RESULTS_ENDPOINT`.

## Smoke tests (manual)
```bash
# Health
curl -i http://localhost:3000/api/health

# Write a result
curl -i -X POST http://localhost:3000/api/results \
  -H "Content-Type: application/json" \
  -d '{"studentName":"Test","studentId":"123","score":2,"totalQuestions":5,"answers":[]}'

# Read results (password required)
curl -i "http://localhost:3000/api/results?password=Happy"
```

Have fun—and maybe keep the lights on.
