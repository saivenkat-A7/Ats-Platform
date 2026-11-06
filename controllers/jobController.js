const prisma = require('../prisma/client');
const AppError = require('../middleware/AppError');
const asyncHandler = require('../middleware/asyncHandler');
const { cleanText, toInt, parseSkills, parseId, oneOf } = require('../middleware/validate');

const JOB_STATUS = ['OPEN', 'CLOSED'];

// Validates job input. For create all main fields are needed; for update only the ones sent.
function buildJobData(body, isCreate) {
  const data = {};

  if (isCreate || body.title !== undefined) data.title = cleanText(body.title, 'title');
  if (isCreate || body.companyName !== undefined) data.companyName = cleanText(body.companyName, 'companyName');
  if (isCreate || body.location !== undefined) data.location = cleanText(body.location, 'location');
  if (isCreate || body.requiredSkills !== undefined) {
    data.requiredSkills = parseSkills(body.requiredSkills, 'requiredSkills');
  }
  if (body.experience !== undefined) data.experience = toInt(body.experience, 'experience', 0);
  if (body.vacancies !== undefined) data.vacancies = toInt(body.vacancies, 'vacancies', 1);
  if (body.status !== undefined) data.status = oneOf(body.status, JOB_STATUS, 'status');

  if (!isCreate && Object.keys(data).length === 0) {
    throw new AppError(400, 'Send at least one field to update');
  }
  return data;
}

// POST /api/jobs
exports.createJob = asyncHandler(async (req, res) => {
  const data = buildJobData(req.body, true);
  const job = await prisma.job.create({ data: { ...data, createdById: req.user.id } });
  res.status(201).json({ success: true, message: 'Job created', data: job });
});

// GET /api/jobs   (optional filter: ?status=OPEN)
exports.getJobs = asyncHandler(async (req, res) => {
  const where = {};
  if (req.query.status) where.status = oneOf(req.query.status, JOB_STATUS, 'status');

  const jobs = await prisma.job.findMany({
    where,
    orderBy: { id: 'desc' },
    include: { _count: { select: { applications: true } } },
  });
  res.json({ success: true, count: jobs.length, data: jobs });
});

// GET /api/jobs/:id
exports.getJobById = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      applications: { include: { candidate: { select: { id: true, fullName: true, email: true } } } },
    },
  });
  if (!job) throw new AppError(404, 'Job not found');
  res.json({ success: true, data: job });
});

// PUT /api/jobs/:id
exports.updateJob = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  const data = buildJobData(req.body, false);
  const job = await prisma.job.update({ where: { id }, data }); // P2025 -> 404 if missing
  res.json({ success: true, message: 'Job updated', data: job });
});

// DELETE /api/jobs/:id   (also deletes that job's applications)
exports.deleteJob = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  await prisma.job.delete({ where: { id } });
  res.json({ success: true, message: 'Job deleted' });
});
