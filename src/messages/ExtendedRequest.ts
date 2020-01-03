import { BerReader, BerWriter } from 'asn1';
import { Message, MessageOptions } from './Message';
import { ProtocolOperation } from '../ProtocolOperation';

export interface ExtendedRequestMessageOptions extends MessageOptions {
  oid?: string;
  value?: string | Buffer;
}

export class ExtendedRequest extends Message {
  public protocolOperation: ProtocolOperation;

  public oid: string;

  public value: string | Buffer;

  public constructor(options: ExtendedRequestMessageOptions) {
    super(options);
    this.protocolOperation = ProtocolOperation.LDAP_REQ_EXTENSION;

    this.oid = options.oid || '';
    this.value = options.value || '';
  }

  public writeMessage(writer: BerWriter): void {
    writer.writeString(this.oid, 0x80);
    if (Buffer.isBuffer(this.value)) {
      writer.writeBuffer(this.value, 0x81);
    } else {
      writer.writeString(this.value, 0x81);
    }
  }

  public parseMessage(reader: BerReader): void {
    this.oid = reader.readString(0x80);
    if (reader.peek() === 0x81) {
      try {
        this.value = reader.readString(0x81);
      } catch (ex) {
        this.value = reader.readString(0x81, true);
      }
    }
  }
}
