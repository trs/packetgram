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

  it('writes and reads utf8 strings by byte length', () => {
    const text = 'héllo €';
    const byteLength = Packet.byteLength(text, 'utf8');
    expect(byteLength).toBe(10);
    expect(Packet.byteLength(text)).toBe(7);

    const packet = new Packet();
    packet.appendString(text, 'utf8');
    expect(packet.byteLength).toBe(byteLength);
    expect(packet.offset).toBe(byteLength);

    packet.offset = 0;
    expect(packet.readString(byteLength, 'utf8')).toBe(text);
  });

  it('round-trips latin1 strings above ascii', () => {
    const packet = Packet.alloc(3);
    packet.writeString('éÿ');
    packet.offset = 0;
    expect(Array.from(packet.readBytes(3))).toEqual([0xe9, 0xff, 0x80]);
    packet.offset = 0;
    expect(packet.readString(3)).toBe('éÿ');
  });

  it('throws instead of truncating characters outside latin1', () => {
    const packet = Packet.alloc(4);
    expect(() => packet.writeString('a€')).toThrow(RangeError);
    expect(packet.offset).toBe(0);
    expect(() => packet.appendString('€')).toThrow(RangeError);
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
