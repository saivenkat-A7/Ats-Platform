// Central place where every error ends up
module.exports = (err, req, res, next) => {
  // Errors we threw on purpose (validation, not found, etc.)
  if (err.statusCode) {
    return res.status(err.statusCode).json({ success: false, message: err.message });
  }

  // Bad JSON sent by the client
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'Invalid JSON in request body' });
  }

  // Prisma (database) errors
  if (err.code === 'P2002') {
    const fields = err.meta && err.meta.target ? [].concat(err.meta.target).join(', ') : 'value';
    return res.status(409).json({ success: false, message: `Already exists: duplicate ${fields}` });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ success: false, message: 'Record not found' });
  }
  if (err.code === 'P2003') {
    return res.status(400).json({ success: false, message: 'Related record does not exist' });
  }

  console.error(err);
  res.status(500).json({ success: false, message: 'Something went wrong on the server' });
};
