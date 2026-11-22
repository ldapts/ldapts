import { Buffer } from 'node:buffer';

import { describe, expect, it } from 'vite-plus/test';

import { MessageParser } from '../src/index.js';

// Minimal valid LDAPMessage: messageId 1 followed by an empty ExtendedResponse.
const EXTENDED_RESPONSE = Buffer.from([0x30, 0x0c, 0x02, 0x01, 0x01, 0x65, 0x07, 0x0a, 0x01, 0x00, 0x04, 0x00, 0x04, 0x00]);

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

// An ExtendedResponse whose diagnostic message forces a long-form length.
function extendedResponse(diagnostic: string): Buffer {
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

describe('MessageParser', () => {
  describe('#read()', () => {
    it('does not nest one call per message in a chunk', () => {
      const parser = new DepthTrackingParser();
      const messageDetailsByMessageId: MessageDetailsByMessageId = new Map();
      let messages = 0;

      parser.on('message', () => {
        messages += 1;
      });

      const chunk = Buffer.concat(Array.from({ length: 1_000 }, () => EXTENDED_RESPONSE));

      parser.read(chunk, messageDetailsByMessageId);

      expect(messages).toBe(1_000);
      expect(parser.maxDepth).toBe(1);
    });

    it('parses every message in one chunk without exhausting the stack', () => {
      const { errors, messageCount, messageDetailsByMessageId, parser } = createParser();

      // Far more than a 64 KB socket chunk can carry, so the old recursion
      // overflows on V8 too; on an engine with a shorter stack a real chunk is
      // enough.
      const chunk = Buffer.concat(Array.from({ length: 50_000 }, () => EXTENDED_RESPONSE));

      expect((): void => parser.read(chunk, messageDetailsByMessageId)).not.toThrow();
      expect(errors).toStrictEqual([]);
      expect(messageCount()).toBe(50_000);
    });

    it('holds a partial message until the next chunk completes it', () => {
      const { errors, messageCount, messageDetailsByMessageId, parser } = createParser();

      parser.read(EXTENDED_RESPONSE.subarray(0, 5), messageDetailsByMessageId);
      expect(messageCount()).toBe(0);

      parser.read(EXTENDED_RESPONSE.subarray(5), messageDetailsByMessageId);
      expect(errors).toStrictEqual([]);
      expect(messageCount()).toBe(1);
    });

    it('reassembles a message delivered one byte at a time', () => {
      const { errors, messageCount, messageDetailsByMessageId, parser } = createParser();

      for (const byte of EXTENDED_RESPONSE) {
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

      parser.read(extendedResponse(diagnostic), messageDetailsByMessageId);

      expect(errors).toStrictEqual([]);
      expect(messageCount()).toBe(1);
      expect(received).toBe(diagnostic);
    });

    it('keeps the old stop-on-error behaviour for the rest of a chunk', () => {
      const { errors, messageCount, messageDetailsByMessageId, parser } = createParser();
      const chunk = Buffer.concat([EXTENDED_RESPONSE, UNSUPPORTED_OPERATION, EXTENDED_RESPONSE]);

      parser.read(chunk, messageDetailsByMessageId);

      expect(messageCount()).toBe(1);
      expect(errors).toHaveLength(1);
      expect(errors[0]?.message).toContain('Protocol Operation not supported');
    });

    it('parses messages that straddle a chunk boundary', () => {
      const { errors, messageCount, messageDetailsByMessageId, parser } = createParser();
      const chunk = Buffer.concat([EXTENDED_RESPONSE, EXTENDED_RESPONSE]);

      // First message plus six bytes of the second.
      parser.read(chunk.subarray(0, 20), messageDetailsByMessageId);
      expect(messageCount()).toBe(1);

      parser.read(chunk.subarray(20), messageDetailsByMessageId);
      expect(errors).toStrictEqual([]);
      expect(messageCount()).toBe(2);
    });
  });
});
