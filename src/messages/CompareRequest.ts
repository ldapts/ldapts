// @ts-ignore
import { BerReader, BerWriter } from 'asn1';
import { Message, MessageOptions } from './Message';
import { ProtocolOperation } from '../ProtocolOperation';

export interface CompareRequestMessageOptions extends MessageOptions {
  dn?: string;
  attribute?: string;
  value?: string;
}

export class CompareRequest extends Message {
  public dn: string;
  public attribute: string;
  public value: string;

  constructor(options: CompareRequestMessageOptions) {
    super(options);
    this.protocolOperation = ProtocolOperation.LDAP_REQ_COMPARE;
    this.attribute = options.attribute || '';
    this.value = options.value || '';
    this.dn = options.dn || '';
  }

  public writeMessage(writer: BerWriter): void {
    writer.writeString(this.dn);
    writer.startSequence();
    writer.writeString(this.attribute);
    writer.writeString(this.value);
    writer.endSequence();
  }

  public parseMessage(reader: BerReader) {
    this.dn = reader.readString();
    reader.readSequence();

    this.attribute = (reader.readString() || '').toLowerCase();
    this.value = reader.readString();
  }
}
