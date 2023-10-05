import type { ProtocolOperationValues } from '../ProtocolOperation.js';
import { ProtocolOperation } from '../ProtocolOperation.js';

import type { MessageResponseOptions } from './MessageResponse.js';
import { MessageResponse } from './MessageResponse.js';

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
  public protocolOperation: ProtocolOperationValues;

  public constructor(options: MessageResponseOptions) {
    super(options);
    this.protocolOperation = ProtocolOperation.LDAP_RES_COMPARE;
  }
}
