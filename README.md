# Smart Recruit AI

An AI-powered recruiting dashboard that helps recruiters search, filter, compare, and evaluate job candidates from a CSV dataset — fully client-side, deployable on GitHub Pages.

## Project Overview

Smart Recruit AI reads a candidate dataset (`data/applicants.csv`) directly in the browser, then gives recruiters a fast, visual way to browse candidates, filter by role and match quality, and drill into an individual profile for AI-generated insights like resume summaries, match explanations, interview questions, and a hiring recommendation.

## A Note on Fairness

This dashboard intentionally does **not** let a recruiter filter or search the candidate list by Gender, Race, or Ethnicity. Those fields are shown on a candidate's profile for transparency and record-keeping, but are excluded from the filter panel and search so the tool can't be used to screen candidates by protected characteristics. If you plan to deploy this internally, keep that boundary in place — most jurisdictions' employment law treats filtering applicants by these attributes as illegal discrimination.

## Features

- **Live CSV loading** — parses `data/applicants.csv` with PapaParse on page load; no hardcoded candidates.
- **Dashboard stats** — total candidates, best matches, unique job roles, average age.
- **Search** — instant, case-insensitive search by candidate name.
- **Filters** — job role, best match status, age range, with a Clear Filters button.
- **Sorting** — by name, age, or best match.
- **Pagination** — the grid renders in pages so large datasets stay smooth.
- **Candidate cards** — name, age, role, match badge, with hover animations.
- **Profile modal** — full candidate detail (including demographic fields for record-keeping) plus resume and job description.
- **AI Insights** — per-candidate resume summary, match explanation, interview questions, strengths, weaknesses, and a hiring recommendation, each with loading, error, and retry states.
- **Dark / light mode** toggle, persisted in `localStorage`.
- **Fully responsive** — desktop, tablet, and mobile layouts.
- **Empty and error states** — friendly messaging when filters return nothing, or when the CSV/AI API fails.

## Technologies

- HTML5, CSS3, Vanilla JavaScript (ES6 modules)
- [PapaParse](https://www.papaparse.com/) for CSV parsing
- Google Fonts: Poppins (display) + Inter (body)
- No build step, no framework, no backend — static files only

## Folder Structure

```
smart-recruit-ai/
├── index.html
├── style.css
├── script.js
├── README.md
├── data/
│   └── applicants.csv
├── images/
├── components/
│   ├── cards.js       # Candidate grid + pagination
│   ├── filters.js      # Filter panel UI
│   ├── modal.js         # Profile modal + AI actions
│   └── search.js        # Search bar wiring
└── utils/
    ├── csvLoader.js     # PapaParse loading + validation
    ├── aiService.js     # AI API calls (summarize, match, questions, etc.)
    ├── filters.js         # Filtering/sorting logic (pure functions)
    ├── helpers.js         # Formatting, debounce, stats, etc.
    └── constants.js       # Config values, palette, sort options
```

## Installation

No dependencies to install — this is a static site. Clone or download the project folder as-is.

## How to Run

Because the app loads a CSV file via `fetch` (through PapaParse), open it through a local web server rather than double-clicking `index.html` (browsers block file:// CSV loads for security reasons).

**Option A — Python:**
```bash
cd smart-recruit-ai
python3 -m http.server 8000
```
Then visit `http://localhost:8000`.

**Option B — Node (http-server):**
```bash
cd smart-recruit-ai
npx http-server -p 8000
```

**Option C — VS Code:** install the "Live Server" extension, right-click `index.html`, and choose "Open with Live Server."

## Connecting Your AI API

Open `utils/aiService.js` and fill in:

```js
const AI_API_URL = 'https://api.your-ai-provider.com/v1/chat/completions';
const AI_API_KEY = 'YOUR_API_KEY';
const AI_MODEL = 'YOUR_MODEL_NAME';
```

⚠️ **Important:** this is a static, client-side app. Any key placed here ships to every visitor's browser and can be read from dev tools — there's no way around that in a pure GitHub Pages deployment. This is fine for running the app locally yourself, but **do not deploy a real API key in a public-facing version of this site**. For production, put your key behind a small server-side proxy (a Cloudflare Worker, Vercel Edge Function, or similar) and point `AI_API_URL` at that proxy instead.

## How to Deploy to GitHub Pages

1. Push this project to a GitHub repository.
2. In the repo, go to **Settings → Pages**.
3. Under **Source**, choose the branch (e.g. `main`) and root folder (`/`).
4. Save — GitHub will publish the site at `https://<username>.github.io/<repo-name>/`.
5. Wait a minute or two for the first deploy, then visit the URL.

Since this app has no backend, the CSV and (if you choose to include one, see the security note above) any AI proxy calls need to work over plain HTTPS, which GitHub Pages provides by default.

## Future Improvements

- Move AI calls behind a real serverless proxy so a key can be used safely in production.
- Add CSV upload support so recruiters can bring their own dataset without editing files.
- Add candidate comparison view (side-by-side, 2–3 candidates).
- Add saved/starred candidates with local persistence.
- Add CSV export of the currently filtered list.
- Add unit tests for the filtering/sorting utilities.
- Virtualized scrolling for extremely large datasets instead of pagination.
