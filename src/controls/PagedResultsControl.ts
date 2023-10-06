import type { BerReader, BerWriter as BerWriterType } from 'asn1';
import asn1 from 'asn1';

import type { ControlOptions } from './Control.js';
import { Control } from './Control.js';

const { Ber, BerWriter } = asn1;

export interface PagedResultsValue {
  size: number;
  cookie?: Buffer;
}

export interface PagedResultsControlOptions extends ControlOptions {
  value?: PagedResultsValue;
}

export class PagedResultsControl extends Control {
  public static type = '1.2.840.113556.1.4.319';

  public value?: PagedResultsValue;

  public constructor(options: PagedResultsControlOptions = {}) {
    super(PagedResultsControl.type, options);

    this.value = options.value;
  }

  public override parseControl(reader: BerReader): void {
    if (reader.readSequence()) {
      const size = reader.readInt() ?? 0;
      const cookie = reader.readString(Ber.OctetString, true) ?? Buffer.alloc(0);

      this.value = {
        size,
        cookie,
      };
    }
  }

  public override writeControl(writer: BerWriterType): void {
    if (!this.value) {
      return;
    }

    const controlWriter = new BerWriter();
    controlWriter.startSequence();
    controlWriter.writeInt(this.value.size);
    if (this.value.cookie?.length) {
      controlWriter.writeBuffer(this.value.cookie, Ber.OctetString);
    } else {
      controlWriter.writeString('');
    }

    controlWriter.endSequence();

    writer.writeBuffer(controlWriter.buffer, 0x04);
  }
}
