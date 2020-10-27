// AppError inherits from standard console.error
// It handles all error codes and routing for the app
// An error contains: message, statusCode, stack
import { EResponseStatusType } from "./types";

export class AppError extends Error {
  result: EResponseStatusType = EResponseStatusType.fail;
  statusCode?: number;
  isOperational?: boolean;
  constructor(message: string, statusCode: number, stack?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    // console.log("This is the AppError constructor");
    // console.log(`${statusCode}, ${message}`);
    Error.captureStackTrace(this, this.constructor);
  }
}
