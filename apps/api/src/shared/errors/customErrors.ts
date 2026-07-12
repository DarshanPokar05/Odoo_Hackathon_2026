export class CustomError extends Error {
  public statusCode: number;
  public errorCode: string;
  public errors?: unknown[];

  constructor(message: string, statusCode: number, errorCode: string, errors?: unknown[]) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.errors = errors;
    Object.setPrototypeOf(this, CustomError.prototype);
  }
}

export class ValidationError extends CustomError {
  constructor(message: string = 'Validation failed', errors?: unknown[]) {
    super(message, 400, 'VALIDATION_ERROR', errors);
  }
}

export class AuthenticationError extends CustomError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends CustomError {
  constructor(message: string = 'Forbidden access') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends CustomError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND_ERROR');
  }
}

export class ConflictError extends CustomError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409, 'CONFLICT_ERROR');
  }
}

export class BusinessRuleError extends CustomError {
  constructor(message: string, errorCode: string = 'BUSINESS_RULE_ERROR') {
    super(message, 422, errorCode);
  }
}
