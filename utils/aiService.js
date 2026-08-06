/**
 * aiService.js
 * Wraps all calls to your AI provider. Every exported function returns a
 * Promise<string> with the model's response text, and throws a descriptive
 * Error on failure so the UI can show a message + retry button.
 *
 * ⚠️ SECURITY NOTE
 * This project is a static site (GitHub Pages, no backend). Any API key
 * placed in AI_API_KEY below ships in plain text to every visitor's
 * browser and can be read from "View Source" or the Network tab in
 * seconds — there is no way to hide a client-side key. That's fine for a
 * local demo you run yourself, but it is NOT safe for a public deployment.
 *
 * For production, put your key behind a small server-side proxy (e.g. a
 * Cloudflare Worker, Vercel Edge Function, or AWS Lambda) that forwards
 * requests to the AI API and injects the key there. Point AI_API_URL at
 * that proxy instead, and never commit a real key to this file.
 */

const AI_API_URL = 'https://api.your-ai-provider.com/v1/chat/completions'; // TODO: replace with your endpoint (or proxy URL)
const AI_API_KEY = 'YOUR_API_KEY'; // TODO: never commit a real key here — see note above
const AI_MODEL = 'YOUR_MODEL_NAME'; // TODO: e.g. 'gpt-4o-mini', 'claude-sonnet-4-6', etc.

const MAX_RETRIES = 2;

/**
 * Low-level call to the AI API. Swap the body/headers below to match
 * whichever provider you use — this shape works for most OpenAI-compatible
 * chat completion endpoints.
 */
async function callAI(prompt) {
  const response = await fetch(AI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${AI_API_KEY}`,
    },
    body: JSON.stringify({
      model: AI_MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 600,
    }),
  });

  if (!response.ok) {
    throw new Error(`AI API responded with status ${response.status}.`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content ?? data?.content?.[0]?.text;

  if (!text) {
    throw new Error('The AI API returned an unexpected response format.');
  }

  return text.trim();
}

/**
 * Runs `callAI` with a couple of automatic retries on network/API failure.
 * Used internally; the UI still gets a manual Retry button for anything
 * that fails after these automatic attempts.
 */
async function callAIWithRetry(prompt, retries = MAX_RETRIES) {
  try {
    return await callAI(prompt);
  } catch (err) {
    if (retries > 0) {
      await new Promise((res) => setTimeout(res, 600));
      return callAIWithRetry(prompt, retries - 1);
    }
    throw new Error(err.message || 'The AI request failed. Check your connection and try again.');
  }
}

export async function summarizeResume(applicant) {
  const prompt = `Summarize this candidate's resume in 3-4 concise sentences for a busy recruiter.\n\nResume:\n${applicant.resume}`;
  return callAIWithRetry(prompt);
}

export async function explainMatch(applicant) {
  const prompt = `Explain in 3-4 sentences why this candidate is or isn't a strong match for the role below. Be specific and reference their actual background.\n\nCandidate resume:\n${applicant.resume}\n\nJob role: ${applicant.jobRole}\nJob description:\n${applicant.jobDescription}`;
  return callAIWithRetry(prompt);
}

export async function generateInterviewQuestions(applicant) {
  const prompt = `Based on this candidate's background and the target role, write 5 targeted interview questions a recruiter could ask. Return them as a numbered list.\n\nResume:\n${applicant.resume}\n\nJob role: ${applicant.jobRole}\nJob description:\n${applicant.jobDescription}`;
  return callAIWithRetry(prompt);
}

export async function analyzeStrengths(applicant) {
  const prompt = `List this candidate's top 3-4 strengths relevant to the role, as a short bulleted list. Be specific, based only on the resume text given.\n\nResume:\n${applicant.resume}\n\nJob role: ${applicant.jobRole}`;
  return callAIWithRetry(prompt);
}

export async function analyzeWeaknesses(applicant) {
  const prompt = `List this candidate's top 2-3 potential gaps or areas to probe further in an interview, relevant to the role, as a short bulleted list. Be constructive, not dismissive.\n\nResume:\n${applicant.resume}\n\nJob role: ${applicant.jobRole}\nJob description:\n${applicant.jobDescription}`;
  return callAIWithRetry(prompt);
}

export async function hiringRecommendation(applicant) {
  const prompt = `Based only on the skills and experience described below, give a brief hiring recommendation (2-3 sentences) for this candidate for the role. Base this purely on job-relevant qualifications.\n\nResume:\n${applicant.resume}\n\nJob role: ${applicant.jobRole}\nJob description:\n${applicant.jobDescription}`;
  return callAIWithRetry(prompt);
}
