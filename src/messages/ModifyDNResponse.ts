import type { ProtocolOperationValues } from '../ProtocolOperation.js';
import { ProtocolOperation } from '../ProtocolOperation.js';

import type { MessageResponseOptions } from './MessageResponse.js';
import { MessageResponse } from './MessageResponse.js';

export class ModifyDNResponse extends MessageResponse {
  public protocolOperation: ProtocolOperationValues;

  public constructor(options: MessageResponseOptions) {
    super(options);
    this.protocolOperation = ProtocolOperation.LDAP_RES_MODRDN;
  }
}
