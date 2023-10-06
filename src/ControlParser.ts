import type { BerReader as BerReaderType } from 'asn1';
import asn1 from 'asn1';

import type { Control } from './controls/Control.js';
import { EntryChangeNotificationControl, PagedResultsControl, PersistentSearchControl, ServerSideSortingRequestControl } from './controls/index.js';

const { Ber, BerReader } = asn1;

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class ControlParser {
  public static parse(reader: BerReaderType, requestControls: Control[]): Control | null {
    if (reader.readSequence() === null) {
      return null;
    }

    let type = '';
    let critical = false;
    let value: Buffer = Buffer.alloc(0);
    if (reader.length) {
      const end = reader.offset + reader.length;

      type = reader.readString() ?? '';
      if (reader.offset < end) {
        if (reader.peek() === Ber.Boolean) {
          critical = reader.readBoolean() ?? false;
        }
      }

      if (reader.offset < end) {
        value = reader.readString(Ber.OctetString, true) ?? Buffer.alloc(0);
      }
    }

    let control: Control | undefined;

    switch (type) {
      case EntryChangeNotificationControl.type:
        control = new EntryChangeNotificationControl({
          critical,
        });
        break;
      case PagedResultsControl.type:
        control = new PagedResultsControl({
          critical,
        });
        break;
      case PersistentSearchControl.type:
        control = new PersistentSearchControl({
          critical,
        });
        break;
      case ServerSideSortingRequestControl.type:
        control = new ServerSideSortingRequestControl({
          critical,
        });
        break;
      default:
        control = requestControls.find((requestControl) => requestControl.type === type);
        break;
    }

    if (!control) {
      return null;
    }

    const controlReader = new BerReader(value);
    control.parse(controlReader);
    return control;
  }
}
