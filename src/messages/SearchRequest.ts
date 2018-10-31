// @ts-ignore
import { BerReader, BerWriter } from 'asn1';
import { Message, MessageOptions } from './Message';
import { ProtocolOperation } from '../ProtocolOperation';
import { PresenceFilter } from '../filters/PresenceFilter';
import { FilterParser } from '../FilterParser';
import { Filter } from '../filters/Filter';

export interface SearchRequestMessageOptions extends MessageOptions {
  baseDN?: string;
  scope?: 'base' | 'one' | 'sub';
  derefAliases?: ProtocolOperation.NEVER_DEREF_ALIASES | ProtocolOperation.DEREF_IN_SEARCHING | ProtocolOperation.DEREF_BASE_OBJECT | ProtocolOperation.DEREF_ALWAYS;
  sizeLimit?: number;
  timeLimit?: number;
  returnAttributeValues?: boolean;
  filter?: string | Filter;
  attributes?: string[];
}

export class SearchRequest extends Message {
  public baseDN: string;
  public scope: 'base' | 'one' | 'sub';
  public derefAliases: ProtocolOperation.NEVER_DEREF_ALIASES | ProtocolOperation.DEREF_IN_SEARCHING | ProtocolOperation.DEREF_BASE_OBJECT | ProtocolOperation.DEREF_ALWAYS;
  public sizeLimit: number;
  public timeLimit: number;
  public returnAttributeValues: boolean;
  public filter: string | Filter;
  public attributes: string[];

  constructor(options: SearchRequestMessageOptions) {
    super(options);
    this.protocolOperation = ProtocolOperation.LDAP_REQ_MODRDN;

    this.baseDN = options.baseDN || '';
    this.scope = options.scope || 'base';
    this.derefAliases = options.derefAliases || ProtocolOperation.NEVER_DEREF_ALIASES;
    this.sizeLimit = options.sizeLimit || 0;
    this.timeLimit = options.timeLimit || 10;
    this.returnAttributeValues = options.returnAttributeValues !== false;
    this.filter = options.filter || '';
    this.attributes = options.attributes || [];
  }

  public writeMessage(writer: BerWriter): void {
    writer.writeString(this.baseDN.toString());
    writer.writeEnumeration(this.scope);
    writer.writeEnumeration(this.derefAliases);
    writer.writeInt(this.sizeLimit);
    writer.writeInt(this.timeLimit);
    writer.writeBoolean(this.returnAttributeValues);

    if (!this.filter) {
      this.filter = new PresenceFilter({ attribute: 'objectclass' });
    }

    if (this.filter instanceof Filter) {
      this.filter.write(writer);
    } else {
      writer.writeString(this.filter);
    }

    // tslint:disable-next-line:no-bitwise
    writer.startSequence(writer.Sequence | writer.Constructor);

    if (this.attributes && this.attributes.length) {
      for (const attribute of this.attributes) {
        writer.writeString(attribute);
      }
    }

    writer.endSequence();
  }

  public parseMessage(reader: BerReader) {
    this.baseDN = reader.readString();
    this.scope = reader.readEnumeration();
    this.derefAliases = reader.readEnumeration();
    this.sizeLimit = reader.readInt();
    this.timeLimit = reader.readInt();
    this.returnAttributeValues = !reader.readBoolean();
    this.filter = FilterParser.parse(reader);

    if (reader.peek() === 0x30) {
      reader.readSequence();
      const end = reader.offset + reader.length;
      while (reader.offset < end) {
        this.attributes.push((reader.readString() || '').toLowerCase());
      }
    }
  }
}
