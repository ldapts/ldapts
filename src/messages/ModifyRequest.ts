import type { BerReader, BerWriter } from 'asn1';

import { Change } from '../Change';
import { ProtocolOperation } from '../ProtocolOperation';

import type { MessageOptions } from './Message';
import { Message } from './Message';

export interface ModifyRequestMessageOptions extends MessageOptions {
  dn?: string;
  changes?: Change[];
}

export class ModifyRequest extends Message {
  public protocolOperation: ProtocolOperation;

  public dn: string;

  public changes: Change[];

  public constructor(options: ModifyRequestMessageOptions) {
    super(options);
    this.protocolOperation = ProtocolOperation.LDAP_REQ_MODIFY;

    this.dn = options.dn || '';
    this.changes = options.changes || [];
  }

  public override writeMessage(writer: BerWriter): void {
    writer.writeString(this.dn);
    writer.startSequence();
    for (const change of this.changes) {
      change.write(writer);
    }

    writer.endSequence();
  }

  public override parseMessage(reader: BerReader): void {
    this.dn = reader.readString();

    reader.readSequence();
    const end = reader.offset + reader.length;
    while (reader.offset < end) {
      const change = new Change();
      change.parse(reader);
      this.changes.push(change);
    }
  }
}
