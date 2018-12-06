import { BerReader } from 'asn1';
import { Message, MessageOptions } from './Message';

export interface MessageResponseOptions extends MessageOptions {
  status?: number;
  matchedDN?: string;
  errorMessage?: string;
}

export abstract class MessageResponse extends Message {
  public status: number;
  public matchedDN: string;
  public errorMessage: string;

  protected constructor(options: MessageResponseOptions) {
    super(options);
    this.status = options.status || 0; // LDAP Success
    this.matchedDN = options.matchedDN || '';
    this.errorMessage = options.errorMessage || '';
  }

  public parseMessage(reader: BerReader): void {
    this.status = reader.readEnumeration();
    this.matchedDN = reader.readString();
    this.errorMessage = reader.readString();
  }
}
