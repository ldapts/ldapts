import { ResultCodeError } from './ResultCodeError';

export class NamingViolationError extends ResultCodeError {
  public constructor(message?: string) {
    super(64, message || 'The Add Request or Modify DN Request operation violates the schema\'s structure rules.');
  }
}
