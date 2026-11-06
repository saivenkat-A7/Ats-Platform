const prisma = require('../prisma/client');
const asyncHandler = require('../middleware/asyncHandler');

// GET /api/dashboard
exports.getDashboard = asyncHandler(async (req, res) => {
  const [totalJobs, totalCandidates, totalApplications, shortlisted, selected, byStage] =
    await Promise.all([
      prisma.job.count(),
      prisma.candidate.count(),
      prisma.application.count(),
      prisma.application.count({ where: { status: 'SHORTLISTED' } }),
      prisma.application.count({ where: { status: 'SELECTED' } }),
      prisma.application.groupBy({ by: ['status'], _count: { status: true } }),
    ]);

  // Turn the groupBy result into { APPLIED: 1, SCREENING: 2, ... }
  const applicationsByStage = {
    APPLIED: 0, SCREENING: 0, SHORTLISTED: 0, INTERVIEW: 0, SELECTED: 0, REJECTED: 0,
  };
  byStage.forEach((row) => { applicationsByStage[row.status] = row._count.status; });

  res.json({
    success: true,
    data: {
      totalJobs,
      totalCandidates,
      totalApplications,
      shortlistedCandidates: shortlisted,
      selectedCandidates: selected,
      applicationsByStage,
    },
  });
});
