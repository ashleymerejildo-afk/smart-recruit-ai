/**
 * utils/filters.js
 * Pure functions that take the full applicant list plus a filter/sort
 * state object and return the resulting subset. Kept separate from the
 * DOM-facing components/filters.js, which renders the filter panel itself.
 *
 * NOTE: By design, there is no filter here for gender, race, or ethnicity.
 * Those fields are shown on an individual profile for context, but this
 * tool intentionally does not let a recruiter narrow the candidate pool
 * by protected characteristics.
 */

import { computeSkillMatch } from './helpers.js';

export function getUniqueJobRoles(applicants) {
  return [...new Set(applicants.map((a) => a.jobRole))].sort((a, b) => a.localeCompare(b));
}

export function getAgeBounds(applicants) {
  if (applicants.length === 0) return { min: 18, max: 65 };
  const ages = applicants.map((a) => a.age).filter((age) => age > 0);
  return {
    min: Math.min(...ages),
    max: Math.max(...ages),
  };
}

/**
 * @param {Array} applicants - full normalized applicant list
 * @param {Object} state - { searchTerm, jobRole, bestMatch, minAge, maxAge, sortBy }
 */
export function applyFiltersAndSort(applicants, state) {
  let result = applicants;

  if (state.searchTerm) {
    const term = state.searchTerm.trim().toLowerCase();
    result = result.filter((a) => {
      const inName = a.name.toLowerCase().includes(term);
      const inRole = a.jobRole.toLowerCase().includes(term);
      const inSkills = (a.skills || []).some((s) => s.toLowerCase().includes(term));
      return inName || inRole || inSkills;
    });
  }

  if (state.jobRole && state.jobRole !== 'all') {
    result = result.filter((a) => a.jobRole === state.jobRole);
  }

  if (state.bestMatch && state.bestMatch !== 'all') {
    const wantMatch = state.bestMatch === 'match' ? 1 : 0;
    result = result.filter((a) => a.bestMatch === wantMatch);
  }

  if (typeof state.minAge === 'number' && typeof state.maxAge === 'number') {
    result = result.filter((a) => a.age >= state.minAge && a.age <= state.maxAge);
  }

  return sortApplicants(result, state.sortBy);
}

function sortApplicants(applicants, sortBy) {
  const sorted = [...applicants];

  switch (sortBy) {
    case 'name-asc':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case 'name-desc':
      return sorted.sort((a, b) => b.name.localeCompare(a.name));
    case 'age-asc':
      return sorted.sort((a, b) => a.age - b.age);
    case 'age-desc':
      return sorted.sort((a, b) => b.age - a.age);
    case 'match-desc':
      return sorted.sort((a, b) => b.bestMatch - a.bestMatch);
    case 'match-asc':
      return sorted.sort((a, b) => a.bestMatch - b.bestMatch);
    case 'skill-match-desc':
      return sorted.sort((a, b) => skillMatchScore(b) - skillMatchScore(a));
    default:
      return sorted;
  }
}

function skillMatchScore(applicant) {
  return computeSkillMatch(applicant.skills || [], applicant.jobDescription || '').score;
}
