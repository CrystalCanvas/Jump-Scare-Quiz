# Paranoia Quiz

Short, spooky quiz that grabs a student name/ID, jump-scares you on wrong answers, and records every run.

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
- View stored results at http://localhost:3000/results. Click “Enter Password,” type `Happy`, and the table will load.
- Text view is available at `/api/results` with the same password (via `?password=Happy` or header `x-results-password: Happy`).

Have fun—and maybe keep the lights on.
