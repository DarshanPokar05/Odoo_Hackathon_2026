const { ForbiddenError, UnauthorizedError } = require('../utils/errors');

/**
 * Middleware factory to enforce required role(s)
 * @param  {...string} allowedRoles - e.g. 'admin', 'manager', 'employee'
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError('User unauthenticated', 'UNAUTHENTICATED'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `Access forbidden. Requires one of roles: [${allowedRoles.join(', ')}]`,
          'FORBIDDEN_ROLE'
        )
      );
    }

    next();
  };
}

module.exports = requireRole;
