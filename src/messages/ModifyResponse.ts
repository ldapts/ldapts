import type { ProtocolOperationValues } from '../ProtocolOperation';
import { ProtocolOperation } from '../ProtocolOperation';

import type { MessageResponseOptions } from './MessageResponse';
import { MessageResponse } from './MessageResponse';

export class ModifyResponse extends MessageResponse {
  public protocolOperation: ProtocolOperationValues;

  public constructor(options: MessageResponseOptions) {
    super(options);
    this.protocolOperation = ProtocolOperation.LDAP_RES_MODIFY;
  }
}
