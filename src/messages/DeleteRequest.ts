import { BerReader, BerWriter } from 'asn1';
import { Message, MessageOptions } from './Message';
import { ProtocolOperation } from '../ProtocolOperation';

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

  public writeMessage(writer: BerWriter): void {
    const buffer = Buffer.from(this.dn);
    for (const byte of buffer) {
      writer.writeByte(byte);
    }
  }

  public parseMessage(reader: BerReader): void {
    const { length } = reader;
    this.dn = reader.buffer.slice(0, length).toString('utf8');
    reader._offset += reader.length;
  }
}
