export const sendSuccess = (res, statusCode = 200, message = 'Success', data = null, pagination = null) => {
  const response = {
    success: true,
    message
  };

  if (data !== null) {
    response.data = data;
  }

  if (pagination !== null) {
    response.pagination = pagination;
  }

  return res.status(statusCode).json(response);
};

export const sendError = (res, statusCode = 500, message = 'Internal Server Error', error = null, details = null) => {
  const errCode = error || (statusCode === 400 ? 'VALIDATION_ERROR' : statusCode === 404 ? 'NOT_FOUND' : 'SERVER_ERROR');
  const response = {
    success: false,
    message,
    error: errCode,
    code: errCode
  };

  if (details) {
    response.details = details;
  }

  return res.status(statusCode).json(response);
};
