import { ResultCodeError } from './ResultCodeError.js';

export class ObjectClassViolationError extends ResultCodeError {
  public constructor(message?: string) {
    super(65, message ?? 'The Add Request, Modify Request, or modify DN operation violates the object class rules for the entry.');

    this.name = 'ObjectClassViolationError';
    Object.setPrototypeOf(this, ObjectClassViolationError.prototype);
  }
}
