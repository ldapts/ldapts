import { ResultCodeError } from './ResultCodeError';

export class NamingViolationError extends ResultCodeError {
  constructor() {
    super(64, 'The Add Request or Modify DN Request operation violates the schema\'s structure rules.');
  }
}
