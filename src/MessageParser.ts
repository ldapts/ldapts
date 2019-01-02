import { BerReader } from 'asn1';
import * as assert from 'assert';
import { StrictEventEmitter } from 'strict-event-emitter-types';
import { EventEmitter } from 'events';
import { ProtocolOperation } from './ProtocolOperation';
import { AddResponse } from './messages/AddResponse';
import { BindResponse } from './messages/BindResponse';
import { CompareResponse } from './messages/CompareResponse';
import { DeleteResponse } from './messages/DeleteResponse';
import { ExtendedResponse } from './messages/ExtendedResponse';
import { ModifyDNResponse } from './messages/ModifyDNResponse';
import { ModifyResponse } from './messages/ModifyResponse';
import { MessageResponse } from './messages/MessageResponse';
import { MessageParserError } from './errors/MessageParserError';
import { SearchResponse } from './messages/SearchResponse';
import { SearchEntry } from './messages/SearchEntry';
import { SearchReference } from './messages/SearchReference';

type MessageParserEmitter = StrictEventEmitter<EventEmitter, MessageParserEvents>;

interface MessageParserEvents {
  message: (message: MessageResponse) => void;
  error: (error: Error) => void;
}

export class MessageParser extends (EventEmitter as { new(): MessageParserEmitter }) {
  private buffer?: Buffer;

  public read(data: Buffer) {
    let nextMessage;

    if (this.buffer) {
      this.buffer = Buffer.concat([this.buffer, data]);
    } else {
      this.buffer = data;
    }

    const reader = new BerReader(this.buffer);
    let foundSequence: number | null = null;
    try {
      foundSequence = reader.readSequence();
    } catch (ex) {
      this.emit('error', ex);
    }

    if (!foundSequence || reader.remain < reader.length) {
      // Have not received enough data to successfully parse
      return;
    }

    if (reader.remain > reader.length) {
      // Received too much data
      nextMessage = this.buffer.slice(reader.offset + reader.length);
      reader._size = reader.offset + reader.length;
      assert.strictEqual(reader.remain, reader.length);
    }

    // Free up space since `ber` holds the current message and `nextMessage` is temporarily pointing
    // at the next sequence of data (if it exists)
    delete this.buffer;

    let messageId: number | undefined;
    let protocolOperation: ProtocolOperation | undefined;
    try {
      messageId = reader.readInt() as number;
      protocolOperation = reader.readSequence() as ProtocolOperation;

      const message = this._getMessageFromProtocolOperation(messageId, protocolOperation, reader);

      if (message) {
        this.emit('message', message);
      }
    } catch (ex) {
      if (messageId) {
        const errorWithMessageDetails = ex as MessageParserError;
        errorWithMessageDetails.messageDetails = {
          messageId,
          protocolOperation,
        };

        this.emit('error', errorWithMessageDetails);
        return;
      }

      this.emit('error', ex);
      return;
    }

    if (nextMessage) {
      this.read(nextMessage);
    }
  }

  private _getMessageFromProtocolOperation(messageId: number, protocolOperation: ProtocolOperation, reader: BerReader): MessageResponse {
    let message: MessageResponse;
    switch (protocolOperation) {
      case ProtocolOperation.LDAP_RES_BIND:
        message = new BindResponse({
          messageId,
        });
        break;
      case ProtocolOperation.LDAP_RES_ADD:
        message = new AddResponse({
          messageId,
        });
        break;
      case ProtocolOperation.LDAP_RES_COMPARE:
        message = new CompareResponse({
          messageId,
        });
        break;
      case ProtocolOperation.LDAP_RES_DELETE:
        message = new DeleteResponse({
          messageId,
        });
        break;
      case ProtocolOperation.LDAP_RES_EXTENSION:
        message = new ExtendedResponse({
          messageId,
        });
        break;
      case ProtocolOperation.LDAP_RES_MODRDN:
        message = new ModifyDNResponse({
          messageId,
        });
        break;
      case ProtocolOperation.LDAP_RES_MODIFY:
        message = new ModifyResponse({
          messageId,
        });
        break;
      case ProtocolOperation.LDAP_RES_SEARCH:
        message = new SearchResponse({
          messageId,
        });
        break;
      case ProtocolOperation.LDAP_RES_SEARCH_ENTRY:
        message = new SearchEntry({
          messageId,
        });
        break;
      case ProtocolOperation.LDAP_RES_SEARCH_REF:
        message = new SearchReference({
          messageId,
        });
        break;
      default:
        const error = new MessageParserError(`Protocol Operation not supported: 0x${protocolOperation.toString(16)}`);
        error.messageDetails = {
          messageId,
          protocolOperation,
        };

        throw error;
    }

    message.parse(reader);
    return message;
  }
}
