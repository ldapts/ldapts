import type { BerReader } from 'asn1';
import { Ber, BerWriter } from 'asn1';

import type { ControlOptions } from './Control';
import { Control } from './Control';

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
      const size = reader.readInt();
      const cookie = reader.readString(Ber.OctetString, true) || Buffer.alloc(0);

      this.value = {
        size,
        cookie,
      };
    }
  }

  public override writeControl(writer: BerWriter): void {
    if (!this.value) {
      return;
    }

    const controlWriter = new BerWriter();
    controlWriter.startSequence();
    controlWriter.writeInt(this.value.size);
    if (this.value.cookie && this.value.cookie.length) {
      controlWriter.writeBuffer(this.value.cookie, Ber.OctetString);
    } else {
      controlWriter.writeString('');
    }

    controlWriter.endSequence();

    writer.writeBuffer(controlWriter.buffer, 0x04);
  }
}
