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

    packet.skip(10);
    expect(packet.offset).toBe(10);
  });

  it('supports node buffers', () => {
    const packet = new Packet(Buffer.alloc(10).buffer);
    expect(packet.byteLength).toBe(10);
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

  it('encodes and decodes a packet', () => {
    const packet = new Packet(5);
    packet.writeString('Hello');
    packet.appendString(' World!');

    const encoded = Packet.encode(packet);
    const decoded = Packet.decode(encoded);

    expect(decoded.toString()).toBe(packet.toString());
    expect(decoded.byteLength).toBe(packet.byteLength);

    expect(decoded.toDataView()).toEqual(packet.toDataView());
  });
});
