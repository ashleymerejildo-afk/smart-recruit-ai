/**
 * components/search.js
 * Wires up the top search bar. Calls onSearch(term) after a short debounce
 * so filtering doesn't run on every single keystroke.
 */

import { debounce } from '../utils/helpers.js';

export function initSearch(onSearch) {
  const input = document.getElementById('search-input');
  if (!input) return;

  const debouncedSearch = debounce((value) => onSearch(value), 200);

  input.addEventListener('input', (e) => {
    debouncedSearch(e.target.value);
  });
}
