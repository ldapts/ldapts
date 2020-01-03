import { Ber, BerReader, BerWriter } from 'asn1';
import { Message, MessageOptions } from './Message';
import { ProtocolOperation } from '../ProtocolOperation';

export interface BindRequestMessageOptions extends MessageOptions {
  dn?: string;
  password?: string;
}

export class BindRequest extends Message {
  public protocolOperation: ProtocolOperation;

  public dn: string;

  public password: string;

  public constructor(options: BindRequestMessageOptions) {
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

  public parseMessage(reader: BerReader): void {
    this.version = reader.readInt();
    this.dn = reader.readString();

    const contextCheck: number | null = reader.peek();
    if (contextCheck !== Ber.Context) {
      let type = '<null>';
      if (contextCheck) {
        type = `0x${contextCheck.toString(16)}`;
      }

      throw new Error(`Authentication type not supported: ${type}`);
    }

    this.password = reader.readString(Ber.Context);
  }
}
