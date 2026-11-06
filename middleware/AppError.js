// A simple error with an HTTP status code, e.g. throw new AppError(400, 'Title is required')
class AppError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}
module.exports = AppError;
