/**
 * csvLoader.js
 * Loads and validates the applicants CSV using PapaParse, and normalizes
 * each row into a clean JavaScript object the rest of the app can rely on.
 */

import { CSV_PATH } from './constants.js';
import { toInt, extractSkills } from './helpers.js';

const REQUIRED_COLUMNS = [
  'Job Applicant Name',
  'Age',
  'Gender',
  'Race',
  'Ethnicity',
  'Resume',
  'Job Roles',
  'Job Description',
  'Best Match',
];

/**
 * Loads the CSV file and resolves with an array of normalized applicant
 * objects. Rejects with a descriptive Error the UI can display if anything
 * goes wrong (missing file, empty file, malformed structure).
 */
export function loadApplicants() {
  return new Promise((resolve, reject) => {
    if (typeof Papa === 'undefined') {
      reject(new Error('PapaParse failed to load. Check your internet connection or script tag.'));
      return;
    }

    Papa.parse(CSV_PATH, {
      download: true,
      header: true,
      skipEmptyLines: true,
      worker: true, // parses off the main thread — this file can be ~10k rows, and without
                     // this the browser tab can visibly freeze for a moment on first load
      complete: (results) => {
        try {
          validate(results);
          const applicants = results.data.map(normalizeRow).filter(Boolean);

          if (applicants.length === 0) {
            reject(new Error('The CSV file was read, but no valid candidate rows were found.'));
            return;
          }

          resolve(applicants);
        } catch (err) {
          reject(err);
        }
      },
      error: (err) => {
        reject(new Error(`Could not load "${CSV_PATH}". ${err.message || 'The file may be missing.'}`));
      },
    });
  });
}

function validate(results) {
  if (!results || !Array.isArray(results.data)) {
    throw new Error('The CSV file could not be parsed into rows.');
  }

  if (results.data.length === 0) {
    throw new Error('The CSV file is empty.');
  }

  const fields = results.meta?.fields ?? [];
  const missing = REQUIRED_COLUMNS.filter((col) => !fields.includes(col));

  if (missing.length > 0) {
    throw new Error(`The CSV is missing required column(s): ${missing.join(', ')}.`);
  }
}

/**
 * Converts a raw CSV row into a normalized applicant object with safe,
 * typed fields. Rows with a missing name or role are dropped since they
 * can't be meaningfully displayed.
 */
function normalizeRow(row, index) {
  const name = (row['Job Applicant Name'] || '').trim();
  const jobRole = (row['Job Roles'] || '').trim();

  if (!name || !jobRole) return null;

  return {
    id: `applicant-${index}`,
    name,
    age: toInt(row['Age'], 0),
    gender: (row['Gender'] || 'Not specified').trim(),
    race: (row['Race'] || 'Not specified').trim(),
    ethnicity: (row['Ethnicity'] || 'Not specified').trim(),
    resume: (row['Resume'] || 'No resume summary available.').trim(),
    skills: extractSkills(row['Resume'] || ''),
    jobRole,
    jobDescription: (row['Job Description'] || 'No job description available.').trim(),
    bestMatch: toInt(row['Best Match'], 0),
  };
}
