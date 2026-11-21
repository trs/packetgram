# `packetgram`

> `packet` + `datagram`

## Install

```sh
npm install packetgram
```

## Quick Start

### Creating a Packet

```javascript
import Packet from 'packetgram';

// Allocate a new packet with a specific size
const packet = Packet.alloc(10);

// Or create from a copy of an existing ArrayBuffer, typed array or Node Buffer
const copy = Packet.from(new Uint8Array([1, 2, 3]));

// Optionally copy only a byte range of it
const part = Packet.from(new Uint8Array([1, 2, 3]), 1, 2); // bytes [2, 3]
```

CommonJS works too:

```javascript
const Packet = require('packetgram');
```

### Writing Data

```javascript
const packet = Packet.alloc(20);

// Write various data types (big-endian by default)
packet.writeUInt32(42);
packet.writeString('Hello');
packet.writeFloat(3.14);

// Or use append methods that automatically grow the buffer
const dynamicPacket = new Packet(5);
dynamicPacket.appendUInt32(100);
dynamicPacket.appendString(' World!');
```

### Reading Data

```javascript
const packet = Packet.alloc(20);
packet.writeUInt32(42);
packet.writeString('Hello');

// Reset offset to read from the beginning
packet.offset = 0;

const number = packet.readUInt32();  // 42
const text = packet.readString(5);   // 'Hello'
```

### Encoding/Decoding

```javascript
const packet = Packet.alloc(10);
packet.writeString('Hello');

// Encode to base64
const encoded = Packet.encode(packet);

// Decode from base64
const decoded = Packet.decode(encoded);
```

### Strings and Bytes

```javascript
// Strings default to utf8. Lengths are always in bytes, not characters.
const packet = new Packet();
const text = 'héllo €';
const length = Packet.byteLength(text); // 10
packet.appendUInt16(length);
packet.appendString(text);

packet.offset = 0;
packet.readString(packet.readUInt16()); // 'héllo €'

// latin1 uses 1 byte per character (U+0000 to U+00FF).
// Characters outside that range throw a RangeError instead of being truncated.
packet.appendString('é', 'latin1');

// Or change the packet's default encoding; a per-call encoding still overrides it
packet.useEncoding('latin1');
packet.appendString('é');
packet.appendString('€', 'utf8');

// Raw bytes from any ArrayBuffer, typed array or Node Buffer
packet.appendBytes(new Uint8Array([1, 2, 3]));

// readBytes and toUint8Array return copies
const bytes = packet.toUint8Array();
```

### Moving the Offset

```javascript
const packet = Packet.alloc(10);

packet.skip(2);           // forward 2 bytes from the current offset
packet.skip(4, 'begin');  // to offset 4
packet.skip(4, 'end');    // to 4 bytes before the end (offset 6)

// The offset may move past the end; the next append fills the gap with zeros
packet.skip(0, 'end').skip(2).appendByte(1); // packet is now 13 bytes
```

### Errors

Mistakes throw instead of silently corrupting data, and a failed read or write leaves the offset unchanged:

- Reading or writing past the end of the packet throws a `RangeError`. Use the `append*` methods to grow the packet as you write.
- Integers that don't fit the type, such as `writeByte(256)`, throw a `RangeError`.
- Offsets and lengths must be non-negative integers.
- Unknown endianness or encoding values, such as `'le'` or `'utf-8'`, throw a `TypeError`.
- Invalid UTF-8 and invalid base64 throw when read or decoded.

### Endianness

```javascript
const packet = Packet.alloc(20);

// Default is big-endian (BE)
packet.writeUInt16(42);
packet.writeUInt32(420);

// Switch to little-endian
packet.useEndianness('LE');
packet.writeUInt16(42);
packet.writeUInt32(420);

// Switch back to big-endian
packet.useEndianness('BE');

// Or pass a byte order to a single read or write; the packet default is unchanged
packet.writeUInt16(42, 'LE');
```

### Dumping Packet Contents

```javascript
const packet = Packet.alloc(20);
packet.writeUInt16(42);
packet.writeUInt32(420);
packet.writeString('hello');

// Get a hex dump of the packet
console.log(packet.toString());
// Output:
// 00000000  00 2a 00 00 01 a4 68 65  6c 6c 6f 00 00 00 00 00  | .*....hello..... |
// 00000010  00 00 00 00                                       | ....             |
```
