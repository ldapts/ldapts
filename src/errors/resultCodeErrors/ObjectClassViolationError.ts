import { ResultCodeError } from './ResultCodeError';

export class ObjectClassViolationError extends ResultCodeError {
  constructor() {
    super(65, 'The Add Request, Modify Request, or modify DN operation violates the object class rules for the entry.');
  }
}
