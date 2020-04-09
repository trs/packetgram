import Packet from './packet';

describe('Packet', () => {
  it('keeps track of offset as data is read', () => {
    const packet = Packet.alloc(52);
    expect(packet.offset).toBe(0);

    packet.readSByte();
    expect(packet.offset).toBe(1);

    packet.readByte();
    expect(packet.offset).toBe(2);

    packet.readInt16BE();
    expect(packet.offset).toBe(4);

    packet.readUInt16BE();
    expect(packet.offset).toBe(6);

    packet.readInt32BE();
    expect(packet.offset).toBe(10);

    packet.readUInt32BE();
    expect(packet.offset).toBe(14);

    packet.readInt64BE();
    expect(packet.offset).toBe(22);

    packet.readUInt64BE();
    expect(packet.offset).toBe(30);

    packet.readFloatBE();
    expect(packet.offset).toBe(34);

    packet.readDoubleBE();
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

    packet.writeInt16BE(0);
    expect(packet.offset).toBe(4);

    packet.writeUInt16BE(0);
    expect(packet.offset).toBe(6);

    packet.writeInt32BE(0);
    expect(packet.offset).toBe(10);

    packet.writeUInt32BE(0);
    expect(packet.offset).toBe(14);

    packet.writeInt64BE(BigInt(0));
    expect(packet.offset).toBe(22);

    packet.writeUInt64BE(BigInt(0));
    expect(packet.offset).toBe(30);

    packet.writeFloatBE(0);
    expect(packet.offset).toBe(34);

    packet.writeDoubleBE(0);
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
});
