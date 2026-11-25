import fc from 'fast-check';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { BerReader } from '../src/ber/index.js';
import { MessageParser } from '../src/MessageParser.js';

// Well-formed LDAPMessage contents (everything after the outer SEQUENCE header) for the response types the client parses
const seeds: number[][] = [
  // SearchResultEntry { "a", { { "c", SET { "d", "e" } } } }
  [0x02, 0x01, 0x01, 0x64, 0x12, 0x04, 0x01, 0x61, 0x30, 0x0d, 0x30, 0x0b, 0x04, 0x01, 0x63, 0x31, 0x06, 0x04, 0x01, 0x64, 0x04, 0x01, 0x65],
  // SearchResultReference { "ldap://a", "b" } with a long-form length on the first URI
  [0x02, 0x01, 0x02, 0x73, 0x11, 0x04, 0x84, 0x00, 0x00, 0x00, 0x08, 0x6c, 0x64, 0x61, 0x70, 0x3a, 0x2f, 0x2f, 0x61, 0x04, 0x01, 0x62],
  // BindResponse { success, "", "" } with a paged results control
  [
    0x02, 0x01, 0x03, 0x61, 0x07, 0x0a, 0x01, 0x00, 0x04, 0x00, 0x04, 0x00, 0xa0, 0x26, 0x30, 0x24, 0x04, 0x16, 0x31, 0x2e, 0x32, 0x2e, 0x38, 0x34, 0x30, 0x2e, 0x31, 0x31, 0x33, 0x35, 0x35, 0x36,
    0x2e, 0x31, 0x2e, 0x34, 0x2e, 0x33, 0x31, 0x39, 0x04, 0x0a, 0x30, 0x08, 0x02, 0x01, 0x00, 0x04, 0x03, 0x61, 0x62, 0x63,
  ],
  // SearchResultDone { success, "", "" }
  [0x02, 0x01, 0x04, 0x65, 0x07, 0x0a, 0x01, 0x00, 0x04, 0x00, 0x04, 0x00],
];

function frame(contents: number[]): Buffer {
  const length = contents.length < 0x80 ? [contents.length] : [0x82, Math.floor(contents.length / 0x100), contents.length % 0x100];
  return Buffer.from([0x30, ...length, ...contents]);
}

// Replaces a few bytes of a seed but keeps the outer length correct, so the parser treats it as a complete message
const mutatedMessage = fc.tuple(fc.constantFrom(...seeds), fc.array(fc.tuple(fc.nat(), fc.integer({ min: 0, max: 0xff })), { minLength: 1, maxLength: 4 }), fc.nat()).map(([seed, edits, cut]) => {
  const contents = [...seed];
  for (const [position, value] of edits) {
    contents[position % contents.length] = value;
  }

  return frame(contents.slice(0, contents.length - (cut % 4)));
});

const randomMessage = fc.uint8Array({ maxLength: 64 }).map((bytes) => frame([0x02, 0x01, 0x01, ...bytes]));

describe('MessageParser fuzzing', () => {
  // Every parse step reads at least one byte, so reads per message are bounded by its size. Counting peeks turns a
  // parse loop that stops advancing into a failure instead of a hung test run.
  let peeks = 0;
  let budget = 0;
  let exceeded = false;

  beforeEach(() => {
    vi.spyOn(BerReader.prototype, 'peek').mockImplementation(function countingPeek(this: BerReader) {
      peeks += 1;
      if (peeks > budget) {
        exceeded = true;
        throw new Error('Parser stopped advancing');
      }

      return this.readByte(true);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should parse every seed without errors', () => {
    budget = Number.POSITIVE_INFINITY;
    const parser = new MessageParser();
    const errors: Error[] = [];
    let messages = 0;
    parser.on('error', (error) => errors.push(error));
    parser.on('message', () => {
      messages += 1;
    });
    for (const seed of seeds) {
      parser.read(frame(seed), new Map());
    }

    expect(errors).toStrictEqual([]);
    expect(messages).toBe(seeds.length);
  });

  it.each([
    ['mutated responses', mutatedMessage],
    ['random responses', randomMessage],
  ])('should finish parsing %s', (_, messages) => {
    fc.assert(
      fc.property(messages, (data) => {
        peeks = 0;
        budget = 10 * data.length + 100;
        exceeded = false;

        const parser = new MessageParser();
        parser.on('error', () => {
          // Malformed input is expected to emit errors
        });
        parser.read(data, new Map());

        expect(exceeded).toBe(false);
      }),
      { numRuns: 2000 },
    );
  });
});
