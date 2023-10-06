import type { BerReader, BerWriter as BerWriterType } from 'asn1';
import asn1 from 'asn1';

import type { ControlOptions } from './Control.js';
import { Control } from './Control.js';

const { BerWriter } = asn1;

export interface PersistentSearchValue {
  changeTypes: number;
  changesOnly: boolean;
  returnECs: boolean;
}

export interface PersistentSearchControlOptions extends ControlOptions {
  value?: PersistentSearchValue;
}

export class PersistentSearchControl extends Control {
  public static type = '2.16.840.1.113730.3.4.3';

  public value?: PersistentSearchValue;

  public constructor(options: PersistentSearchControlOptions = {}) {
    super(PersistentSearchControl.type, options);

    this.value = options.value;
  }

  public override parseControl(reader: BerReader): void {
    if (reader.readSequence()) {
      const changeTypes = reader.readInt() ?? 0;
      const changesOnly = reader.readBoolean() ?? false;
      const returnECs = reader.readBoolean() ?? false;

      this.value = {
        changeTypes,
        changesOnly,
        returnECs,
      };
    }
  }

  public override writeControl(writer: BerWriterType): void {
    if (!this.value) {
      return;
    }

    const controlWriter = new BerWriter();
    controlWriter.startSequence();
    controlWriter.writeInt(this.value.changeTypes);
    controlWriter.writeBoolean(this.value.changesOnly);
    controlWriter.writeBoolean(this.value.returnECs);
    controlWriter.endSequence();

    writer.writeBuffer(controlWriter.buffer, 0x04);
  }
}
