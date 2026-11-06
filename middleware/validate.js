// Small helper functions for basic input validation
const AppError = require('./AppError');

// Required/optional text value -> trimmed string
function cleanText(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new AppError(400, `${field} is required and must be text`);
  }
  return value.trim();
}

// Whole number with a minimum, e.g. toInt("3", "experience", 0) -> 3
function toInt(value, field, min = 0) {
  const n = Number(value);
  if (value === '' || value === null || !Number.isInteger(n) || n < min) {
    throw new AppError(400, `${field} must be a whole number, ${min} or more`);
  }
  return n;
}

// Accepts ["Tally","Excel"] or "Tally, Excel" -> ["Tally","Excel"]
function parseSkills(value, field = 'skills') {
  let list;
  if (Array.isArray(value)) list = value;
  else if (typeof value === 'string') list = value.split(',');
  else throw new AppError(400, `${field} must be a list or comma separated text`);
  return list.map((s) => String(s).trim()).filter(Boolean);
}

function isEmail(value) {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

// Reads :id from the URL
function parseId(value, field = 'id') {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1) throw new AppError(400, `${field} must be a positive number`);
  return n;
}

// Checks a value is one of the allowed choices (case-insensitive) -> returns UPPERCASE value
function oneOf(value, allowed, field) {
  const v = String(value || '').trim().toUpperCase();
  if (!allowed.includes(v)) {
    throw new AppError(400, `${field} must be one of: ${allowed.join(', ')}`);
  }
  return v;
}

module.exports = { cleanText, toInt, parseSkills, isEmail, parseId, oneOf };
