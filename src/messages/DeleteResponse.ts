// @ts-ignore
import { BerReader, BerWriter } from 'asn1';
import { MessageResponse, MessageResponseOptions } from './MessageResponse';
import { ProtocolOperation } from '../ProtocolOperation';

export class DeleteResponse extends MessageResponse {
  constructor(options: MessageResponseOptions) {
    super(options);
    this.protocolOperation = ProtocolOperation.LDAP_RES_DELETE;
  }
}
