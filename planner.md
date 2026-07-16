You are helping me plan a simple, clean UPSC quiz platform inside this GitHub repository:

https://github.com/sanjali123/PYQ

IMPORTANT: DO NOT EXECUTE ANY CHANGES YET.

Your task in this phase is only to inspect the repository, understand the requirements, and create a detailed implementation plan.

Do not:
- create files
- edit files
- install packages
- run migrations
- write code
- commit changes
- push to GitHub
- modify the repository in any way

First produce a plan for my approval.

PROJECT GOAL

Build a Docker-hosted UPSC previous-year-question quiz platform.

The user-facing flow should be:

Home
→ UPSC
→ Attempt Tests
→ Year buttons such as:
   - 2026
   - 2025
   - 2024
   - 2023

When a user clicks a year, show tests available for that year.

For the first version, implement only:

UPSC
→ Attempt Tests
→ 2026
→ General Studies Paper I

There should be no public PDF upload interface.

Tests will be added by the developer through structured data files.

REFERENCE PAPER

The first test is:

UPSC Civil Services Preliminary Examination 2026
General Studies Paper I
Series A

Test details:

- 100 questions
- 120 minutes
- Maximum marks: 200
- Correct answer: +2
- Incorrect answer: -0.6667
- Unattempted: 0
- Question 64 is dropped
- 99 questions are used for scoring

The source paper contains varied formats, including:

- standard MCQs
- multiple-statement questions
- “how many statements are correct/incorrect?”
- assertion-reason
- assertion-support
- matching pairs
- matching lists
- table-based questions
- case-based questions

TECH STACK TO PLAN FOR

Frontend:
- React
- TypeScript
- Vite
- Tailwind CSS
- React Router

Backend:
- FastAPI
- Python
- SQLAlchemy
- SQLite

Deployment:
- Docker
- Docker Compose

The final application should eventually run with:

docker compose up --build

PRODUCT PAGES

Plan for the following pages:

1. Home page
2. UPSC section page
3. Attempt Tests page
4. Year selection page
5. Tests available for a selected year
6. Test instructions page
7. Test attempt interface
8. Submission confirmation
9. Results page
10. Answer-review page

EXPECTED USER FLOW

Home

UPSC Civil Services Examination

[ Attempt Tests ]

Then:

Attempt UPSC Tests

[ 2026 ]
[ 2025 — Coming Soon ]
[ 2024 — Coming Soon ]
[ 2023 — Coming Soon ]

Then:

2026 Tests

General Studies Paper I

- 100 Questions
- 120 Minutes
- Maximum Marks: 200
- Negative marking: One-third
- One dropped question
- 99 questions used for scoring

[ Start Test ]

TEST INTERFACE REQUIREMENTS

Plan a desktop and mobile layout.

Desktop:

Top bar:
- test title
- timer
- submit button

Main area:
- question number
- question text
- statements, tables or matching lists where needed
- four answer options
- action buttons

Right sidebar:
- question palette
- status legend

Buttons:

- Previous
- Clear Response
- Mark for Review
- Save & Next

Question states:

- Not Visited
- Not Answered
- Answered
- Marked for Review
- Answered and Marked for Review
- Dropped

Question 64 must display:

“Dropped Question — Not included in scoring.”

It must not affect:
- attempted count
- correct count
- incorrect count
- negative marking
- final score

RESULTS PAGE

Plan to show:

- final score
- official maximum marks
- correct answers
- incorrect answers
- unattempted questions
- dropped questions
- accuracy
- time taken

Buttons:

- Review Answers
- Return to Tests

DATA STORAGE

Do not hard-code questions inside React components.

Plan to store test data in JSON files, for example:

backend/data/upsc/2026/gs-paper-1.json

Suggested schema:

{
  "id": "upsc-2026-gs-paper-1",
  "exam": "UPSC Civil Services Examination",
  "year": 2026,
  "paper": "General Studies Paper I",
  "series": "A",
  "duration_minutes": 120,
  "maximum_marks": 200,
  "total_questions": 100,
  "questions_for_scoring": 99,
  "marks_per_correct": 2,
  "negative_marks": 0.6667,
  "questions": [
    {
      "number": 1,
      "type": "standard_mcq",
      "stem": "Question text",
      "statements": [],
      "pairs": [],
      "table": null,
      "options": [
        {
          "label": "A",
          "text": "Option A"
        },
        {
          "label": "B",
          "text": "Option B"
        },
        {
          "label": "C",
          "text": "Option C"
        },
        {
          "label": "D",
          "text": "Option D"
        }
      ],
      "correct_option": "D",
      "is_dropped": false
    }
  ]
}

SUPPORTED QUESTION TYPES

Plan reusable rendering for:

- standard_mcq
- multiple_statements
- count_correct
- count_incorrect
- assertion_reason
- assertion_support
- matching_pairs
- matching_lists
- table_based
- case_based

Suggested reusable components:

- QuestionRenderer
- StatementList
- MatchingPairs
- MatchingLists
- QuestionTable
- OptionList
- QuestionPalette
- Timer
- SubmissionSummary

ANSWER KEY

Use this answer key in the plan:

1 D
2 A
3 C
4 B
5 B
6 A
7 D
8 A
9 C
10 C
11 D
12 A
13 C
14 B
15 B
16 B
17 A
18 D
19 D
20 B
21 B
22 B
23 D
24 D
25 C
26 C
27 A
28 D
29 C
30 B
31 A
32 B
33 B
34 B
35 B
36 B
37 C
38 B
39 B
40 C
41 C
42 B
43 C
44 B
45 B
46 C
47 B
48 B
49 C
50 B
51 C
52 A
53 B
54 D
55 B
56 B
57 A
58 C
59 D
60 A
61 D
62 D
63 A
64 DROPPED
65 D
66 A
67 B
68 A
69 C
70 A
71 B
72 C
73 D
74 B
75 C
76 C
77 B
78 B
79 C
80 C
81 C
82 A
83 C
84 A
85 A
86 C
87 A
88 C
89 C
90 D
91 A
92 C
93 B
94 B
95 A
96 C
97 C
98 D
99 A
100 A

SCORING LOGIC

Plan for this scoring behaviour:

Correct:
+2

Incorrect:
-0.6667

Unattempted:
0

Dropped:
excluded

Pseudo-logic:

for question in questions:
    if question.is_dropped:
        continue

    selected = responses.get(question.number)

    if selected is None:
        unattempted += 1
    elif selected == question.correct_option:
        correct += 1
        score += marks_per_correct
    else:
        incorrect += 1
        score -= negative_marks

Round the displayed score to two decimal places.

Do not assume:

maximum_marks = questions_for_scoring × marks_per_correct

The official paper still states maximum marks as 200.

BACKEND API TO PLAN

Plan endpoints such as:

GET /api/exams
GET /api/exams/upsc/years
GET /api/exams/upsc/2026/tests
GET /api/tests/upsc-2026-gs-paper-1
POST /api/attempts
PATCH /api/attempts/{attempt_id}/responses
GET /api/attempts/{attempt_id}
POST /api/attempts/{attempt_id}/submit

Store:

- anonymous attempt ID
- selected answers
- marked-for-review status
- visited status
- start time
- expiry time
- submission time
- final score
- correct count
- incorrect count
- unattempted count
- dropped count

No login is required in the MVP.

TIMER REQUIREMENTS

Plan for:

- timer starting only after Begin Test
- remaining time surviving refresh
- localStorage fallback
- backend start and expiry timestamps as the source of truth
- automatic submission at zero
- warning below 10 minutes
- protection against timer reset after refresh

ROUTES TO PLAN

/
 /upsc
 /upsc/tests
 /upsc/tests/2026
 /upsc/tests/2026/gs-paper-1/instructions
 /upsc/tests/2026/gs-paper-1/attempt
 /results/:attemptId
 /review/:attemptId

DOCKER REQUIREMENTS

Plan for:

- frontend Dockerfile
- backend Dockerfile
- docker-compose.yml
- persistent SQLite volume
- frontend-to-backend API configuration
- development-friendly local setup

Suggested URLs:

Frontend:
http://localhost:5173

Backend:
http://localhost:8000

API docs:
http://localhost:8000/docs

QUALITY REQUIREMENTS

The plan must account for:

- strict TypeScript
- Python type hints
- use Optional[str], not str | None
- modular components
- backend validation
- error states
- loading states
- empty states
- keyboard-accessible options
- visible focus states
- mobile responsiveness
- no unnecessary dependencies
- no huge single-file components
- no GitHub push unless explicitly requested

TESTING PLAN

Include tests for:

- score calculation
- dropped-question handling
- unanswered questions
- negative marking
- answer persistence
- timer restoration
- automatic submission
- result counts
- API validation
- loading a test JSON file

FIRST IMPLEMENTATION SCOPE

The first implementation should use only 5 representative sample questions:

1. Standard MCQ
2. Multiple-statements question
3. Matching-pairs question
4. Table-based question
5. Dropped question

Do not plan to manually enter all 100 questions in the first execution phase.

The full system should first be validated using these 5 sample questions.

After that, the remaining questions can be inserted into:

backend/data/upsc/2026/gs-paper-1.json

YOUR RESPONSE MUST ONLY BE A PLAN

Return a detailed implementation plan containing:

1. Repository assessment
2. Proposed architecture
3. Proposed folder structure
4. Database models
5. API design
6. Frontend page structure
7. Component breakdown
8. State-management approach
9. Timer and persistence strategy
10. Test-data JSON design
11. Scoring implementation
12. Docker setup
13. Testing strategy
14. Step-by-step implementation phases
15. Risks and edge cases
16. Decisions that need my approval
17. Estimated effort for each phase
18. Clear definition of MVP completion

At the end, include a section titled:

“Approval Required Before Execution”

List the exact implementation decisions you need me to approve.

Do not execute anything until I explicitly reply with approval.
