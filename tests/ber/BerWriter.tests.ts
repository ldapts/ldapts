/* eslint-disable @typescript-eslint/no-non-null-assertion, no-bitwise */
import 'chai/register-should.js';

import { Ber, BerReader, BerWriter, InvalidAsn1Error } from '../../src/ber/index.js';

describe('BerWriter', () => {
  describe('constructor', () => {
    it('should create with default options', () => {
      const writer = new BerWriter();
      writer.should.be.instanceOf(BerWriter);
    });

    it('should accept custom size option', () => {
      const writer = new BerWriter({ size: 512 });
      writer.should.be.instanceOf(BerWriter);
    });
  });

  describe('#buffer', () => {
    it('should throw if sequences are not ended', () => {
      const writer = new BerWriter();
      writer.startSequence();
      (() => writer.buffer).should.throw(InvalidAsn1Error, '1 unended sequence(s)');
    });
  });

  describe('#writeByte()', () => {
    it('should write a single byte', () => {
      const writer = new BerWriter();
      writer.writeByte(0xc2);
      const buffer = writer.buffer;
      buffer.length.should.equal(1);
      buffer[0]!.should.equal(0xc2);
    });
  });

  describe('#writeInt()', () => {
    it('should write 1 byte integer', () => {
      const writer = new BerWriter();
      writer.writeInt(0x7f);
      const buffer = writer.buffer;
      buffer.length.should.equal(3);
      buffer[0]!.should.equal(Ber.Integer);
      buffer[1]!.should.equal(0x01);
      buffer[2]!.should.equal(0x7f);
    });

    it('should write 2 byte integer', () => {
      const writer = new BerWriter();
      writer.writeInt(0x7ffe);
      const buffer = writer.buffer;
      buffer.length.should.equal(4);
      buffer[0]!.should.equal(Ber.Integer);
      buffer[1]!.should.equal(0x02);
      buffer[2]!.should.equal(0x7f);
      buffer[3]!.should.equal(0xfe);
    });

    it('should write 3 byte integer', () => {
      const writer = new BerWriter();
      writer.writeInt(0x7ffffe);
      const buffer = writer.buffer;
      buffer.length.should.equal(5);
      buffer[0]!.should.equal(Ber.Integer);
      buffer[1]!.should.equal(0x03);
      buffer[2]!.should.equal(0x7f);
      buffer[3]!.should.equal(0xff);
      buffer[4]!.should.equal(0xfe);
    });

    it('should write 4 byte integer', () => {
      const writer = new BerWriter();
      writer.writeInt(0x7ffffffe);
      const buffer = writer.buffer;
      buffer.length.should.equal(6);
      buffer[0]!.should.equal(Ber.Integer);
      buffer[1]!.should.equal(0x04);
      buffer[2]!.should.equal(0x7f);
      buffer[3]!.should.equal(0xff);
      buffer[4]!.should.equal(0xff);
      buffer[5]!.should.equal(0xfe);
    });

    it('should write 1 byte negative integer', () => {
      const writer = new BerWriter();
      writer.writeInt(-128);
      const buffer = writer.buffer;
      buffer.length.should.equal(3);
      buffer[0]!.should.equal(Ber.Integer);
      buffer[1]!.should.equal(0x01);
      buffer[2]!.should.equal(0x80);
    });

    it('should write 2 byte negative integer', () => {
      const writer = new BerWriter();
      writer.writeInt(-22400);
      const buffer = writer.buffer;
      buffer.length.should.equal(4);
      buffer[0]!.should.equal(Ber.Integer);
      buffer[1]!.should.equal(0x02);
      buffer[2]!.should.equal(0xa8);
      buffer[3]!.should.equal(0x80);
    });

    it('should write 3 byte negative integer', () => {
      const writer = new BerWriter();
      writer.writeInt(-481653);
      const buffer = writer.buffer;
      buffer.length.should.equal(5);
      buffer[0]!.should.equal(Ber.Integer);
      buffer[1]!.should.equal(0x03);
      buffer[2]!.should.equal(0xf8);
      buffer[3]!.should.equal(0xa6);
      buffer[4]!.should.equal(0x8b);
    });

    it('should write 4 byte negative integer', () => {
      const writer = new BerWriter();
      writer.writeInt(-1522904131);
      const buffer = writer.buffer;
      buffer.length.should.equal(6);
      buffer[0]!.should.equal(Ber.Integer);
      buffer[1]!.should.equal(0x04);
      buffer[2]!.should.equal(0xa5);
      buffer[3]!.should.equal(0x3a);
      buffer[4]!.should.equal(0x53);
      buffer[5]!.should.equal(0xbd);
    });
  });

  describe('#writeBoolean()', () => {
    it('should write true', () => {
      const writer = new BerWriter();
      writer.writeBoolean(true);
      const buffer = writer.buffer;
      buffer.length.should.equal(3);
      buffer[0]!.should.equal(Ber.Boolean);
      buffer[1]!.should.equal(0x01);
      buffer[2]!.should.equal(0xff);
    });

    it('should write false', () => {
      const writer = new BerWriter();
      writer.writeBoolean(false);
      const buffer = writer.buffer;
      buffer.length.should.equal(3);
      buffer[0]!.should.equal(Ber.Boolean);
      buffer[1]!.should.equal(0x01);
      buffer[2]!.should.equal(0x00);
    });
  });

  describe('#writeNull()', () => {
    it('should write null', () => {
      const writer = new BerWriter();
      writer.writeNull();
      const buffer = writer.buffer;
      buffer.length.should.equal(2);
      buffer[0]!.should.equal(Ber.Null);
      buffer[1]!.should.equal(0x00);
    });
  });

  describe('#writeEnumeration()', () => {
    it('should write enumeration', () => {
      const writer = new BerWriter();
      writer.writeEnumeration(0x20);
      const buffer = writer.buffer;
      buffer.length.should.equal(3);
      buffer[0]!.should.equal(Ber.Enumeration);
      buffer[1]!.should.equal(0x01);
      buffer[2]!.should.equal(0x20);
    });
  });

  describe('#writeString()', () => {
    it('should write string', () => {
      const writer = new BerWriter();
      writer.writeString('hello world');
      const buffer = writer.buffer;
      buffer.length.should.equal(13);
      buffer[0]!.should.equal(Ber.OctetString);
      buffer[1]!.should.equal(11);
      buffer.subarray(2).toString().should.equal('hello world');
    });

    it('should write empty string', () => {
      const writer = new BerWriter();
      writer.writeString('');
      const buffer = writer.buffer;
      buffer.length.should.equal(2);
      buffer[0]!.should.equal(Ber.OctetString);
      buffer[1]!.should.equal(0);
    });

    it('should write string with custom tag', () => {
      const writer = new BerWriter();
      writer.writeString('test', 0x80);
      const buffer = writer.buffer;
      buffer[0]!.should.equal(0x80);
    });

    it('should throw on non-string', () => {
      const writer = new BerWriter();
      (() => writer.writeString(123 as unknown as string)).should.throw(TypeError);
    });
  });

  describe('#writeBuffer()', () => {
    it('should write buffer with tag', () => {
      const writer = new BerWriter();
      writer.writeBuffer(Buffer.from([0x04, 0x05, 0x06]), 0x04);
      const buffer = writer.buffer;
      buffer.length.should.equal(5);
      buffer[0]!.should.equal(0x04);
      buffer[1]!.should.equal(0x03);
      buffer.subarray(2).should.deep.equal(Buffer.from([0x04, 0x05, 0x06]));
    });

    it('should throw on non-buffer', () => {
      const writer = new BerWriter();
      (() => writer.writeBuffer('test' as unknown as Buffer, 0x04)).should.throw(TypeError);
    });
  });

  describe('#writeStringArray()', () => {
    it('should write array of strings', () => {
      const writer = new BerWriter();
      writer.writeStringArray(['hello', 'world']);
      const buffer = writer.buffer;

      const reader = new BerReader(buffer);
      reader.readString()!.should.equal('hello');
      reader.readString()!.should.equal('world');
    });
  });

  describe('#writeOID()', () => {
    it('should write OID', () => {
      const writer = new BerWriter();
      writer.writeOID('1.2.840.113549.1.1.1');
      const buffer = writer.buffer;

      const reader = new BerReader(buffer);
      reader.readOID()!.should.equal('1.2.840.113549.1.1.1');
    });

    it('should throw on invalid OID', () => {
      const writer = new BerWriter();
      (() => writer.writeOID('1.2')).should.throw(Error, 'not a valid OID');
    });
  });

  describe('#startSequence() / #endSequence()', () => {
    it('should write simple sequence', () => {
      const writer = new BerWriter();
      writer.startSequence();
      writer.writeBoolean(true);
      writer.endSequence();

      const buffer = writer.buffer;
      buffer[0]!.should.equal(Ber.Sequence | Ber.Constructor);

      const reader = new BerReader(buffer);
      reader.readSequence()!.should.equal(0x30);
      reader.readBoolean()!.should.equal(true);
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
      reader.readSequence()!.should.equal(0x30);
      reader.readSequence()!.should.equal(0x30);
      reader.readString()!.should.equal('hello');
    });

    it('should write sequence with custom tag', () => {
      const writer = new BerWriter();
      writer.startSequence(0x60);
      writer.writeInt(3);
      writer.endSequence();

      const buffer = writer.buffer;
      buffer[0]!.should.equal(0x60);
    });

    it('should throw on endSequence without startSequence', () => {
      const writer = new BerWriter();
      (() => writer.endSequence()).should.throw(InvalidAsn1Error, 'No sequence to end');
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

      reader.readSequence()!.should.equal(0x30);
      reader.readInt()!.should.equal(1);
      reader.readSequence()!.should.equal(0x60);
      reader.readInt()!.should.equal(3);
      reader.readString()!.should.equal('');
      reader.readByte()!.should.equal(0x80);
      reader.readByte()!.should.equal(0x00);
    });
  });

  describe('buffer growth', () => {
    it('should automatically resize buffer when needed', () => {
      const writer = new BerWriter({ size: 8 });
      writer.writeString('this is a longer string that exceeds initial buffer');
      const buffer = writer.buffer;
      buffer.length.should.be.greaterThan(8);
    });
  });

  describe('length encoding', () => {
    it('should use short form for length <= 127', () => {
      const writer = new BerWriter();
      writer.writeString('a'.repeat(127));
      const buffer = writer.buffer;
      buffer[1]!.should.equal(127);
    });

    it('should use long form with 1 byte for length 128-255', () => {
      const writer = new BerWriter();
      writer.writeString('a'.repeat(128));
      const buffer = writer.buffer;
      buffer[1]!.should.equal(0x81);
      buffer[2]!.should.equal(128);
    });

    it('should use long form with 2 bytes for length 256-65535', () => {
      const writer = new BerWriter();
      writer.writeString('a'.repeat(256));
      const buffer = writer.buffer;
      buffer[1]!.should.equal(0x82);
      buffer[2]!.should.equal(0x01);
      buffer[3]!.should.equal(0x00);
    });
  });

  describe('round-trip tests', () => {
    it('should round-trip integers', () => {
      const values = [0, 1, 127, 128, 255, 256, 65535, 65536, -1, -128, -129, -32768];
      for (const value of values) {
        const writer = new BerWriter();
        writer.writeInt(value);
        const reader = new BerReader(writer.buffer);
        reader.readInt()!.should.equal(value, `Failed for value ${value}`);
      }
    });

    it('should round-trip strings', () => {
      const strings = ['', 'hello', 'a'.repeat(127), 'b'.repeat(128), 'c'.repeat(256)];
      for (const str of strings) {
        const writer = new BerWriter();
        writer.writeString(str);
        const reader = new BerReader(writer.buffer);
        reader.readString()!.should.equal(str);
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

      reader.readSequence()!.should.equal(0x30);
      reader.readInt()!.should.equal(42);
      reader.readSequence()!.should.equal(0x63);
      reader.readString()!.should.equal('dc=example,dc=com');
      reader.readEnumeration()!.should.equal(2);
      reader.readEnumeration()!.should.equal(0);
      reader.readInt()!.should.equal(0);
      reader.readInt()!.should.equal(0);
      reader.readBoolean()!.should.equal(false);
      reader.readString()!.should.equal('(objectClass=*)');
    });
  });
});
