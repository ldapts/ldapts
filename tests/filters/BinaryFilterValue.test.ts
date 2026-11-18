import { describe, expect, it } from 'vite-plus/test';

import {
  ApproximateFilter,
  BerReader,
  BerWriter,
  EqualityFilter,
  ExtensibleFilter,
  type Filter,
  FilterParser,
  GreaterThanEqualsFilter,
  LessThanEqualsFilter,
  SubstringFilter,
} from '../../src/index.js';

// An Active Directory objectGUID in its stored form, as RFC 4515 escapes. The wire format compares
// the assertion as an octet string, so every escape has to come out as exactly one byte.
const BINARY_VALUE_ESCAPED = '\\4e\\ce\\c2\\f4\\08\\1f\\58\\43\\ab\\dc\\fe\\3f\\03\\5a\\f4\\cd';
const BINARY_VALUE_BYTES = Buffer.from('4ecec2f4081f5843abdcfe3f035af4cd', 'hex');

function encodedFilterBytes(filter: Filter): Buffer {
  const writer = new BerWriter();
  filter.write(writer);

  // BERWriter.endSequence collapses the length to its shortest form, so skip tag and length first.
  const bytes = writer.buffer;
  let offset = 1;
  const lengthByte = bytes[offset] ?? 0;
  offset += lengthByte > 0x7f ? 1 + (lengthByte - 0x80) : 1;

  // The attribute description (and, for extensible filters, rule and type) come before the
  // assertion, which is the last octet string in the sequence.
  let assertion: Buffer = Buffer.alloc(0);
  while (offset + 1 < bytes.length) {
    const tag = bytes[offset] ?? 0;
    const length = bytes[offset + 1] ?? 0;
    if (tag === 0x04 || tag === 0x83) {
      assertion = bytes.subarray(offset + 2, offset + 2 + length);
    }

    offset += 2 + length;
  }

  return assertion;
}

describe('binary filter values', () => {
  describe('#parseString()', () => {
    it('should keep hexadecimal escapes as single octets', () => {
      const filter = FilterParser.parseString(`(objectGUID=${BINARY_VALUE_ESCAPED})`);

      expect(filter).toBeInstanceOf(EqualityFilter);
      expect((filter as EqualityFilter).value).toStrictEqual(BINARY_VALUE_BYTES);
    });

    it('should not let an escaped octet grow into a multi-byte character', () => {
      const filter = FilterParser.parseString(`(objectGUID=${BINARY_VALUE_ESCAPED})`);

      expect(encodedFilterBytes(filter)).toStrictEqual(BINARY_VALUE_BYTES);
    });

    it('should keep unmatched values as strings', () => {
      expect(FilterParser.parseString('(cn=Mustermann)')).toStrictEqual(new EqualityFilter({ attribute: 'cn', value: 'Mustermann' }));
      expect(FilterParser.parseString('(cn=bar\\00)')).toStrictEqual(new EqualityFilter({ attribute: 'cn', value: 'bar\u0000' }));
      expect(FilterParser.parseString('(cn=bar\\2a)')).toStrictEqual(new EqualityFilter({ attribute: 'cn', value: 'bar*' }));
    });

    it('should encode non-ASCII input the way it always has', () => {
      const filter = FilterParser.parseString('(cn=Müller)');

      expect(encodedFilterBytes(filter)).toStrictEqual(Buffer.from('Müller', 'utf8'));
    });

    it('should keep literal characters next to escaped octets', () => {
      const filter = FilterParser.parseString('(cn=ab\\ffcd)');

      expect(encodedFilterBytes(filter)).toStrictEqual(Buffer.from([0x61, 0x62, 0xff, 0x63, 0x64]));
    });
  });

  describe('#writeFilter()', () => {
    it('should encode a parsed binary value like the same value built from a Buffer', () => {
      const parsed = FilterParser.parseString(`(objectGUID=${BINARY_VALUE_ESCAPED})`);
      const fromBuffer = new EqualityFilter({ attribute: 'objectGUID', value: BINARY_VALUE_BYTES });

      expect(encodedFilterBytes(parsed)).toStrictEqual(encodedFilterBytes(fromBuffer));
    });

    it('should encode binary values in the ordering and extensible filters', () => {
      const filters: Filter[] = [
        new GreaterThanEqualsFilter({ attribute: 'objectGUID', value: BINARY_VALUE_BYTES }),
        new LessThanEqualsFilter({ attribute: 'objectGUID', value: BINARY_VALUE_BYTES }),
        new ApproximateFilter({ attribute: 'objectGUID', value: BINARY_VALUE_BYTES }),
        new ExtensibleFilter({ matchType: 'objectGUID', value: BINARY_VALUE_BYTES }),
      ];

      for (const filter of filters) {
        expect(encodedFilterBytes(filter)).toStrictEqual(BINARY_VALUE_BYTES);
      }
    });
  });

  describe('#parse()', () => {
    it('should keep a binary assertion as a Buffer across a parse -> write round-trip', () => {
      const equality = FilterParser.parseString(`(objectGUID=${BINARY_VALUE_ESCAPED})`);
      const writer = new BerWriter();
      equality.write(writer);

      const parsed = FilterParser.parse(new BerReader(writer.buffer));

      expect(parsed).toBeInstanceOf(EqualityFilter);
      expect((parsed as EqualityFilter).value).toStrictEqual(BINARY_VALUE_BYTES);
      expect(encodedFilterBytes(parsed)).toStrictEqual(BINARY_VALUE_BYTES);
    });

    it('should keep a valid UTF-8 assertion as a string when parsed from the wire', () => {
      const equality = new EqualityFilter({ attribute: 'cn', value: 'Müller' });
      const writer = new BerWriter();
      equality.write(writer);

      const parsed = FilterParser.parse(new BerReader(writer.buffer));

      expect(parsed).toBeInstanceOf(EqualityFilter);
      expect((parsed as EqualityFilter).value).toBe('Müller');
    });
  });

  describe('#toString()', () => {
    it('should round-trip a binary equality filter through its string form', () => {
      const filter = FilterParser.parseString(`(objectGUID=${BINARY_VALUE_ESCAPED})`);

      const reparsed = FilterParser.parseString(filter.toString());

      expect(encodedFilterBytes(reparsed)).toStrictEqual(BINARY_VALUE_BYTES);
    });

    it('should round-trip binary ordering, approximate and extensible filters through their string form', () => {
      const filters: Filter[] = [
        new GreaterThanEqualsFilter({ attribute: 'objectGUID', value: BINARY_VALUE_BYTES }),
        new LessThanEqualsFilter({ attribute: 'objectGUID', value: BINARY_VALUE_BYTES }),
        new ApproximateFilter({ attribute: 'objectGUID', value: BINARY_VALUE_BYTES }),
        new ExtensibleFilter({ matchType: 'objectGUID', value: BINARY_VALUE_BYTES }),
      ];

      for (const filter of filters) {
        const reparsed = FilterParser.parseString(filter.toString());

        expect(encodedFilterBytes(reparsed)).toStrictEqual(BINARY_VALUE_BYTES);
      }
    });
  });

  describe('values that mix literal characters and escaped octets', () => {
    it('should keep a character outside the Basic Multilingual Plane after an escaped octet', () => {
      const filter = FilterParser.parseString('(cn=\\ff😀)');

      expect(encodedFilterBytes(filter)).toStrictEqual(Buffer.concat([Buffer.from([0xff]), Buffer.from('😀', 'utf8')]));
    });

    it('should keep a non-ASCII character before and after an escaped octet', () => {
      const filter = FilterParser.parseString('(cn=Mü\\ffü)');

      expect(encodedFilterBytes(filter)).toStrictEqual(Buffer.concat([Buffer.from('Mü', 'utf8'), Buffer.from([0xff]), Buffer.from('ü', 'utf8')]));
    });

    it('should parse escaped octets that form valid UTF-8 as a string', () => {
      const filter = FilterParser.parseString('(cn=M\\c3\\bcller)');

      expect(filter).toStrictEqual(new EqualityFilter({ attribute: 'cn', value: 'Müller' }));
      expect(encodedFilterBytes(filter)).toStrictEqual(Buffer.from('Müller', 'utf8'));
    });
  });

  describe('substring filters', () => {
    function encodedFilter(filter: Filter): string {
      const writer = new BerWriter();
      filter.write(writer);
      return writer.buffer.toString('hex');
    }

    it('should parse escaped octets that form valid UTF-8 as a string', () => {
      const filter = FilterParser.parseString('(cn=M\\c3\\bc*)');

      expect(filter).toStrictEqual(new SubstringFilter({ attribute: 'cn', initial: 'Mü' }));
    });

    it('should encode a non-ASCII character next to an escaped octet as UTF-8', () => {
      const filter = FilterParser.parseString('(cn=\\ffMü*)');

      // Substring components are strings, so the escaped octet 0xff is still sent as the character U+00FF
      expect(filter).toStrictEqual(new SubstringFilter({ attribute: 'cn', initial: 'ÿMü' }));
      expect(encodedFilter(filter)).toBe(encodedFilter(new SubstringFilter({ attribute: 'cn', initial: 'ÿMü' })));
    });

    it('should keep a character outside the Basic Multilingual Plane', () => {
      const filter = FilterParser.parseString('(cn=\\ff😀*)');

      expect(filter).toStrictEqual(new SubstringFilter({ attribute: 'cn', initial: 'ÿ😀' }));
    });
  });

  describe('byte-order mark', () => {
    it('should keep a leading byte-order mark when parsed from a string', () => {
      const filter = FilterParser.parseString('(cn=\\ef\\bb\\bfabc)');

      expect(encodedFilterBytes(filter)).toStrictEqual(Buffer.from('efbbbf616263', 'hex'));
    });

    it('should keep a leading byte-order mark across a parse -> write round-trip', () => {
      const writer = new BerWriter();
      new EqualityFilter({ attribute: 'cn', value: Buffer.from('efbbbf616263', 'hex') }).write(writer);

      const parsed = FilterParser.parse(new BerReader(writer.buffer));

      expect(encodedFilterBytes(parsed)).toStrictEqual(Buffer.from('efbbbf616263', 'hex'));
    });
  });
});
