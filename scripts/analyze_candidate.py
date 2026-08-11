"""
analyze_candidate.py
Uses the current OpenAI Python SDK (openai>=1.0). The original script used
the v0.x API (openai.ChatCompletion.create + dict-style response access),
which was removed when openai 1.0 shipped in Nov 2023.

Install: pip install --upgrade openai
"""

import os
from openai import OpenAI

# Matches the OPENAI_API_KEY env var name used in the deployed app's
# Vercel serverless function (api/ai.js), so the same key can be reused
# locally without renaming anything.
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def analyze_candidate(resume_text, job_description):
    prompt = f"""
    Analyze this candidate for the given job.

    Job Description:
    {job_description}

    Candidate Resume:
    {resume_text}

    Provide:
    1. A brief summary of the candidate
    2. Key strengths relevant to the role
    3. Potential weaknesses or gaps
    4. 3 tailored interview questions
    5. A comparison score (0-100) of resume fit to job description
    """

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",  # cheaper/faster than gpt-4; swap to "gpt-4o" for higher quality
            messages=[{"role": "user", "content": prompt}],
            temperature=0.4,
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"Error generating analysis: {e}"


if __name__ == "__main__":
    import pandas as pd

    df = pd.read_csv('applicants.csv')
    result = analyze_candidate(df.iloc[0]['Resume'], df.iloc[0]['Job Description'])
    print(result)
