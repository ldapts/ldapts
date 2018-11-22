import { ResultCodeError } from './ResultCodeError';

export class StrongAuthRequiredError extends ResultCodeError {
  constructor() {
    super(8, 'Client requested an operation that requires strong authentication.');
  }
}
