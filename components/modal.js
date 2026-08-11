/**
 * components/modal.js
 * Renders the candidate profile modal, including the AI-powered actions
 * (summarize, explain match, interview questions, strengths/weaknesses,
 * hiring recommendation). Each AI action shows a loading state, an error
 * with a retry button on failure, and the result once it succeeds.
 */

import { escapeHtml, getInitials, stringToHue, computeSkillMatch } from '../utils/helpers.js';
import {
  summarizeResume,
  explainMatch,
  generateInterviewQuestions,
  analyzeStrengths,
  analyzeWeaknesses,
  hiringRecommendation,
} from '../utils/aiService.js';

const AI_ACTIONS = [
  { id: 'summary', label: 'Summarize Resume', fn: summarizeResume },
  { id: 'match', label: 'Explain Match', fn: explainMatch },
  { id: 'questions', label: 'Interview Questions', fn: generateInterviewQuestions },
  { id: 'strengths', label: 'Strengths', fn: analyzeStrengths },
  { id: 'weaknesses', label: 'Weaknesses', fn: analyzeWeaknesses },
  { id: 'recommendation', label: 'Hiring Recommendation', fn: hiringRecommendation },
];

export function openProfileModal(applicant) {
  const overlay = document.getElementById('modal-overlay');
  const modal = document.getElementById('profile-modal');
  if (!overlay || !modal) return;

  const hue = stringToHue(applicant.name);
  const matchBadge =
    applicant.bestMatch === 1
      ? '<span class="badge badge-success">Best Match</span>'
      : '<span class="badge badge-neutral">Not a Match</span>';

  modal.innerHTML = `
    <div class="modal__header">
      <div class="avatar avatar--lg" style="--avatar-hue:${hue}">${escapeHtml(getInitials(applicant.name))}</div>
      <div>
        <h2>${escapeHtml(applicant.name)}</h2>
        <p class="modal__subtitle">${escapeHtml(applicant.jobRole)}</p>
        ${matchBadge}
      </div>
      <button class="modal__close" id="modal-close" type="button" aria-label="Close">✕</button>
    </div>

    <div class="modal__body">
      <section class="modal__section">
        <h3>Candidate Details</h3>
        <dl class="detail-list">
          <div><dt>Age</dt><dd>${applicant.age}</dd></div>
          <div><dt>Gender</dt><dd>${escapeHtml(applicant.gender)}</dd></div>
          <div><dt>Race</dt><dd>${escapeHtml(applicant.race)}</dd></div>
          <div><dt>Ethnicity</dt><dd>${escapeHtml(applicant.ethnicity)}</dd></div>
        </dl>
      </section>

      ${(applicant.skills && applicant.skills.length)
        ? (() => {
            const { matchedSkills, totalSkills } = computeSkillMatch(applicant.skills, applicant.jobDescription || '');
            const matchedSet = new Set(matchedSkills);
            return `<section class="modal__section">
             <h3>Skills — ${matchedSkills.length}/${totalSkills} match this role</h3>
             <div class="skill-tag-list">
               ${applicant.skills.map((s) => `<span class="skill-tag ${matchedSet.has(s) ? 'skill-tag--matched' : ''}">${escapeHtml(s)}</span>`).join('')}
             </div>
           </section>`;
          })()
        : ''}
      </section>

      <section class="modal__section">
        <h3>Resume</h3>
        <p class="modal__text">${escapeHtml(applicant.resume)}</p>
      </section>

      <section class="modal__section">
        <h3>Job Description</h3>
        <p class="modal__text">${escapeHtml(applicant.jobDescription)}</p>
      </section>

      <section class="modal__section">
        <h3>AI Insights</h3>
        <div class="ai-actions">
          ${AI_ACTIONS.map((action) => `<button class="btn btn-secondary" data-ai-action="${action.id}" type="button">${action.label}</button>`).join('')}
        </div>
        <div id="ai-output" class="ai-output"></div>
      </section>
    </div>
  `;

  overlay.hidden = false;
  document.body.classList.add('modal-open');

  const closeBtn = document.getElementById('modal-close');
  closeBtn.addEventListener('click', closeProfileModal);
  closeBtn.focus();

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeProfileModal();
  });

  document.addEventListener('keydown', handleEscapeKey);

  modal.querySelectorAll('[data-ai-action]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const actionId = btn.getAttribute('data-ai-action');
      const action = AI_ACTIONS.find((a) => a.id === actionId);
      if (action) runAIAction(action, applicant);
    });
  });
}

export function closeProfileModal() {
  const overlay = document.getElementById('modal-overlay');
  if (!overlay) return;
  overlay.hidden = true;
  document.body.classList.remove('modal-open');
  document.removeEventListener('keydown', handleEscapeKey);
}

function handleEscapeKey(e) {
  if (e.key === 'Escape') closeProfileModal();
}

async function runAIAction(action, applicant) {
  const output = document.getElementById('ai-output');
  if (!output) return;

  output.innerHTML = `
    <div class="ai-result">
      <h4>${escapeHtml(action.label)}</h4>
      <div class="ai-loading">
        <span class="spinner"></span> Generating…
      </div>
    </div>
  `;

  try {
    const text = await action.fn(applicant);
    output.innerHTML = `
      <div class="ai-result">
        <h4>${escapeHtml(action.label)}</h4>
        <p class="ai-result__text">${escapeHtml(text).replace(/\n/g, '<br>')}</p>
      </div>
    `;
  } catch (err) {
    output.innerHTML = `
      <div class="ai-result ai-result--error">
        <h4>${escapeHtml(action.label)}</h4>
        <p class="ai-error-message">⚠️ ${escapeHtml(err.message || 'Something went wrong generating this.')}</p>
        <button class="btn btn-secondary" id="ai-retry" type="button">Retry</button>
      </div>
    `;
    document.getElementById('ai-retry')?.addEventListener('click', () => runAIAction(action, applicant));
  }
}
