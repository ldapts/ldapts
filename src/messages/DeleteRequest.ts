import type { BerReader, BerWriter } from 'asn1';

import type { ProtocolOperationValues } from '../ProtocolOperation.js';
import { ProtocolOperation } from '../ProtocolOperation.js';

import type { MessageOptions } from './Message.js';
import { Message } from './Message.js';

export interface DeleteRequestMessageOptions extends MessageOptions {
  dn?: string;
}

export class DeleteRequest extends Message {
  public protocolOperation: ProtocolOperationValues;

  public dn: string;

  public constructor(options: DeleteRequestMessageOptions) {
    super(options);
    this.protocolOperation = ProtocolOperation.LDAP_REQ_DELETE;
    this.dn = options.dn ?? '';
  }

  public override writeMessage(writer: BerWriter): void {
    const buffer = Buffer.from(this.dn);
    for (const byte of buffer) {
      writer.writeByte(byte);
    }
  }

  public override parseMessage(reader: BerReader): void {
    const { length } = reader;
    this.dn = reader.buffer.subarray(0, length).toString('utf8');
    reader._offset += reader.length;
  }
}
