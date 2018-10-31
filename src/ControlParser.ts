// @ts-ignore
import { Ber, BerReader } from 'asn1';
import { Control } from './controls/Control';
import { EntryChangeNotificationControl } from './controls/EntryChangeNotificationControl';
import { PagedResultsControl } from './controls/PagedResultsControl';
import { PersistentSearchControl } from './controls/PersistentSearchControl';
import { ServerSideSortingRequestControl } from './controls/ServerSideSortingRequestControl';

export class ControlParser {
  public static parse(reader: BerReader): Control | null {
    if (reader.readSequence() === null) {
      return null;
    }

    let type: string = '';
    let critical: boolean = false;
    let value: Buffer = new Buffer(0);
    if (reader.length) {
      const end = reader.offset + reader.length;

      type = reader.readString();
      if (reader.offset < end) {
        if (reader.peek() === Ber.Boolean) {
          critical = reader.readBoolean();
        }
      }

      if (reader.offset < end) {
        value = reader.readBuffer();
      }
    }

    switch (type) {
      case EntryChangeNotificationControl.type:
        return new EntryChangeNotificationControl({
          critical,
          value,
        });
      case PagedResultsControl.type:
        return new PagedResultsControl({
          critical,
          value,
        });
      case PersistentSearchControl.type:
        return new PersistentSearchControl({
          critical,
          value,
        });
      case ServerSideSortingRequestControl.type:
        return new ServerSideSortingRequestControl({
          critical,
          value,
        });
      default:
        return null;
    }
  }
}
