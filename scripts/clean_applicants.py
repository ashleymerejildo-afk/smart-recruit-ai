"""
clean_applicants.py
Cleans the raw applicants CSV. This is a corrected version of the original
script — see the inline notes marked FIX for what changed and why.
"""

import pandas as pd

df = pd.read_csv('applicants.csv')
print(f"Loaded: {len(df)} rows")

# 1. Missing values -----------------------------------------------------
print("\nMissing values:\n", df.isnull().sum())

before = len(df)
df = df.dropna(subset=['Job Applicant Name', 'Resume', 'Job Description'])
print(f"Dropped {before - len(df)} rows missing a critical field (Name/Resume/Job Description)")

# FIX: convert Age to numeric BEFORE filling, so bad/non-numeric values
# become NaN (and get the median) instead of crashing astype(int) later.
df['Age'] = pd.to_numeric(df['Age'], errors='coerce')
missing_age = df['Age'].isna().sum()
df['Age'] = df['Age'].fillna(df['Age'].median())  # FIX: no inplace= on a
# column slice — that pattern triggers a SettingWithCopy warning/future
# error in recent pandas. Reassigning the column is the safe form.
if missing_age:
    print(f"Filled {missing_age} missing Age values with the median")

df = df.fillna({'Gender': 'Not Specified', 'Race': 'Not Specified', 'Ethnicity': 'Not Specified'})

# 2. Duplicates -----------------------------------------------------------
# FIX: the original deduped on (Name, Resume). This dataset intentionally
# reuses names for different people (e.g. multiple "Aaron Smith" entries
# with different ages/roles) — deduping on name would silently merge
# distinct candidates into one. Only drop rows that are complete,
# exact duplicates across every column.
before = len(df)
df = df.drop_duplicates()
print(f"Dropped {before - len(df)} exact duplicate rows")

# 3. Text formatting --------------------------------------------------------
# FIX: Title-casing personal names corrupts real names with internal
# capitals — "McDonald".title() -> "Mcdonald", same for MacArthur,
# O'Brien, DiCaprio, etc. We leave the person's name exactly as given.
# Title-casing is only safe here for short categorical fields.
categorical_cols = ['Gender', 'Race', 'Ethnicity', 'Job Roles']
for col in categorical_cols:
    df[col] = df[col].str.strip().str.title()

df['Job Applicant Name'] = df['Job Applicant Name'].str.strip()
df['Resume'] = df['Resume'].str.strip()
df['Job Description'] = df['Job Description'].str.strip()

# 4. Data types --------------------------------------------------------------
df['Age'] = df['Age'].astype(int)

# FIX: Best Match is a binary flag (0/1) in this dataset, not a continuous
# score — the app already relies on that. Coercing silently and letting
# invalid values become NaN -> 0 hides bad data. Report it instead.
df['Best Match'] = pd.to_numeric(df['Best Match'], errors='coerce')
invalid_best_match = df['Best Match'].isna().sum()
if invalid_best_match:
    print(f"⚠️  {invalid_best_match} rows had a non-numeric Best Match value — check these before treating them as 0")
df['Best Match'] = df['Best Match'].fillna(0).astype(int)
unexpected = df.loc[~df['Best Match'].isin([0, 1]), 'Best Match'].unique()
if len(unexpected):
    print(f"⚠️  Best Match has values outside 0/1: {unexpected} — the app treats anything non-1 as 'not a match'")

df.to_csv('cleaned_applicants.csv', index=False)
print(f"\nFinal cleaned rows: {len(df)}")
