// Wraps an async controller so any error goes to the error handler automatically
module.exports = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
