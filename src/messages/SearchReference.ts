import type { BerReader } from 'asn1';

import { ProtocolOperation } from '../ProtocolOperation';

import type { MessageResponseOptions } from './MessageResponse';
import { MessageResponse } from './MessageResponse';

export interface SearchReferenceOptions extends MessageResponseOptions {
  uris?: string[];
}

export class SearchReference extends MessageResponse {
  public protocolOperation: ProtocolOperation;

  public uris: string[];

  public constructor(options: SearchReferenceOptions) {
    super(options);
    this.protocolOperation = ProtocolOperation.LDAP_RES_SEARCH_REF;
    this.uris = options.uris || [];
  }

  public override parseMessage(reader: BerReader): void {
    const end = reader.offset + reader.length;
    while (reader.offset < end) {
      const url = reader.readString();
      this.uris.push(url);
    }
  }
}
