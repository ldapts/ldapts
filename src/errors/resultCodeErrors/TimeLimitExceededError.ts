import { ResultCodeError } from './ResultCodeError.js';

export class TimeLimitExceededError extends ResultCodeError {
  public constructor(message?: string) {
    super(
      3,
      message ??
        'Processing on the associated request Timeout limit specified by either the client request or the server administration limits has been exceeded and has been terminated because it took too long to complete.',
    );

    this.name = 'TimeLimitExceededError';
    Object.setPrototypeOf(this, TimeLimitExceededError.prototype);
  }
}
