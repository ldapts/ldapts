import { ProtocolOperation } from '../ProtocolOperation';

import type { MessageResponseOptions } from './MessageResponse';
import { MessageResponse } from './MessageResponse';

export class AddResponse extends MessageResponse {
  public protocolOperation: ProtocolOperation;

  public constructor(options: MessageResponseOptions) {
    super(options);
    this.protocolOperation = ProtocolOperation.LDAP_RES_ADD;
  }
}
