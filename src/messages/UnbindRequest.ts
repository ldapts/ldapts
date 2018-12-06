import { Message, MessageOptions } from './Message';
import { ProtocolOperation } from '../ProtocolOperation';

export class UnbindRequest extends Message {
  public protocolOperation: ProtocolOperation;

  constructor(options: MessageOptions) {
    super(options);
    this.protocolOperation = ProtocolOperation.LDAP_REQ_UNBIND;
  }
}
