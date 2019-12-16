import { BerReader, BerWriter } from 'asn1';
import { Message, MessageOptions } from './Message';
import { ProtocolOperation } from '../ProtocolOperation';
import { Attribute } from '../Attribute';

export interface AddMessageOptions extends MessageOptions {
  dn: string;
  attributes?: Attribute[];
}

export class AddRequest extends Message {
  public protocolOperation: ProtocolOperation;

  public dn: string;

  public attributes: Attribute[];

  public constructor(options: AddMessageOptions) {
    super(options);
    this.protocolOperation = ProtocolOperation.LDAP_REQ_ADD;

    this.dn = options.dn;
    this.attributes = options.attributes || [];
  }

  public writeMessage(writer: BerWriter): void {
    writer.writeString(this.dn);
    writer.startSequence();
    for (const attribute of this.attributes) {
      attribute.write(writer);
    }

    writer.endSequence();
  }

  public parseMessage(reader: BerReader) {
    this.dn = reader.readString();

    reader.readSequence();
    const end = reader.offset + reader.length;
    while (reader.offset < end) {
      const attribute = new Attribute();
      attribute.parse(reader);
      this.attributes.push(attribute);
    }
  }
}
