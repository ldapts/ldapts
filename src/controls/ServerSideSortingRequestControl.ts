import { type BerReader } from '../ber/index.js';
import { Ber, BerWriter } from '../ber/index.js';

import { type ControlOptions } from './Control.js';
import { Control } from './Control.js';

export interface ServerSideSortingRequestValue {
  attributeType: string;
  orderingRule?: string;
  reverseOrder?: boolean;
}

export interface ServerSideSortingRequestControlOptions extends ControlOptions {
  value?: ServerSideSortingRequestValue | ServerSideSortingRequestValue[];
}

export class ServerSideSortingRequestControl extends Control {
  public static type = '1.2.840.113556.1.4.473';

  public values: ServerSideSortingRequestValue[];

  public constructor(options: ServerSideSortingRequestControlOptions = {}) {
    super(ServerSideSortingRequestControl.type, options);

    if (Array.isArray(options.value)) {
      this.values = options.value;
    } else if (typeof options.value === 'object') {
      this.values = [options.value];
    } else {
      this.values = [];
    }
  }

  public override parseControl(reader: BerReader): void {
    if (reader.readSequence(0x30)) {
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
  }

  public override writeControl(writer: BerWriter): void {
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
