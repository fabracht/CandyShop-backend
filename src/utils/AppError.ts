// AppError inherits from standard console.error
// It handles all error codes and routing for the app
// An error contains: message, statusCode, stack
export class AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
  constructor(message: string, statusCode: number, stack?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}
