# Applicant Tracking System (ATS) - Backend

A beginner-friendly backend that shows how a **Non-IT recruitment agency** works:
recruiters post jobs, add candidates, apply candidates to jobs, and move them through hiring stages.

**Stack:** Node.js, Express, PostgreSQL, Prisma ORM, JWT, bcrypt, Docker

---

## 1. Run it (Docker - easiest)

You only need Docker Desktop installed.

```bash
docker compose up --build
```

What happens automatically:
1. A PostgreSQL container starts.
2. The app container creates the tables (`prisma db push`).
3. Sample jobs, candidates and applications are added.
4. The API starts at **http://localhost:3000**

Demo login (created by the sample data):
- Email: `recruiter@example.com`
- Password: `password123`

Stop with `Ctrl+C`. Remove everything including data: `docker compose down -v`

### Run without Docker (optional)
```bash
cp .env.example .env        # edit DATABASE_URL to match your local Postgres
npm install
npx prisma db push          # creates the tables
npm run db:seed             # adds sample data
npm run dev                 # starts the server
```

---

## 2. Test with Postman

1. Open Postman -> **Import** -> choose `postman/ATS.postman_collection.json`.
2. Run **1. Auth -> Login**. The token is saved automatically in a collection variable.
3. Run any other request. They all send `Authorization: Bearer <token>` for you.

Suggested demo order: Login -> Get all jobs -> Add candidate -> Apply candidate to job ->
Update application status -> Dashboard.

Sample data is also in `sample-data/jobs.json` and `sample-data/candidates.json`.

---

## 3. Project structure

```
server.js          starts the app and connects the routes
routes/            maps URLs to controller functions
controllers/       the actual logic for each API
middleware/        auth (JWT check), validation helpers, error handling
prisma/            schema.prisma (tables), client.js, seed.js (sample data)
sample-data/       JSON used by the seed and handy for Postman
postman/           ready-made Postman collection
```

---

## 4. Database (4 tables) and relationships in simple words

| Table | What it stores |
|---|---|
| **User** | Recruiters who can log in. Password is saved as a bcrypt hash. |
| **Job** | A job opening (title, company, location, skills, experience, vacancies, status OPEN/CLOSED). |
| **Candidate** | A job seeker (name, unique email, phone, education, skills, experience, location). |
| **Application** | Connects one Candidate to one Job and stores the hiring stage. |

Relationships:
- **User -> Job (one-to-many):** one recruiter creates many jobs (`Job.createdById` is a foreign key to User).
- **Job -> Application (one-to-many):** one job can receive many applications.
- **Candidate -> Application (one-to-many):** one candidate can apply to many jobs.
- So **Job and Candidate are many-to-many**, and **Application is the bridge table** between them.
- A candidate cannot apply to the same job twice (unique pair `jobId + candidateId`).
- Deleting a job or candidate also deletes its applications (`onDelete: Cascade`).

Application stages: `APPLIED -> SCREENING -> SHORTLISTED -> INTERVIEW -> SELECTED` (or `REJECTED`).

---

## 5. API guide

All responses are JSON. Errors look like `{ "success": false, "message": "..." }`.
Every endpoint except register/login needs the header `Authorization: Bearer <token>`.
All recruiters can see all jobs and candidates (kept simple on purpose).

### Authentication
| Endpoint | What it does | Body |
|---|---|---|
| `POST /api/auth/register` | Creates a recruiter account. Password is hashed with bcrypt. | `name`, `email`, `password` (min 6 chars) |
| `POST /api/auth/login` | Checks email + password and returns a JWT token valid for 1 day. | `email`, `password` |

### Jobs
| Endpoint | What it does |
|---|---|
| `POST /api/jobs` | Adds a job. Needs `title`, `companyName`, `location`, `requiredSkills` (list or comma text). Optional: `experience` (years, default 0), `vacancies` (default 1), `status` (OPEN/CLOSED, default OPEN). |
| `GET /api/jobs` | Lists all jobs with an application count. Optional filter `?status=OPEN`. |
| `GET /api/jobs/:id` | One job with the recruiter who created it and its applicants. |
| `PUT /api/jobs/:id` | Updates any of the job fields (send only what changes). |
| `DELETE /api/jobs/:id` | Deletes the job and its applications. |

### Candidates
| Endpoint | What it does |
|---|---|
| `POST /api/candidates` | Adds a candidate. Needs `fullName`, `email`, `phone`. Optional: `education`, `skills`, `experience`, `location`. Email must be unique. |
| `GET /api/candidates` | Lists all candidates. |
| `GET /api/candidates/:id` | One candidate with the jobs they applied to. |
| `PUT /api/candidates/:id` | Updates any candidate fields. |
| `DELETE /api/candidates/:id` | Deletes the candidate and their applications. |

### Applications
| Endpoint | What it does |
|---|---|
| `POST /api/applications` | Applies a candidate to a job. Body: `jobId`, `candidateId`. Starts at `APPLIED`. Fails if the job is CLOSED, or already applied. |
| `GET /api/applications` | Lists applications with job and candidate details. Filters: `?jobId=`, `?candidateId=`, `?status=`. |
| `PUT /api/applications/:id/status` | Moves an application to a new stage. Body: `{ "status": "SHORTLISTED" }`. |

### Dashboard
| Endpoint | What it does |
|---|---|
| `GET /api/dashboard` | Returns total jobs, total candidates, total applications, shortlisted count, selected count, and a count per stage. |

### Status codes used
`200` OK, `201` created, `400` invalid input, `401` not logged in / bad token,
`404` not found, `409` duplicate (email or application), `500` server error.

---

## 6. How login protection works (JWT)

1. You log in -> the server returns a token.
2. You send that token on every request in the `Authorization` header.
3. `middleware/auth.js` checks the token. If it is missing or wrong, you get `401`.
