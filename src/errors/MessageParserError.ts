import { ProtocolOperation } from '../ProtocolOperation';

export interface MessageParserErrorDetails {
  messageId: number;
  protocolOperation: ProtocolOperation;
}

export class MessageParserError extends Error {
  public messageDetails?: MessageParserErrorDetails;
}
