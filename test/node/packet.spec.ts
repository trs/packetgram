import { describe, it, expect } from 'vitest';

import Packet from '../../src/packet';

describe('Node', () => {
  it('keeps track of offset as data is read', () => {
    const packet = Packet.alloc(52);
    expect(packet.offset).toBe(0);

    packet.readSByte();
    expect(packet.offset).toBe(1);

    packet.readByte();
    expect(packet.offset).toBe(2);

    packet.readInt16();
    expect(packet.offset).toBe(4);

    packet.readUInt16();
    expect(packet.offset).toBe(6);

    packet.readInt32();
    expect(packet.offset).toBe(10);

    packet.readUInt32();
    expect(packet.offset).toBe(14);

    packet.readInt64();
    expect(packet.offset).toBe(22);

    packet.readUInt64();
    expect(packet.offset).toBe(30);

    packet.readFloat();
    expect(packet.offset).toBe(34);

    packet.readDouble();
    expect(packet.offset).toBe(42);

    packet.readString(10);
    expect(packet.offset).toBe(52);
  });

  it('readBytes returns bytes and advances offset', () => {
    const packet = Packet.alloc(6);
    packet.writeByte(0x01);
    packet.writeByte(0x02);
    packet.writeByte(0x03);
    packet.writeByte(0x04);
    packet.writeByte(0x05);
    packet.writeByte(0x06);
    packet.offset = 0;

    const first = packet.readBytes(3);
    expect(first).toBeInstanceOf(Uint8Array);
    expect(first.length).toBe(3);
    expect(Array.from(first)).toEqual([0x01, 0x02, 0x03]);
    expect(packet.offset).toBe(3);

    const second = packet.readBytes(3);
    expect(second.length).toBe(3);
    expect(Array.from(second)).toEqual([0x04, 0x05, 0x06]);
    expect(packet.offset).toBe(6);
  });

  it('keeps track of offset as data is written', () => {
    const packet = Packet.alloc(52);
    expect(packet.offset).toBe(0);

    packet.writeSByte(0);
    expect(packet.offset).toBe(1);

    packet.writeByte(0);
    expect(packet.offset).toBe(2);

    packet.writeInt16(0);
    expect(packet.offset).toBe(4);

    packet.writeUInt16(0);
    expect(packet.offset).toBe(6);

    packet.writeInt32(0);
    expect(packet.offset).toBe(10);

    packet.writeUInt32(0);
    expect(packet.offset).toBe(14);

    packet.writeInt64(BigInt(0));
    expect(packet.offset).toBe(22);

    packet.writeUInt64(BigInt(0));
    expect(packet.offset).toBe(30);

    packet.writeFloat(0);
    expect(packet.offset).toBe(34);

    packet.writeDouble(0);
    expect(packet.offset).toBe(42);

    packet.writeString('helloworld');
    expect(packet.offset).toBe(52);
  });

  it('skips offset', () => {
    const packet = Packet.alloc(10);
    expect(packet.offset).toBe(0);

    packet.skip(1);
    expect(packet.offset).toBe(1);

    packet.skip(2, 'current');
    expect(packet.offset).toBe(3);

    packet.skip(1, 'begin');
    expect(packet.offset).toBe(1);

    packet.skip(1, 'end');
    expect(packet.offset).toBe(9);
  });
  
  it('supports node buffers', () => {
    const packet = new Packet(Buffer.alloc(10).buffer);
    expect(packet.byteLength).toBe(10);
  });

  it('respects the byte range of views, including pooled node buffers', () => {
    // Buffer.from uses Node's shared 8 KB pool, so .buffer is much larger than the data
    const pooled = Buffer.from([1, 2, 3]);
    const packet = new Packet(pooled);
    expect(packet.byteLength).toBe(3);
    expect(Array.from(packet.readBytes(3))).toEqual([1, 2, 3]);

    const fromView = Packet.from(new Uint8Array([9, 8, 7, 6]).subarray(1), 1, 2);
    expect(Array.from(fromView.readBytes(2))).toEqual([7, 6]);

    const fromDataView = Packet.from(new DataView(new Uint8Array([5, 4, 3]).buffer, 1));
    expect(fromDataView.byteLength).toBe(2);
    expect(fromDataView.readByte()).toBe(4);
  });

  it('copies input data instead of sharing it', () => {
    const source = new Uint8Array([1, 2, 3]);
    const packet = Packet.from(source);
    source[0] = 99;
    expect(packet.readByte()).toBe(1);
  });

  it('readBytes returns a copy', () => {
    const packet = Packet.alloc(2);
    const bytes = packet.readBytes(2);
    packet.offset = 0;
    packet.writeByte(0xff);
    expect(bytes[0]).toBe(0);
  });

  it('throws RangeError and keeps the offset when string/byte access is out of bounds', () => {
    const packet = Packet.alloc(3);

    expect(() => packet.writeString('hello')).toThrow(RangeError);
    expect(packet.offset).toBe(0);
    expect(Array.from(packet.readBytes(3))).toEqual([0, 0, 0]);

    packet.offset = 1;
    expect(() => packet.readString(5)).toThrow(RangeError);
    expect(packet.offset).toBe(1);

    expect(() => packet.readBytes(5)).toThrow(RangeError);
    expect(packet.offset).toBe(1);

    expect(() => packet.readBytes(-1)).toThrow(RangeError);

    // Exactly filling the remaining space is allowed
    expect(packet.readString(2)).toBe('\0\0');
    expect(packet.offset).toBe(3);
  });

  it('grows to make room', () => {
    const packet = new Packet(5).useEndianness('LE');
    packet.appendSByte(-1);
    packet.appendByte(1);
    packet.appendInt16(-2);
    packet.appendUInt16(2);
    packet.appendInt32(-3);
    packet.appendUInt32(3);
    packet.appendString('Hi')

    expect(packet.offset).toBe(16);
    expect(packet.byteLength).toBe(16);

    packet.offset = 0;

    expect(packet.readSByte()).toBe(-1);
    expect(packet.readByte()).toBe(1);
    expect(packet.readInt16()).toBe(-2);
    expect(packet.readUInt16()).toBe(2);
    expect(packet.readInt32()).toBe(-3);
    expect(packet.readUInt32()).toBe(3);
    expect(packet.readString(2)).toBe('Hi');
  })

  it('grows large packets without exposing spare capacity', () => {
    const packet = Packet.alloc(200);
    packet.offset = 200;

    packet.appendByte(1);
    expect(packet.byteLength).toBe(201);
    expect(packet.toDataView().byteLength).toBe(201);
    expect(Packet.decode(Packet.encode(packet)).byteLength).toBe(201);
    expect(() => packet.readUInt32()).toThrow(RangeError);

    // Further appends reuse the spare capacity and keep earlier data
    packet.appendUInt16(0x0203);
    packet.appendString('ok');
    expect(packet.byteLength).toBe(205);

    packet.offset = 200;
    expect(Array.from(packet.readBytes(5))).toEqual([1, 2, 3, 0x6f, 0x6b]);
  });

  it('returns a hex dump of the packet', () => {
    const packet = new Packet(23);
    packet.writeUInt16(42);
    packet.writeUInt32(420);
    packet.writeUInt16(69);
    packet.writeUInt16(101);
    packet.writeString('hello world');

    const dump = packet.toString();

    expect(dump).toBe(`00000000  00 2a 00 00 01 a4 00 45  00 65 68 65 6c 6c 6f 20  | .*.....E.ehello  |
00000010  77 6f 72 6c 64 00 00                              | world..          |`)
  });

  it('defaults to utf8 and reads and writes strings by byte length', () => {
    const text = 'héllo €';
    const byteLength = Packet.byteLength(text);
    expect(byteLength).toBe(10);
    expect(Packet.byteLength('héllo', 'latin1')).toBe(5);
    expect(() => Packet.byteLength(text, 'latin1')).toThrow(RangeError);

    const packet = new Packet();
    expect(packet.encoding).toBe('utf8');
    packet.appendString(text);
    expect(packet.byteLength).toBe(byteLength);
    expect(packet.offset).toBe(byteLength);

    packet.offset = 0;
    expect(packet.readString(byteLength)).toBe(text);
  });

  it('keeps a leading byte order mark when reading utf8', () => {
    const packet = new Packet().appendString('﻿abc');
    expect(packet.byteLength).toBe(6);
    packet.offset = 0;
    expect(packet.readString(6)).toBe('﻿abc');
  });

  it('round-trips latin1 strings above ascii', () => {
    const packet = Packet.alloc(3).useEncoding('latin1');
    packet.writeString('éÿ\u0080');
    packet.offset = 0;
    expect(Array.from(packet.readBytes(3))).toEqual([0xe9, 0xff, 0x80]);
    packet.offset = 0;
    expect(packet.readString(3)).toBe('éÿ\u0080');
  });

  it('throws instead of truncating characters outside latin1', () => {
    const packet = Packet.alloc(4);
    expect(() => packet.writeString('a€', 'latin1')).toThrow(RangeError);
    expect(packet.offset).toBe(0);
    expect(() => packet.appendString('€', 'latin1')).toThrow(RangeError);
    expect(packet.byteLength).toBe(4);
  });

  it('throws on invalid utf8 when reading', () => {
    const packet = Packet.from(new Uint8Array([0xc3, 0x28]));
    expect(() => packet.readString(2, 'utf8')).toThrow(TypeError);
    expect(packet.offset).toBe(0);
  });

  it('writes and appends raw bytes', () => {
    const packet = Packet.alloc(2);
    packet.writeBytes(new Uint8Array([1, 2]));
    expect(() => packet.writeBytes(new Uint8Array([3]))).toThrow(RangeError);
    packet.appendBytes(new Uint8Array([3, 4]));
    expect(packet.byteLength).toBe(4);
    packet.offset = 0;
    expect(Array.from(packet.readBytes(4))).toEqual([1, 2, 3, 4]);
  });

  it('applies a per-call endianness without changing the packet default', () => {
    const packet = new Packet();
    packet.appendUInt16(0x0102, 'LE');
    packet.appendUInt16(0x0102);

    packet.offset = 0;
    expect(Array.from(packet.readBytes(4))).toEqual([0x02, 0x01, 0x01, 0x02]);

    packet.offset = 0;
    expect(packet.readUInt16('LE')).toBe(0x0102);
    expect(packet.readUInt16()).toBe(0x0102);

    packet.useEndianness('LE');
    packet.offset = 0;
    expect(packet.readUInt16()).toBe(0x0102);
    expect(packet.readUInt16('BE')).toBe(0x0102);

    packet.offset = 2;
    expect(packet.readUInt16()).toBe(0x0201);
  });

  it('uses the packet encoding for strings unless one is passed', () => {
    const packet = new Packet().useEncoding('utf8');
    packet.appendString('€');
    expect(packet.byteLength).toBe(3);

    packet.appendString('é', 'latin1');
    expect(packet.byteLength).toBe(4);

    packet.offset = 0;
    expect(packet.readString(3)).toBe('€');
    expect(packet.readString(1, 'latin1')).toBe('é');

    packet.offset = 3;
    expect(() => packet.readString(1)).toThrow(TypeError);

    packet.useEncoding('latin1');
    expect(() => packet.writeString('€')).toThrow(RangeError);
  });

  it('reads and writes number values at their limits', () => {
    const packet = new Packet();
    packet.appendSByte(-128).appendByte(255);
    packet.appendInt16(-32768).appendUInt16(65535);
    packet.appendInt32(-2147483648).appendUInt32(4294967295);
    packet.appendInt64(-(BigInt(2) ** BigInt(63))).appendUInt64(BigInt(2) ** BigInt(64) - BigInt(1));
    packet.appendFloat(1.5).appendDouble(Math.PI);

    packet.offset = 0;
    expect(packet.readSByte()).toBe(-128);
    expect(packet.readByte()).toBe(255);
    expect(packet.readInt16()).toBe(-32768);
    expect(packet.readUInt16()).toBe(65535);
    expect(packet.readInt32()).toBe(-2147483648);
    expect(packet.readUInt32()).toBe(4294967295);
    expect(packet.readInt64()).toBe(-(BigInt(2) ** BigInt(63)));
    expect(packet.readUInt64()).toBe(BigInt(2) ** BigInt(64) - BigInt(1));
    expect(packet.readFloat()).toBe(1.5);
    expect(packet.readDouble()).toBe(Math.PI);
  });

  it('uses little-endian byte order for 32 and 64-bit values', () => {
    const packet = new Packet().useEndianness('LE');
    packet.appendUInt32(0x01020304).appendUInt64(BigInt('0x0102030405060708'));
    expect(Array.from(packet.toUint8Array())).toEqual([4, 3, 2, 1, 8, 7, 6, 5, 4, 3, 2, 1]);

    packet.offset = 0;
    expect(packet.readUInt32()).toBe(0x01020304);
    expect(packet.readUInt64()).toBe(BigInt('0x0102030405060708'));
  });

  it('throws on integers that do not fit the type', () => {
    const packet = Packet.alloc(8);
    expect(() => packet.writeByte(256)).toThrow(RangeError);
    expect(() => packet.writeByte(-1)).toThrow(RangeError);
    expect(() => packet.writeByte(1.5)).toThrow(RangeError);
    expect(() => packet.writeSByte(128)).toThrow(RangeError);
    expect(() => packet.writeUInt16(-1)).toThrow(RangeError);
    expect(() => packet.writeInt16(32768)).toThrow(RangeError);
    expect(() => packet.writeUInt32(2 ** 32)).toThrow(RangeError);
    expect(() => packet.writeInt32(NaN)).toThrow(RangeError);
    expect(() => packet.writeUInt64(BigInt(-1))).toThrow(RangeError);
    expect(() => packet.writeInt64(BigInt(2) ** BigInt(63))).toThrow(RangeError);
    expect(() => packet.writeInt64(1 as unknown as bigint)).toThrow(TypeError);
    expect(packet.offset).toBe(0);

    const growing = new Packet();
    expect(() => growing.appendUInt16(65536)).toThrow(RangeError);
    expect(growing.byteLength).toBe(0);
  });

  it('throws and keeps the offset when a number read or write is out of bounds', () => {
    const packet = Packet.alloc(3);
    packet.offset = 1;
    expect(() => packet.readUInt32()).toThrow(RangeError);
    expect(() => packet.writeUInt32(1)).toThrow(RangeError);
    expect(packet.offset).toBe(1);
  });

  it('rejects offsets and lengths that are not non-negative integers', () => {
    const packet = Packet.alloc(4);

    packet.offset = NaN;
    expect(() => packet.readByte()).toThrow(RangeError);
    packet.offset = 0.5;
    expect(() => packet.readString(1)).toThrow(RangeError);
    packet.offset = 0;

    expect(() => packet.readBytes(NaN)).toThrow(RangeError);
    expect(() => packet.readBytes(1.5)).toThrow(RangeError);
    expect(() => packet.grow(-1)).toThrow(RangeError);
    expect(packet.offset).toBe(0);
  });

  it('validates skip and allows moving past the end', () => {
    const packet = Packet.alloc(4);
    expect(() => packet.skip(-1)).toThrow(RangeError);
    expect(() => packet.skip(5, 'end')).toThrow(RangeError);
    expect(() => packet.skip(undefined as unknown as number)).toThrow(RangeError);
    expect(() => packet.skip(1, 'middle' as 'begin')).toThrow(TypeError);
    expect(packet.offset).toBe(0);

    packet.skip(0, 'end');
    expect(packet.offset).toBe(4);

    packet.skip(2).appendByte(1);
    expect(Array.from(packet.toUint8Array())).toEqual([0, 0, 0, 0, 0, 0, 1]);
  });

  it('rejects unknown endianness and encoding values', () => {
    const packet = Packet.alloc(2);
    expect(() => packet.writeUInt16(1, 'le' as 'LE')).toThrow(TypeError);
    expect(() => packet.readUInt16('little' as 'LE')).toThrow(TypeError);
    expect(() => packet.useEndianness('le' as 'LE')).toThrow(TypeError);
    expect(() => packet.useEncoding('utf-8' as 'utf8')).toThrow(TypeError);
    expect(() => packet.readString(1, 'ascii' as 'utf8')).toThrow(TypeError);
    expect(() => Packet.byteLength('a', 'utf-8' as 'utf8')).toThrow(TypeError);
    expect(packet.offset).toBe(0);
    expect(packet.endianness).toBe('BE');
    expect(packet.encoding).toBe('utf8');
  });

  it('validates the byte range when creating from a buffer', () => {
    const source = new Uint8Array([1, 2]);
    expect(() => Packet.from(source, -1)).toThrow(RangeError);
    expect(() => Packet.from(source, 3)).toThrow(RangeError);
    expect(() => Packet.from(source, 0, 3)).toThrow(RangeError);
    expect(() => Packet.from(source, 0, -1)).toThrow(RangeError);
    expect(Packet.from(source, 2).byteLength).toBe(0);
    expect(Array.from(Packet.from(source, 1).toUint8Array())).toEqual([2]);
  });

  it('writes bytes from any buffer or typed array', () => {
    const packet = new Packet();
    packet.appendBytes(new Uint8Array([1, 2]).buffer);
    packet.appendBytes(new Uint16Array([0x0102]));
    packet.appendBytes(new DataView(new Uint8Array([9, 3]).buffer, 1));
    expect(packet.byteLength).toBe(5);

    const expected = [1, 2, ...new Uint8Array(new Uint16Array([0x0102]).buffer), 3];
    expect(Array.from(packet.toUint8Array())).toEqual(expected);
  });

  it('returns copies from toUint8Array and toDataView', () => {
    const packet = Packet.alloc(2);
    const bytes = packet.toUint8Array();
    const view = packet.toDataView();
    packet.writeByte(0xff);
    expect(bytes[0]).toBe(0);
    expect(view.getUint8(0)).toBe(0);
  });

  it('dumps an empty packet and exactly one full line', () => {
    expect(new Packet().toString()).toBe('');

    const packet = new Packet().appendString('0123456789abcdef');
    expect(packet.toString()).toBe(
      '00000000  30 31 32 33 34 35 36 37  38 39 61 62 63 64 65 66  | 0123456789abcdef |'
    );
  });

  it('encodes and decodes large packets', () => {
    const bytes = new Uint8Array(20000);
    for (let i = 0; i < bytes.length; i++) bytes[i] = i % 256;

    const encoded = Packet.encode(Packet.from(bytes));
    expect(encoded).toBe(Buffer.from(bytes).toString('base64'));
    expect(Array.from(Packet.decode(encoded).toUint8Array())).toEqual(Array.from(bytes));
  });

  it('throws when decoding invalid base64', () => {
    expect(() => Packet.decode('not base64!')).toThrow();
  });

  it('encodes and decodes a packet', () => {
    const packet = new Packet(5);
    packet.writeString('Hello');
    packet.appendString(' World!');

    const encoded = Packet.encode(packet);
    const decoded = Packet.decode(encoded);

    expect(decoded.toString()).toBe(packet.toString());
    expect(decoded.byteLength).toBe(packet.byteLength);

    expect(new Uint8Array(decoded.toDataView().buffer)).toEqual(new Uint8Array(packet.toDataView().buffer));
  });
});
