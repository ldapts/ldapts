import { Buffer } from 'node:buffer';

import { describe, expect, it } from 'vite-plus/test';

import { InvalidAsn1Error, MessageParser, SearchEntry } from '../src/index.js';
import { type MessageResponse } from '../src/messages/MessageResponse.js';

// Minimal valid LDAPMessage: messageId 1 followed by an empty SearchResultDone.
const SEARCH_RESULT_DONE = Buffer.from([0x30, 0x0c, 0x02, 0x01, 0x01, 0x65, 0x07, 0x0a, 0x01, 0x00, 0x04, 0x00, 0x04, 0x00]);

// A frameable message whose protocol operation is not supported.
const UNSUPPORTED_OPERATION = Buffer.from([0x30, 0x05, 0x02, 0x01, 0x01, 0x7f, 0x00]);

type MessageDetailsByMessageId = Parameters<MessageParser['read']>[1];

function encodeLength(length: number): Buffer {
  if (length < 0x80) return Buffer.from([length]);

  if (length < 0x100) return Buffer.from([0x81, length]);

  return Buffer.from([0x82, Math.floor(length / 0x100), length % 0x100]);
}

function tlv(tag: number, content: Buffer): Buffer {
  return Buffer.concat([Buffer.from([tag]), encodeLength(content.length), content]);
}

// A SearchResultDone whose diagnostic message forces a long-form length.
function searchResultDone(diagnostic: string): Buffer {
  return tlv(0x30, Buffer.concat([tlv(0x02, Buffer.from([0x01])), tlv(0x65, Buffer.concat([tlv(0x0a, Buffer.from([0x00])), tlv(0x04, Buffer.alloc(0)), tlv(0x04, Buffer.from(diagnostic))]))]));
}

class DepthTrackingParser extends MessageParser {
  public depth = 0;
  public maxDepth = 0;

  public override read(data: Buffer, messageDetailsByMessageId: MessageDetailsByMessageId): void {
    this.depth += 1;
    this.maxDepth = Math.max(this.maxDepth, this.depth);

    try {
      super.read(data, messageDetailsByMessageId);
    } finally {
      this.depth -= 1;
    }
  }
}

function createParser(): {
  errors: Error[];
  messageDetailsByMessageId: MessageDetailsByMessageId;
  messageCount: () => number;
  parser: MessageParser;
} {
  const parser = new MessageParser();
  const errors: Error[] = [];
  const messageDetailsByMessageId: MessageDetailsByMessageId = new Map();
  let messages = 0;

  parser.on('error', (error) => errors.push(error));
  parser.on('message', () => {
    messages += 1;
  });

  return {
    errors,
    messageDetailsByMessageId,
    messageCount: () => messages,
    parser,
  };
}

interface ParseResult {
  messages: MessageResponse[];
  errors: Error[];
}

function parse(...chunks: number[][]): ParseResult {
  const parser = new MessageParser();
  const result: ParseResult = { messages: [], errors: [] };
  parser.on('message', (message) => result.messages.push(message));
  parser.on('error', (error) => result.errors.push(error));
  for (const chunk of chunks) {
    parser.read(Buffer.from(chunk), new Map());
  }

  return result;
}

// LDAPMessage { id 1, SearchResultEntry { "a", attributes { { "c", SET { "d" } } } } }
const searchEntry = [0x30, 0x14, 0x02, 0x01, 0x01, 0x64, 0x0f, 0x04, 0x01, 0x61, 0x30, 0x0a, 0x30, 0x08, 0x04, 0x01, 0x63, 0x31, 0x03, 0x04, 0x01, 0x64];

describe('MessageParser', () => {
  describe('#read()', () => {
    it('does not nest one call per message in a chunk', () => {
      const parser = new DepthTrackingParser();
      const messageDetailsByMessageId: MessageDetailsByMessageId = new Map();
      let messages = 0;

      parser.on('message', () => {
        messages += 1;
      });

      const chunk = Buffer.concat(Array.from({ length: 1_000 }, () => SEARCH_RESULT_DONE));

      parser.read(chunk, messageDetailsByMessageId);

      expect(messages).toBe(1_000);
      expect(parser.maxDepth).toBe(1);
    });

    it('parses every message in one chunk without exhausting the stack', () => {
      const { errors, messageCount, messageDetailsByMessageId, parser } = createParser();

      // Far more than a 64 KB socket chunk can carry, so the old recursion
      // overflows on V8 too; on an engine with a shorter stack a real chunk is
      // enough.
      const chunk = Buffer.concat(Array.from({ length: 50_000 }, () => SEARCH_RESULT_DONE));

      expect((): void => parser.read(chunk, messageDetailsByMessageId)).not.toThrow();
      expect(errors).toStrictEqual([]);
      expect(messageCount()).toBe(50_000);
    });

    it('holds a partial message until the next chunk completes it', () => {
      const { errors, messageCount, messageDetailsByMessageId, parser } = createParser();

      parser.read(SEARCH_RESULT_DONE.subarray(0, 5), messageDetailsByMessageId);
      expect(messageCount()).toBe(0);

      parser.read(SEARCH_RESULT_DONE.subarray(5), messageDetailsByMessageId);
      expect(errors).toStrictEqual([]);
      expect(messageCount()).toBe(1);
    });

    it('reassembles a message delivered one byte at a time', () => {
      const { errors, messageCount, messageDetailsByMessageId, parser } = createParser();

      for (const byte of SEARCH_RESULT_DONE) {
        parser.read(Buffer.from([byte]), messageDetailsByMessageId);
      }

      expect(errors).toStrictEqual([]);
      expect(messageCount()).toBe(1);
    });

    it('parses a message whose length uses the long form', () => {
      const { errors, messageCount, messageDetailsByMessageId, parser } = createParser();
      const diagnostic = 'x'.repeat(200);
      let received = '';

      parser.on('message', (message) => {
        received = message.errorMessage;
      });

      parser.read(searchResultDone(diagnostic), messageDetailsByMessageId);

      expect(errors).toStrictEqual([]);
      expect(messageCount()).toBe(1);
      expect(received).toBe(diagnostic);
    });

    it('keeps the old stop-on-error behaviour for the rest of a chunk', () => {
      const { errors, messageCount, messageDetailsByMessageId, parser } = createParser();
      const chunk = Buffer.concat([SEARCH_RESULT_DONE, UNSUPPORTED_OPERATION, SEARCH_RESULT_DONE]);

      parser.read(chunk, messageDetailsByMessageId);

      expect(messageCount()).toBe(1);
      expect(errors).toHaveLength(1);
      expect(errors[0]?.message).toContain('Protocol Operation not supported');
    });

    it('parses messages that straddle a chunk boundary', () => {
      const { errors, messageCount, messageDetailsByMessageId, parser } = createParser();
      const chunk = Buffer.concat([SEARCH_RESULT_DONE, SEARCH_RESULT_DONE]);

      // First message plus six bytes of the second.
      parser.read(chunk.subarray(0, 20), messageDetailsByMessageId);
      expect(messageCount()).toBe(1);

      parser.read(chunk.subarray(20), messageDetailsByMessageId);
      expect(errors).toStrictEqual([]);
      expect(messageCount()).toBe(2);
    });
  });
});

describe('MessageParser responses', () => {
  it('should parse a search entry', () => {
    const { messages, errors } = parse(searchEntry);
    expect(errors).toStrictEqual([]);
    expect(messages).toHaveLength(1);
    const entry = messages[0] as SearchEntry;
    expect(entry).toBeInstanceOf(SearchEntry);
    expect(entry.name).toBe('a');
    expect(entry.attributes.map((attribute) => [attribute.type, attribute.values])).toStrictEqual([['c', ['d']]]);
  });

  it('should wait for the rest of a message split across reads', () => {
    const { messages, errors } = parse(searchEntry.slice(0, 9), searchEntry.slice(9));
    expect(errors).toStrictEqual([]);
    expect(messages).toHaveLength(1);
  });

  describe('malformed responses', () => {
    it.each([
      // Attribute list declares 0x7f bytes, but only 5 bytes remain in the message
      ['search entry attribute list', [0x30, 0x0f, 0x02, 0x01, 0x01, 0x64, 0x0a, 0x04, 0x01, 0x61, 0x30, 0x7f, 0x30, 0x03, 0x04, 0x01, 0x63]],
      // Last attribute value declares 0x7f bytes, but only 1 byte remains
      ['search entry attribute value', [0x30, 0x13, 0x02, 0x01, 0x01, 0x64, 0x0e, 0x04, 0x01, 0x61, 0x30, 0x09, 0x30, 0x07, 0x04, 0x01, 0x63, 0x31, 0x03, 0x04, 0x7f, 0x64]],
      // Reference URI declares 0x7f bytes, but only 1 byte remains
      ['search reference uri', [0x30, 0x08, 0x02, 0x01, 0x01, 0x73, 0x03, 0x04, 0x7f, 0x61]],
      // Reference URI declares 0xfffffffa bytes, which is negative if decoded as a signed 32-bit integer
      ['search reference uri with a 4-byte length', [0x30, 0x0d, 0x02, 0x01, 0x01, 0x73, 0x08, 0x04, 0x84, 0xff, 0xff, 0xff, 0xfa, 0x61, 0x61]],
      // Controls declare 5 bytes, but none remain
      ['response controls', [0x30, 0x0e, 0x02, 0x01, 0x01, 0x61, 0x07, 0x0a, 0x01, 0x00, 0x04, 0x00, 0x04, 0x00, 0xa0, 0x05]],
    ])('should emit an error when the %s overruns the message', (_, pdu) => {
      const { messages, errors } = parse(pdu);
      expect(messages).toStrictEqual([]);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toBeInstanceOf(InvalidAsn1Error);
    });

    it.each([
      // Outer sequence uses an indefinite length, which is not supported
      ['an indefinite length', [0x30, 0x80]],
      // Outer element is not a SEQUENCE
      ['a non-sequence tag', [0x00, 0x00]],
    ])('should drop framing with %s so later data is parsed fresh', (_, framing) => {
      const { messages, errors } = parse(framing, searchEntry);
      expect(errors).toHaveLength(1);
      expect(messages).toHaveLength(1);
    });
  });
});
