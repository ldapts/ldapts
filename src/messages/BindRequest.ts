import type { BerReader, BerWriter } from 'asn1';
import { Ber } from 'asn1';

import { ProtocolOperation } from '../ProtocolOperation';

import type { MessageOptions } from './Message';
import { Message } from './Message';

export const SASL_MECHANISMS = ['EXTERNAL', 'PLAIN', 'DIGEST-MD5', 'SCRAM-SHA-1'] as const;
export type SaslMechanism = (typeof SASL_MECHANISMS)[number];

export interface BindRequestMessageOptions extends MessageOptions {
  dn?: string;
  password?: string;
  mechanism?: string;
}

export class BindRequest extends Message {
  public protocolOperation: ProtocolOperation;

  public dn: string;

  public password?: string;

  public mechanism: string | undefined;

  public constructor(options: BindRequestMessageOptions) {
    super(options);
    this.protocolOperation = ProtocolOperation.LDAP_REQ_BIND;
    this.dn = options.dn || '';
    this.password = options.password;
    this.mechanism = options.mechanism;
  }

  public override writeMessage(writer: BerWriter): void {
    writer.writeInt(this.version);
    writer.writeString(this.dn);
    if (this.mechanism) {
      // SASL authentication
      writer.startSequence(ProtocolOperation.LDAP_REQ_BIND_SASL);
      writer.writeString(this.mechanism);
      if (typeof this.password === 'string') {
        writer.writeString(this.password);
      }

      writer.endSequence();
    } else if (typeof this.password === 'string') {
      // Simple authentication
      writer.writeString(this.password, Ber.Context); // 128
    }
  }

  public override parseMessage(reader: BerReader): void {
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
