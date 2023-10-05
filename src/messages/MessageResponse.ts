import type { BerReader } from 'asn1';

import type { MessageOptions } from './Message.js';
import { Message } from './Message.js';

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
    this.status = options.status ?? 0; // LDAP Success
    this.matchedDN = options.matchedDN ?? '';
    this.errorMessage = options.errorMessage ?? '';
  }

  public override parseMessage(reader: BerReader): void {
    this.status = reader.readEnumeration() ?? 0;
    this.matchedDN = reader.readString() ?? '';
    this.errorMessage = reader.readString() ?? '';
  }
}
