const { AppError } = require('../utils/errors');
const { ZodError } = require('zod');

function errorHandler(err, req, res, next) {
  // Check if error is a Zod validation error
  if (err instanceof ZodError) {
    const issues = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: `Validation failed: ${issues}`,
      },
    });
  }

  // Check if error is an operational AppError
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
      },
    });
  }

  // Log unexpected internal server errors
  console.error('Unhandled Server Error:', err);

  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An unexpected error occurred on the server.',
    },
  });
}

module.exports = errorHandler;
