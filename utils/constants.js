/**
 * constants.js
 * Central place for configuration values used across the app.
 * Nothing here should contain real secrets — see aiService.js for the
 * API key placeholder and why it stays a placeholder in a static site.
 */

export const CSV_PATH = 'data/applicants.csv';

// How many candidate cards to render per page in the grid.
export const PAGE_SIZE = 20;

// Options offered in the "X per page" selector.
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

// Fields that are deliberately NOT exposed as filter/search criteria.
// Age, Gender, Race and Ethnicity are shown on a candidate's profile for
// transparency, but are intentionally excluded from the filter panel so the
// tool can't be used to screen candidates by protected characteristics.
export const DEMOGRAPHIC_FIELDS = ['Age', 'Gender', 'Race', 'Ethnicity'];

export const SORT_OPTIONS = [
  { value: 'name-asc', label: 'Name (A–Z)' },
  { value: 'name-desc', label: 'Name (Z–A)' },
  { value: 'age-asc', label: 'Age (Low to High)' },
  { value: 'age-desc', label: 'Age (High to Low)' },
  { value: 'match-desc', label: 'Best Match First' },
  { value: 'match-asc', label: 'Best Match Last' },
];

export const THEME_STORAGE_KEY = 'smart-recruit-theme';

export const COLORS = {
  background: '#0F172A',
  card: '#1E293B',
  primary: '#2563EB',
  accent: '#38BDF8',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
};
