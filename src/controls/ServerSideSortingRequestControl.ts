import { type BerReader } from '../ber/index.js';
import { Ber, BerWriter } from '../ber/index.js';

import { type ControlOptions } from './Control.js';
import { Control } from './Control.js';

export interface ServerSideSortingRequestValue {
  attributeType: string;
  orderingRule?: string;
  reverseOrder?: boolean;
}

export interface ServerSideSortingResult {
  /**
   * LDAP result code for the sort. `0` means the entries came back in the requested order.
   */
  sortResult: number;
  /**
   * Attribute the server could not sort by, when it names one.
   */
  attributeType?: string;
}

export interface ServerSideSortingRequestControlOptions extends ControlOptions {
  value?: ServerSideSortingRequestValue | ServerSideSortingRequestValue[];
}

export class ServerSideSortingRequestControl extends Control {
  public static type = '1.2.840.113556.1.4.473';

  public static responseType = '1.2.840.113556.1.4.474';

  public values: ServerSideSortingRequestValue[];

  /**
   * Sort result reported by the server (RFC 2891 SortResult). Set on the instance sent with the search once the search
   * settles, cleared whenever the control is written again, and left undefined when the server sends no sort response.
   */
  public result?: ServerSideSortingResult;

  public constructor(options: ServerSideSortingRequestControlOptions = {}) {
    super(ServerSideSortingRequestControl.type, { ...options, responseType: ServerSideSortingRequestControl.responseType });

    if (Array.isArray(options.value)) {
      this.values = options.value;
    } else if (typeof options.value === 'object') {
      this.values = [options.value];
    } else {
      this.values = [];
    }
  }

  public override parseControl(reader: BerReader): void {
    if (!reader.readSequence(0x30)) {
      return;
    }

    // The server's SortResult starts with an ENUMERATED; the request shape holds one SEQUENCE per sort key
    if (reader.peek() === Ber.Enumeration) {
      const sortResult = reader.readEnumeration() ?? 0;
      this.result = reader.peek() === 0x80 ? { sortResult, attributeType: reader.readString(0x80) ?? '' } : { sortResult };
      return;
    }

    while (reader.readSequence(0x30)) {
      const attributeType = reader.readString() ?? '';
      let orderingRule = '';
      let reverseOrder = false;
      if (reader.peek() === 0x80) {
        orderingRule = reader.readString(0x80) ?? '';
      }

      if (reader.peek() === 0x81) {
        reverseOrder = reader.readTag(0x81) !== 0;
      }

      this.values.push({
        attributeType,
        orderingRule,
        reverseOrder,
      });
    }
  }

  public override writeControl(writer: BerWriter): void {
    this.result = undefined;

    if (!this.values.length) {
      return;
    }

    const controlWriter = new BerWriter();
    controlWriter.startSequence(0x30);
    for (const value of this.values) {
      controlWriter.startSequence(0x30);
      controlWriter.writeString(value.attributeType, Ber.OctetString);

      if (value.orderingRule) {
        controlWriter.writeString(value.orderingRule, 0x80);
      }

      if (typeof value.reverseOrder !== 'undefined') {
        controlWriter.writeBoolean(value.reverseOrder, 0x81);
      }

      controlWriter.endSequence();
    }

    controlWriter.endSequence();
    writer.writeBuffer(controlWriter.buffer, 0x04);
  }
}
