export class InvalidAsn1Error extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'InvalidAsn1Error';
  }
}
