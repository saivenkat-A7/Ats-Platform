const jwt = require('jsonwebtoken');
const AppError = require('./AppError');

// Protects routes. Client must send:  Authorization: Bearer <token>
module.exports = (req, res, next) => {
  const [type, token] = (req.headers.authorization || '').split(' ');
  if (type !== 'Bearer' || !token) {
    throw new AppError(401, 'Please login first. Send header: Authorization: Bearer <token>');
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.id, email: payload.email };
    next();
  } catch (err) {
    throw new AppError(401, 'Invalid or expired token. Please login again');
  }
};
