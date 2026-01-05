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

// Write various data types (little-endian by default)
packet.writeUInt32LE(42);
packet.writeString('Hello');
packet.writeFloatLE(3.14);

// Or use append methods that automatically grow the buffer
const dynamicPacket = new Packet(5);
dynamicPacket.appendUInt32LE(100);
dynamicPacket.appendString(' World!');
```

### Reading Data

```javascript
const packet = Packet.alloc(20);
packet.writeUInt32LE(42);
packet.writeString('Hello');

// Reset offset to read from the beginning
packet.offset = 0;

const number = packet.readUInt32LE();  // 42
const text = packet.readString(5);     // 'Hello'
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

### Dumping Packet Contents

```javascript
const packet = Packet.alloc(20);
packet.writeUInt16BE(42);
packet.writeUInt32BE(420);
packet.writeString('hello');

// Get a hex dump of the packet
console.log(packet.toString());
// Output:
// 00000000  00 2a 00 00 01 a4 68 65  6c 6c 6f 00 00 00 00 00  | .*....hello..... |
// 00000010  00 00 00 00                                       | ....             |
```

