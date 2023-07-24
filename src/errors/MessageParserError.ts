export interface MessageParserErrorDetails {
  messageId: number;
  protocolOperation?: number;
}

export class MessageParserError extends Error {
  public messageDetails?: MessageParserErrorDetails;
}
