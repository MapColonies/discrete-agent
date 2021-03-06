import { HttpError as baseError } from '@map-colonies/error-express-handler';

export class HttpError extends Error implements baseError {
  protected internalError?: Error;

  public constructor(message: string, status: number);
  public constructor(error: Error, status: number, messageOverride?: string);
  public constructor(error: string | Error, public status: number, messageOverride?: string) {
    super();
    if (error instanceof Error) {
      this.message = messageOverride ?? error.message;
      this.internalError = error;
    } else {
      this.message = error;
    }
  }
}
