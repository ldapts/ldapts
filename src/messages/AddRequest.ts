import type { BerReader, BerWriter } from 'asn1';

import { Attribute } from '../Attribute.js';
import type { ProtocolOperationValues } from '../ProtocolOperation.js';
import { ProtocolOperation } from '../ProtocolOperation.js';

import type { MessageOptions } from './Message.js';
import { Message } from './Message.js';

export interface AddMessageOptions extends MessageOptions {
  dn: string;
  attributes?: Attribute[];
}

export class AddRequest extends Message {
  public protocolOperation: ProtocolOperationValues;

  public dn: string;

  public attributes: Attribute[];

  public constructor(options: AddMessageOptions) {
    super(options);
    this.protocolOperation = ProtocolOperation.LDAP_REQ_ADD;

    this.dn = options.dn;
    this.attributes = options.attributes ?? [];
  }

  public override writeMessage(writer: BerWriter): void {
    writer.writeString(this.dn);
    writer.startSequence();
    for (const attribute of this.attributes) {
      attribute.write(writer);
    }

    writer.endSequence();
  }

  public override parseMessage(reader: BerReader): void {
    this.dn = reader.readString() ?? '';

    reader.readSequence();
    const end = reader.offset + reader.length;
    while (reader.offset < end) {
      const attribute = new Attribute();
      attribute.parse(reader);
      this.attributes.push(attribute);
    }
  }
}
