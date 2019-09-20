import { ResultCodeError } from './ResultCodeError';

export class StrongAuthRequiredError extends ResultCodeError {
  constructor(message?: string) {
    super(8, message || 'Client requested an operation that requires strong authentication.');
  }
}
