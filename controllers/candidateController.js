const prisma = require('../prisma/client');
const AppError = require('../middleware/AppError');
const asyncHandler = require('../middleware/asyncHandler');
const { cleanText, toInt, parseSkills, isEmail, parseId } = require('../middleware/validate');

function buildCandidateData(body, isCreate) {
  const data = {};

  if (isCreate || body.fullName !== undefined) data.fullName = cleanText(body.fullName, 'fullName');
  if (isCreate || body.email !== undefined) {
    const email = cleanText(body.email, 'email').toLowerCase();
    if (!isEmail(email)) throw new AppError(400, 'email is not valid');
    data.email = email;
  }
  if (isCreate || body.phone !== undefined) {
    const phone = cleanText(String(body.phone === undefined ? '' : body.phone), 'phone');
    if (!/^[0-9+\-\s]{7,15}$/.test(phone)) throw new AppError(400, 'phone must have 7-15 digits');
    data.phone = phone;
  }
  if (body.education !== undefined) data.education = cleanText(body.education, 'education');
  if (body.location !== undefined) data.location = cleanText(body.location, 'location');
  if (body.skills !== undefined) data.skills = parseSkills(body.skills, 'skills');
  if (body.experience !== undefined) data.experience = toInt(body.experience, 'experience', 0);

  if (!isCreate && Object.keys(data).length === 0) {
    throw new AppError(400, 'Send at least one field to update');
  }
  return data;
}

// POST /api/candidates
exports.createCandidate = asyncHandler(async (req, res) => {
  const data = buildCandidateData(req.body, true);
  const candidate = await prisma.candidate.create({ data });
  res.status(201).json({ success: true, message: 'Candidate added', data: candidate });
});

// GET /api/candidates
exports.getCandidates = asyncHandler(async (req, res) => {
  const candidates = await prisma.candidate.findMany({
    orderBy: { id: 'desc' },
    include: { _count: { select: { applications: true } } },
  });
  res.json({ success: true, count: candidates.length, data: candidates });
});

// GET /api/candidates/:id
exports.getCandidateById = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  const candidate = await prisma.candidate.findUnique({
    where: { id },
    include: {
      applications: { include: { job: { select: { id: true, title: true, companyName: true } } } },
    },
  });
  if (!candidate) throw new AppError(404, 'Candidate not found');
  res.json({ success: true, data: candidate });
});

// PUT /api/candidates/:id
exports.updateCandidate = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  const data = buildCandidateData(req.body, false);
  const candidate = await prisma.candidate.update({ where: { id }, data });
  res.json({ success: true, message: 'Candidate updated', data: candidate });
});

// DELETE /api/candidates/:id   (also deletes that candidate's applications)
exports.deleteCandidate = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  await prisma.candidate.delete({ where: { id } });
  res.json({ success: true, message: 'Candidate deleted' });
});
