import type { ProtocolOperationValues } from '../ProtocolOperation.js';
import { ProtocolOperation } from '../ProtocolOperation.js';

import type { MessageResponseOptions } from './MessageResponse.js';
import { MessageResponse } from './MessageResponse.js';
import type { SearchEntry } from './SearchEntry.js';
import type { SearchReference } from './SearchReference.js';

export interface SearchResponseOptions extends MessageResponseOptions {
  searchEntries?: SearchEntry[];
  searchReferences?: SearchReference[];
}

export class SearchResponse extends MessageResponse {
  public protocolOperation: ProtocolOperationValues;

  public searchEntries: SearchEntry[];

  public searchReferences: SearchReference[];

  public constructor(options: SearchResponseOptions) {
    super(options);
    this.protocolOperation = ProtocolOperation.LDAP_RES_SEARCH;
    this.searchEntries = options.searchEntries ?? [];
    this.searchReferences = options.searchReferences ?? [];
  }
}
