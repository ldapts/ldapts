import type { BerReader, BerWriter } from 'asn1';

import type { ProtocolOperationValues } from '../ProtocolOperation.js';
import { ProtocolOperation } from '../ProtocolOperation.js';

import type { MessageOptions } from './Message.js';
import { Message } from './Message.js';

export interface CompareRequestMessageOptions extends MessageOptions {
  dn?: string;
  attribute?: string;
  value?: string;
}

export class CompareRequest extends Message {
  public protocolOperation: ProtocolOperationValues;

  public dn: string;

  public attribute: string;

  public value: string;

  public constructor(options: CompareRequestMessageOptions) {
    super(options);
    this.protocolOperation = ProtocolOperation.LDAP_REQ_COMPARE;
    this.attribute = options.attribute ?? '';
    this.value = options.value ?? '';
    this.dn = options.dn ?? '';
  }

  public override writeMessage(writer: BerWriter): void {
    writer.writeString(this.dn);
    writer.startSequence();
    writer.writeString(this.attribute);
    writer.writeString(this.value);
    writer.endSequence();
  }

  public override parseMessage(reader: BerReader): void {
    this.dn = reader.readString() ?? '';
    reader.readSequence();

    this.attribute = (reader.readString() ?? '').toLowerCase();
    this.value = reader.readString() ?? '';
  }
}
