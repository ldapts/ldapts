/*
declare enum BerType {
  EOC = 0,
  Boolean = 1,
  Integer = 2,
  BitString = 3,
  OctetString = 4,
  Null = 5,
  OID = 6,
  ObjectDescriptor = 7,
  External = 8,
  Real = 9, // float
  Enumeration = 10,
  PDV = 11,
  Utf8String = 12,
  RelativeOID = 13,
  Sequence = 16,
  Set = 17,
  NumericString = 18,
  PrintableString = 19,
  T61String = 20,
  VideotexString = 21,
  IA5String = 22,
  UTCTime = 23,
  GeneralizedTime = 24,
  GraphicString = 25,
  VisibleString = 26,
  GeneralString = 28,
  UniversalString = 29,
  CharacterString = 30,
  BMPString = 31,
  Constructor = 32,
  Context = 128,
}

*/
declare module 'asn1' {
  export class BerReader {
    public readonly buffer: Buffer;
    public readonly offset: number;
    public readonly length: number;
    public readonly remain: number;
    public readonly _buf: Buffer;
    public _size: number;
    public _offset: number;

    constructor(data: Buffer);

    public peek(): number | null;

    public readBoolean(): any;

    public readByte(peek: boolean): number | null;

    public readEnumeration(): number;

    public readInt(): number;

    public readLength(offset?: number): number;

    public readOID(tag?: number): string;

    public readSequence(tag?: number): number | null;

    public readString(tag?: number): string;

    public readString(tag: number, retbuf: boolean): Buffer;

    public _readTag(tag?: number): number;
  }

  export class BerWriter {
    public readonly buffer: Buffer;
    public readonly _buf: Buffer;
    public readonly _size: number;
    public _offset: number;

    constructor(options?: {
      size: number;
      growthFactor: number;
    });

    public endSequence(): void;

    public startSequence(tag?: number): void;

    public writeBoolean(b: boolean, tag?: number): void;

    public writeBuffer(buf: Buffer, tag: number): void;

    public writeByte(b: number): void;

    public writeEnumeration(i: number, tag?: number): void;

    public writeInt(i: number, tag?: number): void;

    public writeLength(len: number): void;

    public writeNull(): void;

    public writeOID(s: string, tag: number): void;

    public writeString(s: string, tag?: number): void;

    public writeStringArray(strings: string[]): void;

    public _ensure(length: number): void;
  }

  export namespace Ber {
    const BMPString: number;

    const BitString: number;

    const Boolean: number;

    const CharacterString: number;

    const Constructor: number;

    const Context: number;

    const EOC: number;

    const Enumeration: number;

    const External: number;

    const GeneralString: number;

    const GeneralizedTime: number;

    const GraphicString: number;

    const IA5String: number;

    const Integer: number;

    const Null: number;

    const NumericString: number;

    const OID: number;

    const ObjectDescriptor: number;

    const OctetString: number;

    const PDV: number;

    const PrintableString: number;

    const Real: number;

    const RelativeOID: number;

    const Sequence: number;

    const Set: number;

    const T61String: number;

    const UTCTime: number;

    const UniversalString: number;

    const Utf8String: number;

    const VideotexString: number;

    const VisibleString: number;
  }
}
