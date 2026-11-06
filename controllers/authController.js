const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma/client');
const AppError = require('../middleware/AppError');
const asyncHandler = require('../middleware/asyncHandler');
const { cleanText, isEmail } = require('../middleware/validate');

// POST /api/auth/register
exports.register = asyncHandler(async (req, res) => {
  const name = cleanText(req.body.name, 'name');
  const email = cleanText(req.body.email, 'email').toLowerCase();
  const password = req.body.password;

  if (!isEmail(email)) throw new AppError(400, 'email is not valid');
  if (typeof password !== 'string' || password.length < 6) {
    throw new AppError(400, 'password must be at least 6 characters');
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new AppError(409, 'This email is already registered');

  const hashed = await bcrypt.hash(password, 10); // never store the plain password
  const user = await prisma.user.create({ data: { name, email, password: hashed } });

  res.status(201).json({
    success: true,
    message: 'Recruiter registered successfully',
    data: { id: user.id, name: user.name, email: user.email },
  });
});

// POST /api/auth/login
exports.login = asyncHandler(async (req, res) => {
  const email = cleanText(req.body.email, 'email').toLowerCase();
  const password = cleanText(req.body.password, 'password');

  const user = await prisma.user.findUnique({ where: { email } });
  // Same message for both cases so attackers can't guess which emails exist
  const ok = user && (await bcrypt.compare(password, user.password));
  if (!ok) throw new AppError(401, 'Invalid email or password');

  const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: '1d',
  });

  res.json({
    success: true,
    message: 'Login successful',
    token,
    user: { id: user.id, name: user.name, email: user.email },
  });
});
