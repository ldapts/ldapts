// @ts-ignore
import { BerReader, BerWriter } from 'asn1';
import { MessageResponse, MessageResponseOptions } from './MessageResponse';
import { ProtocolOperation } from '../ProtocolOperation';

export interface ExtendedResponseOptions extends MessageResponseOptions {
  oid?: string;
  value?: string;
}

export enum ExtendedResponseProtocolOperations {
  oid = 0x8a,
  value = 0x8b,
}

export class ExtendedResponse extends MessageResponse {
  public oid?: string;
  public value?: string;

  constructor(options: ExtendedResponseOptions) {
    super(options);
    this.protocolOperation = ProtocolOperation.LDAP_RES_EXTENSION;
    this.oid = options.oid;
    this.value = options.value;
  }

  public parseMessage(reader: BerReader): void {
    super.parseMessage(reader);

    if (reader.peek() === ExtendedResponseProtocolOperations.oid) {
      this.oid = reader.readString(ExtendedResponseProtocolOperations.oid);
    }

    if (reader.peek() === ExtendedResponseProtocolOperations.value) {
      this.value = reader.readString(ExtendedResponseProtocolOperations.value);
    }

    this.status = reader.readEnumeration();
    this.matchedDN = reader.readString();
    this.errorMessage = reader.readString();
  }
}
