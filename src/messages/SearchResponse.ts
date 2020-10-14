import { ProtocolOperation } from '../ProtocolOperation';

import type { MessageResponseOptions } from './MessageResponse';
import { MessageResponse } from './MessageResponse';
import type { SearchEntry } from './SearchEntry';
import type { SearchReference } from './SearchReference';

export interface SearchResponseOptions extends MessageResponseOptions {
  searchEntries?: SearchEntry[];
  searchReferences?: SearchReference[];
}

export class SearchResponse extends MessageResponse {
  public protocolOperation: ProtocolOperation;

  public searchEntries: SearchEntry[];

  public searchReferences: SearchReference[];

  public constructor(options: SearchResponseOptions) {
    super(options);
    this.protocolOperation = ProtocolOperation.LDAP_RES_SEARCH;
    this.searchEntries = options.searchEntries || [];
    this.searchReferences = options.searchReferences || [];
  }
}
