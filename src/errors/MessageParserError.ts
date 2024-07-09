export interface MessageParserErrorDetails {
  messageId: number;
  protocolOperation?: number;
}

export class MessageParserError extends Error {
  public messageDetails?: MessageParserErrorDetails;

  public constructor(message: string) {
    super(message);

    this.name = 'MessageParserError';
    Object.setPrototypeOf(this, MessageParserError.prototype);
  }
}
