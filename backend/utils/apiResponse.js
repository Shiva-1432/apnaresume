const ERROR_CODE_BY_STATUS = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  422: 'VALIDATION_ERROR',
  500: 'INTERNAL_ERROR'
};

function sendError(res, status, message, code) {
  const errorCode = code || ERROR_CODE_BY_STATUS[status] || 'INTERNAL_ERROR';
  return res.status(status).json({
    error: {
      message,
      code: errorCode
    }
  });
}

function sendPaginated(res, payload) {
  const page = Number(payload.page || 1);
  const limit = Number(payload.limit || 10);
  const total = Number(payload.total || 0);
  const data = Array.isArray(payload.data) ? payload.data : [];

  return res.json({
    ...(payload.extra || {}),
    data,
    total,
    page,
    limit,
    hasMore: (page * limit) < total
  });
}

module.exports = {
  sendError,
  sendPaginated
};
