import { ResultCodeError } from './ResultCodeError';

export class TimeLimitExceededError extends ResultCodeError {
  constructor() {
    super(3, 'Processing on the associated request Timeout limit specified by either the client request or the server administration limits has been exceeded and has been terminated because it took too long to complete.');
  }
}
