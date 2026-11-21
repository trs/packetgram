// Type-checks and runs the published ES module entry point (package self-reference)
import Packet, { type Endianness, type StringEncoding } from 'packetgram';
import assert from 'node:assert/strict';

const endianness: Endianness = 'LE';
const encoding: StringEncoding = 'utf8';

const packet: Packet = Packet.alloc(2).useEndianness(endianness).useEncoding(encoding);
packet.writeUInt16(0x0102);
assert.deepEqual(Array.from(packet.toUint8Array()), [0x02, 0x01]);

console.log('ES module consumer OK');
