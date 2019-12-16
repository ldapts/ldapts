export abstract class ResultCodeError extends Error {
  public code: number;

  public constructor(code: number, message: string) {
    super();

    this.code = code;
    if (typeof code === 'undefined' || code === null) {
      this.message = message;
    } else {
      this.message = `${message} Code: 0x${code.toString(16)}`;
    }
  }
}
