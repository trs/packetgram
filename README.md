# `packetgram`

> `packet` + `datagram`

## Install

```
npm install packetgram
```

_or_

```
yarn add packetgram
```

## Quick Start

### Creating a Packet

```javascript
import Packet from 'packetgram';

// Allocate a new packet with a specific size
const packet = Packet.alloc(10);

// Or create from an existing ArrayBuffer
const buffer = new ArrayBuffer(10);
const packet = Packet.from(buffer);
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
// Strings default to latin1 (1 byte per character, U+0000 to U+00FF).
// Characters outside that range throw a RangeError instead of being truncated.
const packet = new Packet();
packet.appendString('héllo');

// Use 'utf8' for any Unicode text. Lengths are always in bytes, not characters.
const text = 'héllo €';
const length = Packet.byteLength(text, 'utf8'); // 10
packet.appendUInt16(length);
packet.appendString(text, 'utf8');

packet.offset = 5;
packet.readString(packet.readUInt16(), 'utf8'); // 'héllo €'

// Raw bytes (readBytes returns a copy)
packet.appendBytes(new Uint8Array([1, 2, 3]));
```

Reading or writing past the end of the packet throws a `RangeError` and leaves the offset unchanged. Use the `append*` methods to grow the packet as you write.

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

