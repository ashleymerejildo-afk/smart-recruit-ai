/**
 * components/cards.js
 * Renders the candidate grid, an empty state when nothing matches, and
 * simple pagination controls (the dataset can be thousands of rows, so we
 * never render everything at once).
 */

import { escapeHtml, getInitials, stringToHue } from '../utils/helpers.js';
import { PAGE_SIZE } from '../utils/constants.js';

export function renderCandidateGrid(applicants, page, onViewProfile, onPageChange) {
  const grid = document.getElementById('candidate-grid');
  const emptyState = document.getElementById('empty-state');
  const pagination = document.getElementById('pagination');
  if (!grid) return;

  if (applicants.length === 0) {
    grid.innerHTML = '';
    pagination.innerHTML = '';
    emptyState.hidden = false;
    return;
  }

  emptyState.hidden = true;

  const totalPages = Math.max(1, Math.ceil(applicants.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const pageItems = applicants.slice(start, start + PAGE_SIZE);

  grid.innerHTML = pageItems.map((a) => cardTemplate(a)).join('');

  grid.querySelectorAll('[data-view-profile]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-view-profile');
      const applicant = applicants.find((a) => a.id === id);
      if (applicant) onViewProfile(applicant);
    });
  });

  renderPagination(pagination, safePage, totalPages, onPageChange);
}

function cardTemplate(applicant) {
  const hue = stringToHue(applicant.name);
  const matchBadge =
    applicant.bestMatch === 1
      ? '<span class="badge badge-success">Best Match</span>'
      : '<span class="badge badge-neutral">Not a Match</span>';

  return `
    <article class="candidate-card" style="--avatar-hue:${hue}">
      <div class="candidate-card__top">
        <div class="avatar">${escapeHtml(getInitials(applicant.name))}</div>
        ${matchBadge}
      </div>
      <h3 class="candidate-card__name">${escapeHtml(applicant.name)}</h3>
      <p class="candidate-card__role">${escapeHtml(applicant.jobRole)}</p>
      <p class="candidate-card__age">Age ${applicant.age}</p>
      <button class="btn btn-primary btn-block" data-view-profile="${applicant.id}" type="button">
        View Profile
      </button>
    </article>
  `;
}

function renderPagination(container, currentPage, totalPages, onPageChange) {
  if (!container) return;

  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = `
    <button class="btn btn-ghost" id="page-prev" type="button" ${currentPage === 1 ? 'disabled' : ''}>← Prev</button>
    <span class="pagination__label">Page ${currentPage} of ${totalPages}</span>
    <button class="btn btn-ghost" id="page-next" type="button" ${currentPage === totalPages ? 'disabled' : ''}>Next →</button>
  `;

  container.querySelector('#page-prev')?.addEventListener('click', () => onPageChange(currentPage - 1));
  container.querySelector('#page-next')?.addEventListener('click', () => onPageChange(currentPage + 1));
}
