import { MessageResponse, MessageResponseOptions } from './MessageResponse';
import { ProtocolOperation } from '../ProtocolOperation';
import { SearchEntry } from './SearchEntry';
import { SearchReference } from './SearchReference';

export interface SearchResponseOptions extends MessageResponseOptions {
  searchEntries?: SearchEntry[];
  searchReferences?: SearchReference[];
}

export class SearchResponse extends MessageResponse {
  public searchEntries: SearchEntry[];
  public searchReferences: SearchReference[];

  constructor(options: SearchResponseOptions) {
    super(options);
    this.protocolOperation = ProtocolOperation.LDAP_RES_SEARCH;
    this.searchEntries = options.searchEntries || [];
    this.searchReferences = options.searchReferences || [];
  }
}
