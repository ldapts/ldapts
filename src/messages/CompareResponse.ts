import { MessageResponse, MessageResponseOptions } from './MessageResponse';
import { ProtocolOperation } from '../ProtocolOperation';

export enum CompareResult {
  /**
   * Indicates that the target entry exists and contains the specified attribute with the indicated value
   */
  compareTrue = 0x06,
  /**
   * Indicates that the target entry exists and contains the specified attribute, but that the attribute does not have the indicated value
   */
  compareFalse = 0x05,
  /**
   * Indicates that the target entry exists but does not contain the specified attribute
   */
  noSuchAttribute = 0x16,
  /**
   * Indicates that the target entry does not exist
   */
  noSuchObject = 0x32,
}

export class CompareResponse extends MessageResponse {
  public protocolOperation: ProtocolOperation;

  constructor(options: MessageResponseOptions) {
    super(options);
    this.protocolOperation = ProtocolOperation.LDAP_RES_COMPARE;
  }
}
