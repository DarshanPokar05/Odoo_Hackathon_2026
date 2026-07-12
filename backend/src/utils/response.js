const sendSuccess = (res, data, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data,
  });
};

const sendPaginated = (res, data, total, page, limit, statusCode = 200) => {
  const pageNum = Number(page) || 1;
  const limitNum = Number(limit) || 20;
  return res.status(statusCode).json({
    success: true,
    data,
    total: Number(total),
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(Number(total) / limitNum) || 1,
  });
};

const sendError = (res, code, message, statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
    },
  });
};

module.exports = {
  sendSuccess,
  sendPaginated,
  sendError,
};
