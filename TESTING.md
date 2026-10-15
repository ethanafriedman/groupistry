# Groupistry Test Guide

This file gives you three levels of testing: a browser demo, automated backend tests, and an end-to-end API smoke test.

## A. Browser demo test

Start the backend and frontend, then open `http://localhost:5173`.

Use `data/sample_requests.csv`.

### Import settings

- Name column: `Name`
- Preference columns in this order:
  1. `Preference 1`
  2. `Preference 2`
  3. `Preference 3`
- Ranked requests: enabled

The sample contains six participants and all names should resolve exactly.

### Capacity test

Set default capacity to **3** and auto-create groups.

Expected behavior:

- 2 groups are created
- total capacity is 6
- after optimization, no group has more than 3 people
- all 6 participants are assigned exactly once

### Soft-preference baseline

Add no private rules and run **Fair Coverage**.

Expected behavior:

- assignments are returned
- the results page shows coverage, top choices, total preferences, and mutual-pair metrics
- capacity remains respected

### Hard-constraint override test

Add:

```text
Cannot be together: Alex Morgan + Jordan Lee
```

They mutually request each other in the sample data. Run the solver again.

Expected behavior:

- Alex and Jordan are in different groups
- the hard rule is obeyed even though placing them together would help preference satisfaction

Now remove that rule and add:

```text
Must be together: Alex Morgan + Jordan Lee
```

Expected behavior:

- Alex and Jordan are in the same group

This is the clearest demonstration that admin rules are hard constraints and participant requests are soft preferences.

## B. Backend unit/API tests

Install requirements, activate the Python virtual environment, then run from the project root:

```bash
python -m unittest discover -s tests
```

## C. Running-API smoke test

Terminal 1:

```bash
uvicorn api.main:app --reload
```

Terminal 2, with the same Python virtual environment activated:

```bash
python scripts/smoke_test.py
```

Expected final line:

```text
All smoke tests passed.
```

## D. Frontend compile check

From `frontend/`:

```bash
npm install
npm run build
```

The build should complete without TypeScript errors.
