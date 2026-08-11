/**
 * script.js
 * Application entry point. Loads the candidate CSV, then wires together
 * the filter panel, search box, candidate list, profile modal, mobile
 * filter drawer, dark/light theme toggle, and the insight banner.
 */

import { loadApplicants } from './utils/csvLoader.js';
import { applyFiltersAndSort } from './utils/filters.js';
import { computeStats } from './utils/helpers.js';
import { THEME_STORAGE_KEY, PAGE_SIZE } from './utils/constants.js';
import { renderFilterPanel } from './components/filters.js';
import { renderCandidateGrid } from './components/cards.js';
import { initSearch } from './components/search.js';
import { openProfileModal } from './components/modal.js';

let allApplicants = [];
let currentPage = 1;
let pageSize = PAGE_SIZE;
let filterState = {
  searchTerm: '',
  jobRole: 'all',
  bestMatch: 'all',
  sortBy: 'name-asc',
  minAge: 0,
  maxAge: 200,
};

const loadingState = document.getElementById('loading-state');
const errorState = document.getElementById('data-error-state');
const errorMessage = document.getElementById('data-error-message');
const resultsCount = document.getElementById('results-count');

initTheme();
initFilterDrawer();
init();

/* ----------------------------------------------------------------------
   Bootstrapping
---------------------------------------------------------------------- */

async function init() {
  setLoading(true);

  try {
    allApplicants = await loadApplicants();
    setLoading(false);

    renderStats(allApplicants);
    renderFilterPanel(allApplicants, handleFilterChange); // triggers the first list render
    renderInsight(allApplicants);
    initSearch(handleSearch);
    initThemeToggle();
  } catch (err) {
    setLoading(false);
    if (errorState) errorState.hidden = false;
    if (errorMessage) {
      errorMessage.textContent = err?.message || 'Please check your connection and try refreshing the page.';
    }
  }
}

function setLoading(isLoading) {
  if (loadingState) loadingState.hidden = !isLoading;
  if (errorState) errorState.hidden = true;
}

/* ----------------------------------------------------------------------
   Filtering, sorting, search, pagination
---------------------------------------------------------------------- */

function handleFilterChange(state, opts = {}) {
  filterState = {
    ...filterState,
    ...state,
    searchTerm: opts.clearSearch ? '' : filterState.searchTerm,
  };
  currentPage = 1;
  applyAndRender();
}

function handleSearch(term) {
  filterState = { ...filterState, searchTerm: term };
  currentPage = 1;
  applyAndRender();
}

function handlePageChange(page) {
  currentPage = page;
  applyAndRender();
  document.getElementById('candidates-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function handlePageSizeChange(newSize) {
  pageSize = newSize;
  currentPage = 1;
  applyAndRender();
}

function applyAndRender() {
  const filtered = applyFiltersAndSort(allApplicants, filterState);

  if (resultsCount) {
    resultsCount.textContent = `${filtered.length.toLocaleString()} of ${allApplicants.length.toLocaleString()}`;
  }

  renderCandidateGrid(filtered, currentPage, pageSize, openProfileModal, handlePageChange, handlePageSizeChange);
}

/* ----------------------------------------------------------------------
   Stats cards
---------------------------------------------------------------------- */

function renderStats(applicants) {
  const { total, bestMatches, uniqueRoles, avgAge } = computeStats(applicants);
  setText('stat-total', total.toLocaleString());
  setText('stat-best-matches', bestMatches.toLocaleString());
  setText('stat-roles', uniqueRoles.toLocaleString());
  setText('stat-avg-age', avgAge);
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

/* ----------------------------------------------------------------------
   Insight banner — a real number derived from the loaded data
   (not an AI call, so it costs nothing and is always accurate)
---------------------------------------------------------------------- */

function renderInsight(applicants) {
  const banner = document.getElementById('insight-banner');
  const text = document.getElementById('insight-text');
  if (!banner || !text) return;

  const bestMatches = applicants.filter((a) => a.bestMatch === 1);
  const rolesWithBestMatch = new Set(bestMatches.map((a) => a.jobRole)).size;

  if (bestMatches.length === 0 || rolesWithBestMatch === 0) {
    banner.hidden = true;
    return;
  }

  text.textContent = `You have ${bestMatches.length.toLocaleString()} candidates marked as a Best Match across ${rolesWithBestMatch} job role${rolesWithBestMatch === 1 ? '' : 's'}.`;
  banner.hidden = false;
}

/* ----------------------------------------------------------------------
   Mobile filter drawer (the "Filters" toggle button under 1024px)
---------------------------------------------------------------------- */

function initFilterDrawer() {
  const toggle = document.getElementById('filter-toggle');
  const panel = document.getElementById('filter-panel');
  if (!toggle || !panel) return;

  toggle.addEventListener('click', () => {
    const isOpen = panel.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });
}

/* ----------------------------------------------------------------------
   Theme toggle (persisted in localStorage)
---------------------------------------------------------------------- */

function initTheme() {
  const saved = localStorage.getItem(THEME_STORAGE_KEY);
  const theme = saved === 'light' || saved === 'dark' ? saved : 'dark';
  document.documentElement.setAttribute('data-theme', theme);
}

function initThemeToggle() {
  const toggle = document.getElementById('theme-toggle');
  if (!toggle) return;

  syncThemeIcon(toggle);

  toggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem(THEME_STORAGE_KEY, next);
    syncThemeIcon(toggle);
  });
}

function syncThemeIcon(toggle) {
  const current = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  toggle.textContent = current === 'dark' ? '☀️' : '🌙';
  toggle.setAttribute('aria-label', current === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
}
