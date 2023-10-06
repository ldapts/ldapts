import type { BerReader } from 'asn1';

import { Attribute } from '../Attribute.js';
import type { ProtocolOperationValues } from '../ProtocolOperation.js';
import { ProtocolOperation } from '../ProtocolOperation.js';

import type { MessageResponseOptions } from './MessageResponse.js';
import { MessageResponse } from './MessageResponse.js';

export interface SearchEntryOptions extends MessageResponseOptions {
  name?: string;
  attributes?: Attribute[];
}

export interface Entry {
  dn: string;
  [index: string]: Buffer | Buffer[] | string[] | string;
}

export class SearchEntry extends MessageResponse {
  public protocolOperation: ProtocolOperationValues;

  public name: string;

  public attributes: Attribute[];

  public constructor(options: SearchEntryOptions) {
    super(options);
    this.protocolOperation = ProtocolOperation.LDAP_RES_SEARCH_ENTRY;
    this.name = options.name ?? '';
    this.attributes = options.attributes ?? [];
  }

  public override parseMessage(reader: BerReader): void {
    this.name = reader.readString() ?? '';
    reader.readSequence();
    const end = reader.offset + reader.length;
    while (reader.offset < end) {
      const attribute = new Attribute();
      attribute.parse(reader);
      this.attributes.push(attribute);
    }
  }

  public toObject(requestAttributes: string[], explicitBufferAttributes: string[]): Entry {
    const result: Entry = {
      dn: this.name,
    };

    const hasExplicitBufferAttributes = explicitBufferAttributes.length;
    for (const attribute of this.attributes) {
      let { values } = attribute;
      if (hasExplicitBufferAttributes && explicitBufferAttributes.includes(attribute.type)) {
        values = attribute.parsedBuffers;
      }

      if (values.length) {
        if (values.length === 1) {
          result[attribute.type] = values[0] ?? [];
        } else {
          result[attribute.type] = values;
        }
      } else {
        result[attribute.type] = [];
      }
    }

    // Fill in any missing attributes that were requested
    for (const attribute of requestAttributes) {
      if (typeof result[attribute] === 'undefined') {
        result[attribute] = [];
      }
    }

    return result;
  }
}
