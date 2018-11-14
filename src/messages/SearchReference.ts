// @ts-ignore
import { BerReader } from 'asn1';
import { MessageResponse, MessageResponseOptions } from './MessageResponse';
import { ProtocolOperation } from '../ProtocolOperation';

export interface SearchReferenceOptions extends MessageResponseOptions {
  uris?: string[];
}

export class SearchReference extends MessageResponse {
  public uris: string[];

  constructor(options: SearchReferenceOptions) {
    super(options);
    this.protocolOperation = ProtocolOperation.LDAP_RES_SEARCH_REF;
    this.uris = options.uris || [];
  }

  public parseMessage(reader: BerReader): void {
    const end = reader.offset + reader.length;
    while (reader.offset < end) {
      const url = reader.readString();
      this.uris.push(url);
    }
  }
}
