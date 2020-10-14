import { ProtocolOperation } from '../ProtocolOperation';

import type { MessageOptions } from './Message';
import { Message } from './Message';

export class UnbindRequest extends Message {
  public protocolOperation: ProtocolOperation;

  public constructor(options: MessageOptions) {
    super(options);
    this.protocolOperation = ProtocolOperation.LDAP_REQ_UNBIND;
  }
}
