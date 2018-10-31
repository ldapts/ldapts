// @ts-ignore
import { Ber, BerReader, BerWriter } from 'asn1';
import { Message, MessageOptions } from './Message';
import { ProtocolOperation } from '../ProtocolOperation';

export interface BindRequestMessageOptions extends MessageOptions {
  dn?: string;
  password?: string;
}

export class BindRequest extends Message {
  public dn: string;
  public password: string;

  constructor(options: BindRequestMessageOptions) {
    super(options);
    this.protocolOperation = ProtocolOperation.LDAP_REQ_BIND;
    this.dn = options.dn || '';
    this.password = options.password || '';
  }

  public writeMessage(writer: BerWriter): void {
    writer.writeInt(this.version);
    writer.writeString(this.dn);
    writer.writeString(this.password, Ber.Context);
  }

  public parseMessage(reader: BerReader) {
    this.version = reader.readInt();
    this.dn = reader.readString();

    const contextCheck: number = reader.peek();
    if (contextCheck !== Ber.Context) {
      throw new Error(`Authentication type not supported: 0x${contextCheck.toString(16)}`);
    }

    this.password = reader.readString(Ber.Context);
  }
}
