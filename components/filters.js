/**
 * components/filters.js
 * Renders and wires up the filter panel: job role, best match, age range,
 * sort order, and the clear-filters button.
 *
 * Intentionally does NOT include gender, race, or ethnicity filters —
 * see utils/filters.js for why.
 */

import { getUniqueJobRoles, getAgeBounds } from '../utils/filters.js';
import { SORT_OPTIONS } from '../utils/constants.js';

export function renderFilterPanel(applicants, onChange) {
  const panel = document.getElementById('filter-panel');
  if (!panel) return;

  const roles = getUniqueJobRoles(applicants);
  const { min, max } = getAgeBounds(applicants);

  panel.innerHTML = `
    <div class="filter-group">
      <label for="filter-role">Job Role</label>
      <select id="filter-role">
        <option value="all">All roles</option>
        ${roles.map((role) => `<option value="${role}">${role}</option>`).join('')}
      </select>
    </div>

    <div class="filter-group">
      <label for="filter-match">Best Match</label>
      <select id="filter-match">
        <option value="all">All candidates</option>
        <option value="match">Best matches only</option>
        <option value="no-match">Not a match</option>
      </select>
    </div>

    <div class="filter-group">
      <label for="filter-sort">Sort by</label>
      <select id="filter-sort">
        ${SORT_OPTIONS.map((opt) => `<option value="${opt.value}">${opt.label}</option>`).join('')}
      </select>
    </div>

    <div class="filter-group filter-group--range">
      <label for="filter-age">Age range: <span id="age-range-label">${min} – ${max}</span></label>
      <div class="age-slider">
        <input type="range" id="filter-age-min" min="${min}" max="${max}" value="${min}" />
        <input type="range" id="filter-age-max" min="${min}" max="${max}" value="${max}" />
      </div>
    </div>

    <button id="clear-filters" class="btn btn-ghost" type="button">Clear Filters</button>
  `;

  const state = { jobRole: 'all', bestMatch: 'all', sortBy: 'name-asc', minAge: min, maxAge: max };

  const roleSelect = document.getElementById('filter-role');
  const matchSelect = document.getElementById('filter-match');
  const sortSelect = document.getElementById('filter-sort');
  const ageMin = document.getElementById('filter-age-min');
  const ageMax = document.getElementById('filter-age-max');
  const ageLabel = document.getElementById('age-range-label');

  roleSelect.addEventListener('change', (e) => {
    state.jobRole = e.target.value;
    onChange(state);
  });

  matchSelect.addEventListener('change', (e) => {
    state.bestMatch = e.target.value;
    onChange(state);
  });

  sortSelect.addEventListener('change', (e) => {
    state.sortBy = e.target.value;
    onChange(state);
  });

  const handleAgeChange = () => {
    let lo = parseInt(ageMin.value, 10);
    let hi = parseInt(ageMax.value, 10);
    if (lo > hi) [lo, hi] = [hi, lo];
    state.minAge = lo;
    state.maxAge = hi;
    ageLabel.textContent = `${lo} – ${hi}`;
    onChange(state);
  };

  ageMin.addEventListener('input', handleAgeChange);
  ageMax.addEventListener('input', handleAgeChange);

  document.getElementById('clear-filters').addEventListener('click', () => {
    roleSelect.value = 'all';
    matchSelect.value = 'all';
    sortSelect.value = 'name-asc';
    ageMin.value = min;
    ageMax.value = max;
    ageLabel.textContent = `${min} – ${max}`;

    state.jobRole = 'all';
    state.bestMatch = 'all';
    state.sortBy = 'name-asc';
    state.minAge = min;
    state.maxAge = max;

    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = '';

    onChange(state, { clearSearch: true });
  });

  // Push initial state up so the grid renders with defaults applied.
  onChange(state);
}
