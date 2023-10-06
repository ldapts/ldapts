import type { BerReader, BerWriter } from 'asn1';
import asn1 from 'asn1';

import type { ProtocolOperationValues } from '../ProtocolOperation.js';
import { ProtocolOperation } from '../ProtocolOperation.js';

import type { MessageOptions } from './Message.js';
import { Message } from './Message.js';

const { Ber } = asn1;

export const SASL_MECHANISMS = ['EXTERNAL', 'PLAIN', 'DIGEST-MD5', 'SCRAM-SHA-1'] as const;
export type SaslMechanism = (typeof SASL_MECHANISMS)[number];

export interface BindRequestMessageOptions extends MessageOptions {
  dn?: string;
  password?: string;
  mechanism?: string;
}

export class BindRequest extends Message {
  public protocolOperation: ProtocolOperationValues;

  public dn: string;

  public password: string;

  public mechanism: string | undefined;

  public constructor(options: BindRequestMessageOptions) {
    super(options);
    this.protocolOperation = ProtocolOperation.LDAP_REQ_BIND;
    this.dn = options.dn ?? '';
    this.password = options.password ?? '';
    this.mechanism = options.mechanism;
  }

  public override writeMessage(writer: BerWriter): void {
    writer.writeInt(this.version);
    writer.writeString(this.dn);
    if (this.mechanism) {
      // SASL authentication
      writer.startSequence(ProtocolOperation.LDAP_REQ_BIND_SASL);
      writer.writeString(this.mechanism);
      writer.writeString(this.password);

      writer.endSequence();
    } else {
      // Simple authentication
      writer.writeString(this.password, Ber.Context); // 128
    }
  }

  public override parseMessage(reader: BerReader): void {
    this.version = reader.readInt() ?? ProtocolOperation.LDAP_VERSION_3;
    this.dn = reader.readString() ?? '';

    const contextCheck: number | null = reader.peek();
    if (contextCheck !== Ber.Context) {
      let type = '<null>';
      if (contextCheck) {
        type = `0x${contextCheck.toString(16)}`;
      }

      throw new Error(`Authentication type not supported: ${type}`);
    }

    this.password = reader.readString(Ber.Context) ?? '';
  }
}
