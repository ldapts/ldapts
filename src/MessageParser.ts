import * as assert from 'node:assert';
import { EventEmitter } from 'node:events';

import type { BerReader as BerReaderType } from 'asn1';
import asn1 from 'asn1';
import type { StrictEventEmitter } from 'strict-event-emitter-types';

import { MessageParserError } from './errors/MessageParserError.js';
import { AddResponse, BindResponse, CompareResponse, DeleteResponse, ExtendedResponse, ModifyDNResponse, ModifyResponse, SearchEntry, SearchReference, SearchResponse } from './messages/index.js';
import type { Message } from './messages/Message.js';
import type { MessageResponse } from './messages/MessageResponse.js';
import type { ProtocolOperationValues } from './ProtocolOperation.js';
import { ProtocolOperation } from './ProtocolOperation.js';

interface MessageParserEvents {
  message: (message: MessageResponse) => void;
  error: (error: Error) => void;
}

type MessageParserEmitter = StrictEventEmitter<EventEmitter, MessageParserEvents>;

const { BerReader } = asn1;

export class MessageParser extends (EventEmitter as new () => MessageParserEmitter) {
  private buffer?: Buffer;

  public read(data: Buffer, messageDetailsByMessageId: Map<string, { message: Message }>): void {
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
      this.emit('error', ex as Error);
    }

    if (!foundSequence || reader.remain < reader.length) {
      // Have not received enough data to successfully parse
      return;
    }

    if (reader.remain > reader.length) {
      // Received too much data
      nextMessage = this.buffer.subarray(reader.offset + reader.length);
      reader._size = reader.offset + reader.length;
      assert.strictEqual(reader.remain, reader.length);
    }

    // Free up space since `ber` holds the current message and `nextMessage` is temporarily pointing
    // at the next sequence of data (if it exists)
    delete this.buffer;

    let messageId: number | null | undefined;
    let protocolOperation: number | null | undefined;

    try {
      messageId = reader.readInt();
      if (messageId == null) {
        throw new Error(`Unable to read message id`);
      }

      protocolOperation = reader.readSequence();

      if (protocolOperation == null) {
        throw new Error(`Unable to read protocol operation sequence for message: ${messageId}`);
      }

      const messageDetails = messageDetailsByMessageId.get(`${messageId}`);

      const message = this._getMessageFromProtocolOperation(messageId, protocolOperation, reader, messageDetails?.message);

      this.emit('message', message);
    } catch (ex) {
      if (messageId) {
        const errorWithMessageDetails = ex as MessageParserError;
        errorWithMessageDetails.messageDetails = {
          messageId,
        };

        if (protocolOperation) {
          errorWithMessageDetails.messageDetails.protocolOperation = protocolOperation;
        }

        this.emit('error', errorWithMessageDetails);
        return;
      }

      this.emit('error', ex as Error);
      return;
    }

    if (nextMessage) {
      this.read(nextMessage, messageDetailsByMessageId);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  private _getMessageFromProtocolOperation(messageId: number, protocolOperation: ProtocolOperationValues | number, reader: BerReaderType, messageDetails?: Message): MessageResponse {
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
      default: {
        const error = new MessageParserError(`Protocol Operation not supported: 0x${protocolOperation.toString(16)}`);
        error.messageDetails = {
          messageId,
          protocolOperation,
        };

        throw error;
      }
    }

    message.parse(reader, messageDetails?.controls ?? []);
    return message;
  }
}
