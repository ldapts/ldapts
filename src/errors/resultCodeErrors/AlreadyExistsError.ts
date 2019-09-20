import { ResultCodeError } from './ResultCodeError';

export class AlreadyExistsError extends ResultCodeError {
  constructor(message?: string) {
    super(68, message || 'The add operation attempted to add an entry that already exists, or that the modify operation attempted to rename an entry to the name of an entry that already exists.');
  }
}
