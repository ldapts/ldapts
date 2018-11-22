export abstract class ResultCodeError extends Error {
  public code: number;

  constructor(code: number, message: string) {
    super();

    this.code = code;
    this.message = `${message} Code: 0x${code.toString(16)}`;
  }
}
