import type { BerReader } from 'asn1';

import type { ProtocolOperationValues } from '../ProtocolOperation.js';
import { ProtocolOperation } from '../ProtocolOperation.js';

import type { MessageResponseOptions } from './MessageResponse.js';
import { MessageResponse } from './MessageResponse.js';

export interface SearchReferenceOptions extends MessageResponseOptions {
  uris?: string[];
}

export class SearchReference extends MessageResponse {
  public protocolOperation: ProtocolOperationValues;

  public uris: string[];

  public constructor(options: SearchReferenceOptions) {
    super(options);
    this.protocolOperation = ProtocolOperation.LDAP_RES_SEARCH_REF;
    this.uris = options.uris ?? [];
  }

  public override parseMessage(reader: BerReader): void {
    const end = reader.offset + reader.length;
    while (reader.offset < end) {
      const url = reader.readString() ?? '';
      this.uris.push(url);
    }
  }
}
