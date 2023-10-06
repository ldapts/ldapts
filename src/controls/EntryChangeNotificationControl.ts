import type { BerReader, BerWriter as BerWriterType } from 'asn1';
import asn1 from 'asn1';

import type { ControlOptions } from './Control.js';
import { Control } from './Control.js';

const { BerWriter } = asn1;

export interface EntryChangeNotificationControlValue {
  changeType: number;
  previousDN?: string | null;
  changeNumber: number;
}

export interface EntryChangeNotificationControlOptions extends ControlOptions {
  value?: EntryChangeNotificationControlValue;
}

export class EntryChangeNotificationControl extends Control {
  public static type = '2.16.840.1.113730.3.4.7';

  public value?: EntryChangeNotificationControlValue;

  public constructor(options: EntryChangeNotificationControlOptions = {}) {
    super(EntryChangeNotificationControl.type, options);

    this.value = options.value;
  }

  public override parseControl(reader: BerReader): void {
    if (reader.readSequence()) {
      const changeType = reader.readInt() ?? 0;
      let previousDN;

      if (changeType === 8) {
        previousDN = reader.readString();
      }

      const changeNumber = reader.readInt() ?? 0;

      this.value = {
        changeType,
        previousDN,
        changeNumber,
      };
    }
  }

  public override writeControl(writer: BerWriterType): void {
    if (!this.value) {
      return;
    }

    const controlWriter = new BerWriter();
    controlWriter.startSequence();
    controlWriter.writeInt(this.value.changeType);
    if (this.value.previousDN) {
      controlWriter.writeString(this.value.previousDN);
    }

    controlWriter.writeInt(this.value.changeNumber);
    controlWriter.endSequence();

    writer.writeBuffer(controlWriter.buffer, 0x04);
  }
}
