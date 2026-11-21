// Type-checks and runs the published CommonJS entry point (package self-reference)
import Packet = require('packetgram');
import assert = require('node:assert/strict');

const endianness: Packet.Endianness = 'LE';
const encoding: Packet.StringEncoding = 'utf8';

const packet: Packet = Packet.alloc(2).useEndianness(endianness).useEncoding(encoding);
packet.writeUInt16(0x0102);
assert.deepEqual(Array.from(packet.toUint8Array()), [0x02, 0x01]);
assert.equal(typeof Packet, 'function');

console.log('CommonJS consumer OK');
