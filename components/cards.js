/**
 * components/cards.js
 * Renders the candidate list (row layout), an empty state when nothing
 * matches, and pagination controls with a page-size selector. The dataset
 * can be thousands of rows, so we never render everything at once.
 */

import { escapeHtml, getInitials, stringToHue, computeSkillMatch } from '../utils/helpers.js';
import { PAGE_SIZE_OPTIONS } from '../utils/constants.js';

export function renderCandidateGrid(applicants, page, pageSize, onViewProfile, onPageChange, onPageSizeChange) {
  const grid = document.getElementById('candidate-grid');
  const emptyState = document.getElementById('empty-state');
  const pagination = document.getElementById('pagination');
  if (!grid) return;

  if (applicants.length === 0) {
    grid.innerHTML = '';
    if (pagination) pagination.innerHTML = '';
    if (emptyState) emptyState.hidden = false;
    return;
  }

  if (emptyState) emptyState.hidden = true;

  const totalPages = Math.max(1, Math.ceil(applicants.length / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * pageSize;
  const pageItems = applicants.slice(start, start + pageSize);

  grid.innerHTML = pageItems.map((a) => rowTemplate(a)).join('');

  grid.querySelectorAll('[data-view-profile]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-view-profile');
      const applicant = applicants.find((a) => a.id === id);
      if (applicant) onViewProfile(applicant);
    });
  });

  renderPagination(pagination, safePage, totalPages, pageSize, onPageChange, onPageSizeChange);
}

function rowTemplate(applicant) {
  const hue = stringToHue(applicant.name);
  const matchBadge =
    applicant.bestMatch === 1
      ? '<span class="badge badge-success">Best Match</span>'
      : '<span class="badge badge-neutral">Not a Match</span>';

  const skills = applicant.skills || [];
  const { matchedSkills, totalSkills } = computeSkillMatch(skills, applicant.jobDescription || '');
  const matchedSet = new Set(matchedSkills);

  // Show matched skills first so the highlight is actually visible within
  // the first 3 tags, not buried after a "+N" overflow.
  const ordered = [...skills].sort((a, b) => Number(matchedSet.has(b)) - Number(matchedSet.has(a)));
  const visibleSkills = ordered.slice(0, 3);
  const extraCount = skills.length - visibleSkills.length;

  const skillTags = visibleSkills
    .map((s) => `<span class="skill-tag ${matchedSet.has(s) ? 'skill-tag--matched' : ''}">${escapeHtml(s)}</span>`)
    .join('');
  const extraTag = extraCount > 0 ? `<span class="skill-tag skill-tag--more">+${extraCount}</span>` : '';

  const skillScoreChip = totalSkills > 0
    ? `<span class="skill-score-chip" title="${matchedSkills.length} of ${totalSkills} extracted skills relate to this job's description">${matchedSkills.length}/${totalSkills} skills</span>`
    : '';

  return `
    <article class="candidate-row" style="--avatar-hue:${hue}">
      <div class="candidate-row__identity">
        <div class="avatar">${escapeHtml(getInitials(applicant.name))}</div>
        <div>
          <h3 class="candidate-row__name">${escapeHtml(applicant.name)}</h3>
          <p class="candidate-row__meta">${escapeHtml(applicant.jobRole)} · Age ${applicant.age}</p>
        </div>
      </div>

      <div class="candidate-row__match">${matchBadge}${skillScoreChip}</div>

      <div class="candidate-row__skills">
        ${skillTags}${extraTag}
      </div>

      <div class="candidate-row__action">
        <button class="btn btn-primary" data-view-profile="${applicant.id}" type="button">View Profile</button>
      </div>
    </article>
  `;
}

function renderPagination(container, currentPage, totalPages, pageSize, onPageChange, onPageSizeChange) {
  if (!container) return;

  const pageNumbers = buildPageList(currentPage, totalPages);

  const pageButtons = pageNumbers
    .map((p) =>
      p === '…'
        ? `<span class="pagination__ellipsis">…</span>`
        : `<button class="pagination__page ${p === currentPage ? 'is-active' : ''}" data-page="${p}" type="button">${p}</button>`
    )
    .join('');

  container.innerHTML = `
    <button class="btn btn-ghost pagination__arrow" id="page-prev" type="button" ${currentPage === 1 ? 'disabled' : ''} aria-label="Previous page">←</button>
    <div class="pagination__pages">${pageButtons}</div>
    <button class="btn btn-ghost pagination__arrow" id="page-next" type="button" ${currentPage === totalPages ? 'disabled' : ''} aria-label="Next page">→</button>
    <select class="pagination__size" id="page-size" aria-label="Candidates per page">
      ${PAGE_SIZE_OPTIONS.map((n) => `<option value="${n}" ${n === pageSize ? 'selected' : ''}>${n} per page</option>`).join('')}
    </select>
  `;

  container.querySelector('#page-prev')?.addEventListener('click', () => onPageChange(currentPage - 1));
  container.querySelector('#page-next')?.addEventListener('click', () => onPageChange(currentPage + 1));
  container.querySelectorAll('[data-page]').forEach((btn) => {
    btn.addEventListener('click', () => onPageChange(Number(btn.dataset.page)));
  });
  container.querySelector('#page-size')?.addEventListener('change', (e) => {
    onPageSizeChange(Number(e.target.value));
  });
}

/**
 * Builds a compact page list like [1, '…', 4, 5, 6, '…', 50] instead of
 * rendering a button for every page when there are hundreds of them.
 */
function buildPageList(current, total) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages = new Set([1, 2, total - 1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);

  const withEllipsis = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) withEllipsis.push('…');
    withEllipsis.push(p);
  });

  return withEllipsis;
}
