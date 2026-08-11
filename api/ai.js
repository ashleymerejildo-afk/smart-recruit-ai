/**
 * api/ai.js
 * Vercel Serverless Function. This is the ONLY place the real OpenAI
 * API key ever lives — as the OPENAI_API_KEY environment variable in
 * your Vercel project settings, never in the repo.
 *
 * The browser (utils/aiService.js) posts { prompt } here. This function
 * adds the key and forwards the request to OpenAI, then returns just
 * the generated text back to the browser.
 */

const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed. Use POST.' });
    return;
  }

  const { prompt } = req.body || {};
  if (!prompt || typeof prompt !== 'string') {
    res.status(400).json({ error: 'Request body must include a "prompt" string.' });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    // This means the env var wasn't set in Vercel — a deploy/config issue,
    // not something the end user did wrong.
    res.status(500).json({ error: 'Server is missing OPENAI_API_KEY. Add it in Vercel → Settings → Environment Variables.' });
    return;
  }

  try {
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 600,
      }),
    });

    if (!openaiResponse.ok) {
      const errBody = await openaiResponse.text();
      res.status(openaiResponse.status).json({ error: `OpenAI API error (${openaiResponse.status}): ${errBody}` });
      return;
    }

    const data = await openaiResponse.json();
    const text = data?.choices?.[0]?.message?.content;

    if (!text) {
      res.status(502).json({ error: 'OpenAI API returned an unexpected response format.' });
      return;
    }

    res.status(200).json({ text });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Unexpected server error calling the AI provider.' });
  }
}
