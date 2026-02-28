export interface ErrorDetails {
  [key: string]: unknown;
}

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: ErrorDetails;
  public readonly timestamp: string;

  constructor(
    code: string,
    message: string,
    statusCode: number = 500,
    details?: ErrorDetails
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date().toISOString();

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  static notFound(resource: string, details?: ErrorDetails): AppError {
    return new AppError(
      'NOT_FOUND',
      `${resource} not found`,
      404,
      details
    );
  }

  static notImplemented(feature: string): AppError {
    return new AppError(
      'NOT_IMPLEMENTED',
      `${feature} is not yet implemented`,
      501,
      { feature }
    );
  }

  static badRequest(message: string, details?: ErrorDetails): AppError {
    return new AppError('BAD_REQUEST', message, 400, details);
  }

  static unauthorized(message: string = 'Unauthorized'): AppError {
    return new AppError('UNAUTHORIZED', message, 401);
  }

  static forbidden(message: string = 'Forbidden'): AppError {
    return new AppError('FORBIDDEN', message, 403);
  }

  static internal(message: string = 'Internal server error', details?: ErrorDetails): AppError {
    return new AppError('INTERNAL_ERROR', message, 500, details);
  }

  toJSON(): object {
    return {
      error: {
        code: this.code,
        message: this.message,
        statusCode: this.statusCode,
        details: this.details,
        timestamp: this.timestamp,
      },
    };
  }
}
