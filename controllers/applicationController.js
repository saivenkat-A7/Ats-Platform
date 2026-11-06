const prisma = require('../prisma/client');
const AppError = require('../middleware/AppError');
const asyncHandler = require('../middleware/asyncHandler');
const { parseId, oneOf } = require('../middleware/validate');

// Hiring stages in order
const STAGES = ['APPLIED', 'SCREENING', 'SHORTLISTED', 'INTERVIEW', 'SELECTED', 'REJECTED'];

const withDetails = {
  job: { select: { id: true, title: true, companyName: true, status: true } },
  candidate: { select: { id: true, fullName: true, email: true, phone: true } },
};

// POST /api/applications   body: { jobId, candidateId }
exports.applyToJob = asyncHandler(async (req, res) => {
  const jobId = parseId(req.body.jobId, 'jobId');
  const candidateId = parseId(req.body.candidateId, 'candidateId');

  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) throw new AppError(404, 'Job not found');
  if (job.status === 'CLOSED') throw new AppError(400, 'This job is closed. No new applications allowed');

  const candidate = await prisma.candidate.findUnique({ where: { id: candidateId } });
  if (!candidate) throw new AppError(404, 'Candidate not found');

  // Duplicate (same job + same candidate) is caught by the database -> 409 in errorHandler
  const application = await prisma.application.create({
    data: { jobId, candidateId, status: 'APPLIED' },
    include: withDetails,
  });
  res.status(201).json({ success: true, message: 'Candidate applied to job', data: application });
});

// GET /api/applications   (optional filters: ?jobId=1&candidateId=2&status=SHORTLISTED)
exports.getApplications = asyncHandler(async (req, res) => {
  const where = {};
  if (req.query.jobId) where.jobId = parseId(req.query.jobId, 'jobId');
  if (req.query.candidateId) where.candidateId = parseId(req.query.candidateId, 'candidateId');
  if (req.query.status) where.status = oneOf(req.query.status, STAGES, 'status');

  const applications = await prisma.application.findMany({
    where,
    orderBy: { id: 'desc' },
    include: withDetails,
  });
  res.json({ success: true, count: applications.length, data: applications });
});

// PUT /api/applications/:id/status   body: { status: "SHORTLISTED" }
exports.updateStatus = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  const status = oneOf(req.body.status, STAGES, 'status');

  const application = await prisma.application.update({
    where: { id },
    data: { status },
    include: withDetails,
  });
  res.json({ success: true, message: `Application moved to ${status}`, data: application });
});
