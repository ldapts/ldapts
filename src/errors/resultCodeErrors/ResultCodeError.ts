export abstract class ResultCodeError extends Error {
  public code: number;

  protected constructor(code: number, message: string) {
    super(`${message} Code: 0x${code.toString(16)}`);

    this.name = 'ResultCodeError';
    this.code = code;

    Object.setPrototypeOf(this, ResultCodeError.prototype);
  }
}
