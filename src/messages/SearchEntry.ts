import { BerReader } from 'asn1';
import { MessageResponse, MessageResponseOptions } from './MessageResponse';
import { ProtocolOperation } from '../ProtocolOperation';
import { Attribute } from '../Attribute';

export interface SearchEntryOptions extends MessageResponseOptions {
  name?: string;
  attributes?: Attribute[];
}

export interface Entry {
  dn: string;
  [index: string]: string | string[] | Buffer | Buffer[];
}

export class SearchEntry extends MessageResponse {
  public protocolOperation: ProtocolOperation;
  public name: string;
  public attributes: Attribute[];

  constructor(options: SearchEntryOptions) {
    super(options);
    this.protocolOperation = ProtocolOperation.LDAP_RES_SEARCH_ENTRY;
    this.name = options.name || '';
    this.attributes = options.attributes || [];
  }

  public parseMessage(reader: BerReader): void {
    this.name = reader.readString();
    reader.readSequence();
    const end = reader.offset + reader.length;
    while (reader.offset < end) {
      const attribute = new Attribute();
      attribute.parse(reader);
      this.attributes.push(attribute);
    }
  }

  public toObject(): Entry {
    const result: Entry = {
      dn: this.name,
    };

    for (const attribute of this.attributes) {
      if (attribute.values && attribute.values.length) {
        if (attribute.values.length === 1) {
          result[attribute.type] = attribute.values[0];
        } else {
          result[attribute.type] = attribute.values;
        }
      } else {
        result[attribute.type] = [];
      }
    }

    return result;
  }
}
