import type { BerReader, BerWriter } from 'asn1';

import { ProtocolOperation } from '../ProtocolOperation';

import type { MessageOptions } from './Message';
import { Message } from './Message';

export interface DeleteRequestMessageOptions extends MessageOptions {
  dn?: string;
}

export class DeleteRequest extends Message {
  public protocolOperation: ProtocolOperation;

  public dn: string;

  public constructor(options: DeleteRequestMessageOptions) {
    super(options);
    this.protocolOperation = ProtocolOperation.LDAP_REQ_DELETE;
    this.dn = options.dn || '';
  }

  public override writeMessage(writer: BerWriter): void {
    const buffer = Buffer.from(this.dn);
    for (const byte of buffer) {
      writer.writeByte(byte);
    }
  }

  public override parseMessage(reader: BerReader): void {
    const { length } = reader;
    this.dn = reader.buffer.slice(0, length).toString('utf8');
    reader._offset += reader.length;
  }
}
