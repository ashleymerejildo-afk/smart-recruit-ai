/**
 * script.js
 * Application entry point. Loads the CSV, wires up search/filters/sort,
 * renders the stats bar and candidate grid, and manages dark-mode + modal
 * state. Imported as an ES module from index.html.
 */

import { loadApplicants } from './utils/csvLoader.js';
import { computeStats } from './utils/helpers.js';
import { applyFiltersAndSort } from './utils/filters.js';
import { THEME_STORAGE_KEY } from './utils/constants.js';
import { initSearch } from './components/search.js';
import { renderFilterPanel } from './components/filters.js';
import { renderCandidateGrid } from './components/cards.js';
import { openProfileModal } from './components/modal.js';

const appState = {
  allApplicants: [],
  filterState: { jobRole: 'all', bestMatch: 'all', sortBy: 'name-asc', minAge: 0, maxAge: 100 },
  searchTerm: '',
  currentPage: 1,
};

init();

async function init() {
  initTheme();
  initFilterToggle();
  showLoadingState();

  try {
    const applicants = await loadApplicants();
    appState.allApplicants = applicants;

    hideLoadingState();
    renderStats(applicants);
    renderFilterPanel(applicants, handleFilterChange);
    initSearch(handleSearch);
    renderResults();
  } catch (err) {
    showErrorState(err.message);
  }
}

function handleFilterChange(filterState, options = {}) {
  appState.filterState = filterState;
  if (options.clearSearch) appState.searchTerm = '';
  appState.currentPage = 1;
  renderResults();
}

function handleSearch(term) {
  appState.searchTerm = term;
  appState.currentPage = 1;
  renderResults();
}

function handlePageChange(page) {
  appState.currentPage = page;
  renderResults();
  document.getElementById('candidate-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderResults() {
  const combinedState = { ...appState.filterState, searchTerm: appState.searchTerm };
  const results = applyFiltersAndSort(appState.allApplicants, combinedState);
  renderCandidateGrid(results, appState.currentPage, openProfileModal, handlePageChange);
  updateResultsCount(results.length);
}

function updateResultsCount(count) {
  const el = document.getElementById('results-count');
  if (el) el.textContent = `${count.toLocaleString()} candidate${count === 1 ? '' : 's'}`;
}

function renderStats(applicants) {
  const { total, bestMatches, uniqueRoles, avgAge } = computeStats(applicants);
  setStatValue('stat-total', total.toLocaleString());
  setStatValue('stat-best-matches', bestMatches.toLocaleString());
  setStatValue('stat-roles', uniqueRoles.toLocaleString());
  setStatValue('stat-avg-age', avgAge);
}

function setStatValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function showLoadingState() {
  const el = document.getElementById('loading-state');
  if (el) el.hidden = false;
}

function hideLoadingState() {
  const el = document.getElementById('loading-state');
  if (el) el.hidden = true;
}

function showErrorState(message) {
  hideLoadingState();
  const el = document.getElementById('data-error-state');
  if (!el) return;
  el.hidden = false;
  el.querySelector('#data-error-message').textContent = message;
}

/* ---------------- Dark mode toggle ---------------- */

function initTheme() {
  const stored = localStorage.getItem(THEME_STORAGE_KEY) || 'dark';
  applyTheme(stored);

  const toggle = document.getElementById('theme-toggle');
  toggle?.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    localStorage.setItem(THEME_STORAGE_KEY, next);
  });
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const toggle = document.getElementById('theme-toggle');
  if (toggle) toggle.textContent = theme === 'dark' ? '☀️' : '🌙';
}

/* ---------------- Collapsible filter panel (mobile/tablet) ---------------- */

function initFilterToggle() {
  const toggleBtn = document.getElementById('filter-toggle');
  const panel = document.getElementById('filter-panel');
  if (!toggleBtn || !panel) return;

  toggleBtn.addEventListener('click', () => {
    const isOpen = panel.classList.toggle('is-open');
    toggleBtn.setAttribute('aria-expanded', String(isOpen));
  });
}
