// Adds sample data. Safe to run many times (it skips data that already exists).
const bcrypt = require('bcrypt');
const prisma = require('./client');
const jobs = require('../sample-data/jobs.json');
const candidates = require('../sample-data/candidates.json');

async function main() {
  // 1. Demo recruiter  ->  recruiter@example.com / password123
  const password = await bcrypt.hash('password123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'recruiter@example.com' },
    update: {},
    create: { name: 'Demo Recruiter', email: 'recruiter@example.com', password },
  });

  // 2. Jobs
  for (const job of jobs) {
    const exists = await prisma.job.findFirst({
      where: { title: job.title, companyName: job.companyName },
    });
    if (!exists) await prisma.job.create({ data: { ...job, createdById: user.id } });
  }

  // 3. Candidates
  for (const c of candidates) {
    await prisma.candidate.upsert({ where: { email: c.email }, update: {}, create: c });
  }

  // 4. A few applications at different stages
  const allJobs = await prisma.job.findMany({ orderBy: { id: 'asc' } });
  const allCandidates = await prisma.candidate.findMany({ orderBy: { id: 'asc' } });
  const pairs = [
    // [jobIndex, candidateIndex, status]
    [0, 2, 'SHORTLISTED'],
    [0, 5, 'SCREENING'],
    [1, 1, 'SELECTED'],
    [2, 0, 'INTERVIEW'],
    [2, 4, 'APPLIED'],
  ];
  for (const [j, c, status] of pairs) {
    if (!allJobs[j] || !allCandidates[c]) continue;
    await prisma.application.upsert({
      where: { jobId_candidateId: { jobId: allJobs[j].id, candidateId: allCandidates[c].id } },
      update: {},
      create: { jobId: allJobs[j].id, candidateId: allCandidates[c].id, status },
    });
  }

  console.log('Sample data ready. Login: recruiter@example.com / password123');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
