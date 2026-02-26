/* eslint-disable no-bitwise */
import { describe, expect, it } from 'vitest';

import { Ber, BerReader, BerWriter } from '../../src/ber/index.js';

describe('BerWriter', () => {
  describe('constructor', () => {
    it('should create with default options', () => {
      const writer = new BerWriter();
      expect(writer).toBeInstanceOf(BerWriter);
    });

    it('should accept custom size option', () => {
      const writer = new BerWriter({ size: 512 });
      expect(writer).toBeInstanceOf(BerWriter);
    });
  });

  describe('#buffer', () => {
    it('should throw if sequences are not ended', () => {
      const writer = new BerWriter();
      writer.startSequence();
      expect(() => writer.buffer).toThrow('1 unended sequence(s)');
    });
  });

  describe('#writeByte()', () => {
    it('should write a single byte', () => {
      const writer = new BerWriter();
      writer.writeByte(0xc2);
      const buffer = writer.buffer;
      expect(buffer.length).toBe(1);
      expect(buffer[0]!).toBe(0xc2);
    });
  });

  describe('#writeInt()', () => {
    it('should write 1 byte integer', () => {
      const writer = new BerWriter();
      writer.writeInt(0x7f);
      const buffer = writer.buffer;
      expect(buffer.length).toBe(3);
      expect(buffer[0]!).toBe(Ber.Integer);
      expect(buffer[1]!).toBe(0x01);
      expect(buffer[2]!).toBe(0x7f);
    });

    it('should write 2 byte integer', () => {
      const writer = new BerWriter();
      writer.writeInt(0x7ffe);
      const buffer = writer.buffer;
      expect(buffer.length).toBe(4);
      expect(buffer[0]!).toBe(Ber.Integer);
      expect(buffer[1]!).toBe(0x02);
      expect(buffer[2]!).toBe(0x7f);
      expect(buffer[3]!).toBe(0xfe);
    });

    it('should write 3 byte integer', () => {
      const writer = new BerWriter();
      writer.writeInt(0x7ffffe);
      const buffer = writer.buffer;
      expect(buffer.length).toBe(5);
      expect(buffer[0]!).toBe(Ber.Integer);
      expect(buffer[1]!).toBe(0x03);
      expect(buffer[2]!).toBe(0x7f);
      expect(buffer[3]!).toBe(0xff);
      expect(buffer[4]!).toBe(0xfe);
    });

    it('should write 4 byte integer', () => {
      const writer = new BerWriter();
      writer.writeInt(0x7ffffffe);
      const buffer = writer.buffer;
      expect(buffer.length).toBe(6);
      expect(buffer[0]!).toBe(Ber.Integer);
      expect(buffer[1]!).toBe(0x04);
      expect(buffer[2]!).toBe(0x7f);
      expect(buffer[3]!).toBe(0xff);
      expect(buffer[4]!).toBe(0xff);
      expect(buffer[5]!).toBe(0xfe);
    });

    it('should write 1 byte negative integer', () => {
      const writer = new BerWriter();
      writer.writeInt(-128);
      const buffer = writer.buffer;
      expect(buffer.length).toBe(3);
      expect(buffer[0]!).toBe(Ber.Integer);
      expect(buffer[1]!).toBe(0x01);
      expect(buffer[2]!).toBe(0x80);
    });

    it('should write 2 byte negative integer', () => {
      const writer = new BerWriter();
      writer.writeInt(-22400);
      const buffer = writer.buffer;
      expect(buffer.length).toBe(4);
      expect(buffer[0]!).toBe(Ber.Integer);
      expect(buffer[1]!).toBe(0x02);
      expect(buffer[2]!).toBe(0xa8);
      expect(buffer[3]!).toBe(0x80);
    });

    it('should write 3 byte negative integer', () => {
      const writer = new BerWriter();
      writer.writeInt(-481653);
      const buffer = writer.buffer;
      expect(buffer.length).toBe(5);
      expect(buffer[0]!).toBe(Ber.Integer);
      expect(buffer[1]!).toBe(0x03);
      expect(buffer[2]!).toBe(0xf8);
      expect(buffer[3]!).toBe(0xa6);
      expect(buffer[4]!).toBe(0x8b);
    });

    it('should write 4 byte negative integer', () => {
      const writer = new BerWriter();
      writer.writeInt(-1522904131);
      const buffer = writer.buffer;
      expect(buffer.length).toBe(6);
      expect(buffer[0]!).toBe(Ber.Integer);
      expect(buffer[1]!).toBe(0x04);
      expect(buffer[2]!).toBe(0xa5);
      expect(buffer[3]!).toBe(0x3a);
      expect(buffer[4]!).toBe(0x53);
      expect(buffer[5]!).toBe(0xbd);
    });
  });

  describe('#writeBoolean()', () => {
    it('should write true', () => {
      const writer = new BerWriter();
      writer.writeBoolean(true);
      const buffer = writer.buffer;
      expect(buffer.length).toBe(3);
      expect(buffer[0]!).toBe(Ber.Boolean);
      expect(buffer[1]!).toBe(0x01);
      expect(buffer[2]!).toBe(0xff);
    });

    it('should write false', () => {
      const writer = new BerWriter();
      writer.writeBoolean(false);
      const buffer = writer.buffer;
      expect(buffer.length).toBe(3);
      expect(buffer[0]!).toBe(Ber.Boolean);
      expect(buffer[1]!).toBe(0x01);
      expect(buffer[2]!).toBe(0x00);
    });
  });

  describe('#writeNull()', () => {
    it('should write null', () => {
      const writer = new BerWriter();
      writer.writeNull();
      const buffer = writer.buffer;
      expect(buffer.length).toBe(2);
      expect(buffer[0]!).toBe(Ber.Null);
      expect(buffer[1]!).toBe(0x00);
    });
  });

  describe('#writeEnumeration()', () => {
    it('should write enumeration', () => {
      const writer = new BerWriter();
      writer.writeEnumeration(0x20);
      const buffer = writer.buffer;
      expect(buffer.length).toBe(3);
      expect(buffer[0]!).toBe(Ber.Enumeration);
      expect(buffer[1]!).toBe(0x01);
      expect(buffer[2]!).toBe(0x20);
    });
  });

  describe('#writeString()', () => {
    it('should write string', () => {
      const writer = new BerWriter();
      writer.writeString('hello world');
      const buffer = writer.buffer;
      expect(buffer.length).toBe(13);
      expect(buffer[0]!).toBe(Ber.OctetString);
      expect(buffer[1]!).toBe(11);
      expect(buffer.subarray(2).toString()).toBe('hello world');
    });

    it('should write empty string', () => {
      const writer = new BerWriter();
      writer.writeString('');
      const buffer = writer.buffer;
      expect(buffer.length).toBe(2);
      expect(buffer[0]!).toBe(Ber.OctetString);
      expect(buffer[1]!).toBe(0);
    });

    it('should write string with custom tag', () => {
      const writer = new BerWriter();
      writer.writeString('test', 0x80);
      const buffer = writer.buffer;
      expect(buffer[0]!).toBe(0x80);
    });

    it('should throw on non-string', () => {
      const writer = new BerWriter();
      expect(() => writer.writeString(123 as unknown as string)).toThrow(TypeError);
    });
  });

  describe('#writeBuffer()', () => {
    it('should write buffer with tag', () => {
      const writer = new BerWriter();
      writer.writeBuffer(Buffer.from([0x04, 0x05, 0x06]), 0x04);
      const buffer = writer.buffer;
      expect(buffer.length).toBe(5);
      expect(buffer[0]!).toBe(0x04);
      expect(buffer[1]!).toBe(0x03);
      expect(buffer.subarray(2)).toStrictEqual(Buffer.from([0x04, 0x05, 0x06]));
    });

    it('should throw on non-buffer', () => {
      const writer = new BerWriter();
      expect(() => writer.writeBuffer('test' as unknown as Buffer, 0x04)).toThrow(TypeError);
    });
  });

  describe('#writeStringArray()', () => {
    it('should write array of strings', () => {
      const writer = new BerWriter();
      writer.writeStringArray(['hello', 'world']);
      const buffer = writer.buffer;

      const reader = new BerReader(buffer);
      expect(reader.readString()!).toBe('hello');
      expect(reader.readString()!).toBe('world');
    });
  });

  describe('#writeOID()', () => {
    it('should write OID', () => {
      const writer = new BerWriter();
      writer.writeOID('1.2.840.113549.1.1.1');
      const buffer = writer.buffer;

      const reader = new BerReader(buffer);
      expect(reader.readOID()!).toBe('1.2.840.113549.1.1.1');
    });

    it('should throw on invalid OID', () => {
      const writer = new BerWriter();
      expect(() => writer.writeOID('1.2')).toThrow('not a valid OID');
    });
  });

  describe('#startSequence() / #endSequence()', () => {
    it('should write simple sequence', () => {
      const writer = new BerWriter();
      writer.startSequence();
      writer.writeBoolean(true);
      writer.endSequence();

      const buffer = writer.buffer;
      expect(buffer[0]!).toBe(Ber.Sequence | Ber.Constructor);

      const reader = new BerReader(buffer);
      expect(reader.readSequence()!).toBe(0x30);
      expect(reader.readBoolean()!).toBe(true);
    });

    it('should write nested sequences', () => {
      const writer = new BerWriter();
      writer.startSequence();
      writer.startSequence();
      writer.writeString('hello');
      writer.endSequence();
      writer.endSequence();

      const buffer = writer.buffer;

      const reader = new BerReader(buffer);
      expect(reader.readSequence()!).toBe(0x30);
      expect(reader.readSequence()!).toBe(0x30);
      expect(reader.readString()!).toBe('hello');
    });

    it('should write sequence with custom tag', () => {
      const writer = new BerWriter();
      writer.startSequence(0x60);
      writer.writeInt(3);
      writer.endSequence();

      const buffer = writer.buffer;
      expect(buffer[0]!).toBe(0x60);
    });

    it('should throw on endSequence without startSequence', () => {
      const writer = new BerWriter();
      expect(() => writer.endSequence()).toThrow('No sequence to end');
    });
  });

  describe('LDAP message writing', () => {
    it('should write anonymous bind request', () => {
      const writer = new BerWriter();
      writer.startSequence();
      writer.writeInt(1);
      writer.startSequence(0x60);
      writer.writeInt(3);
      writer.writeString('');
      writer.writeByte(0x80);
      writer.writeByte(0x00);
      writer.endSequence();
      writer.endSequence();

      const buffer = writer.buffer;
      const reader = new BerReader(buffer);

      expect(reader.readSequence()!).toBe(0x30);
      expect(reader.readInt()!).toBe(1);
      expect(reader.readSequence()!).toBe(0x60);
      expect(reader.readInt()!).toBe(3);
      expect(reader.readString()!).toBe('');
      expect(reader.readByte()!).toBe(0x80);
      expect(reader.readByte()!).toBe(0x00);
    });
  });

  describe('buffer growth', () => {
    it('should automatically resize buffer when needed', () => {
      const writer = new BerWriter({ size: 8 });
      writer.writeString('this is a longer string that exceeds initial buffer');
      const buffer = writer.buffer;
      expect(buffer.length).toBeGreaterThan(8);
    });
  });

  describe('length encoding', () => {
    it('should use short form for length <= 127', () => {
      const writer = new BerWriter();
      writer.writeString('a'.repeat(127));
      const buffer = writer.buffer;
      expect(buffer[1]!).toBe(127);
    });

    it('should use long form with 1 byte for length 128-255', () => {
      const writer = new BerWriter();
      writer.writeString('a'.repeat(128));
      const buffer = writer.buffer;
      expect(buffer[1]!).toBe(0x81);
      expect(buffer[2]!).toBe(128);
    });

    it('should use long form with 2 bytes for length 256-65535', () => {
      const writer = new BerWriter();
      writer.writeString('a'.repeat(256));
      const buffer = writer.buffer;
      expect(buffer[1]!).toBe(0x82);
      expect(buffer[2]!).toBe(0x01);
      expect(buffer[3]!).toBe(0x00);
    });
  });

  describe('round-trip tests', () => {
    it('should round-trip integers', () => {
      const values = [0, 1, 127, 128, 255, 256, 65535, 65536, -1, -128, -129, -32768];
      for (const value of values) {
        const writer = new BerWriter();
        writer.writeInt(value);
        const reader = new BerReader(writer.buffer);
        expect(reader.readInt()!).toBe(value);
      }
    });

    it('should round-trip strings', () => {
      const strings = ['', 'hello', 'a'.repeat(127), 'b'.repeat(128), 'c'.repeat(256)];
      for (const str of strings) {
        const writer = new BerWriter();
        writer.writeString(str);
        const reader = new BerReader(writer.buffer);
        expect(reader.readString()!).toBe(str);
      }
    });

    it('should round-trip complex LDAP structure', () => {
      const writer = new BerWriter();
      writer.startSequence();
      writer.writeInt(42);
      writer.startSequence(0x63);
      writer.writeString('dc=example,dc=com');
      writer.writeEnumeration(2);
      writer.writeEnumeration(0);
      writer.writeInt(0);
      writer.writeInt(0);
      writer.writeBoolean(false);
      writer.writeString('(objectClass=*)');
      writer.endSequence();
      writer.endSequence();

      const buffer = writer.buffer;
      const reader = new BerReader(buffer);

      expect(reader.readSequence()!).toBe(0x30);
      expect(reader.readInt()!).toBe(42);
      expect(reader.readSequence()!).toBe(0x63);
      expect(reader.readString()!).toBe('dc=example,dc=com');
      expect(reader.readEnumeration()!).toBe(2);
      expect(reader.readEnumeration()!).toBe(0);
      expect(reader.readInt()!).toBe(0);
      expect(reader.readInt()!).toBe(0);
      expect(reader.readBoolean()!).toBe(false);
      expect(reader.readString()!).toBe('(objectClass=*)');
    });
  });
});
