export type StringEncoding = 'latin1' | 'utf8';
export type Endianness = 'BE' | 'LE';

const utf8Encoder = new TextEncoder();
// fatal: invalid UTF-8 throws instead of silently becoming U+FFFD
const utf8Decoder = new TextDecoder('utf-8', { fatal: true });

export default class Packet {
  private bytes: Uint8Array;
  private view: DataView;
  private littleEndian: boolean = false;
  private encoding: StringEncoding = 'latin1';

  public offset: number = 0;

  public constructor(size?: number)
  public constructor(data: ArrayBufferLike | ArrayBufferView, offset?: number, length?: number)
  public constructor(dataOrSize?: number | ArrayBufferLike | ArrayBufferView, offset?: number, length?: number) {
    if (typeof dataOrSize === 'undefined') {
      this.bytes = new Uint8Array(0);
    } else if (typeof dataOrSize === 'number') {
      this.bytes = new Uint8Array(dataOrSize);
    } else {
      // `offset` and `length` are relative to the view, not its underlying buffer
      const source = ArrayBuffer.isView(dataOrSize)
        ? new Uint8Array(dataOrSize.buffer, dataOrSize.byteOffset, dataOrSize.byteLength)
        : new Uint8Array(dataOrSize);
      const start = offset ?? 0;
      const end = length !== undefined ? start + length : undefined;
      // slice(), not subarray(), so the packet never shares memory with the caller
      this.bytes = source.slice(start, end);
    }
    this.view = new DataView(this.bytes.buffer, this.bytes.byteOffset, this.bytes.byteLength);
  }

  // Static

  /** Number of bytes `text` takes in the given encoding (useful for length prefixes) */
  public static byteLength(text: string, encoding: StringEncoding = 'latin1') {
    return encoding === 'utf8' ? utf8Encoder.encode(text).length : text.length;
  }

  private static encodeString(text: string, encoding: StringEncoding): Uint8Array {
    if (encoding === 'utf8') return utf8Encoder.encode(text);

    const bytes = new Uint8Array(text.length);
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      if (code > 0xff) {
        throw new RangeError(
          `Character U+${code.toString(16).padStart(4, '0')} at index ${i} is not representable in latin1`
        );
      }
      bytes[i] = code;
    }
    return bytes;
  }

  /** Allocate a new buffer with the given size. */
  public static alloc(size?: number) {
    return new Packet(size);
  }

  /** Create a packet from a copy of the given buffer or view. */
  public static from(data: ArrayBufferLike | ArrayBufferView, offset?: number, length?: number) {
    return new Packet(data, offset, length);
  }

  public static encode(packet: Packet): string {
    const bytes = packet.bytes;
    
    // Use btoa in browser, Buffer in Node.js
    if (typeof btoa !== 'undefined') {
      const chunkSize = 8192;
      if (bytes.length <= chunkSize) {
        const chars: string[] = new Array(bytes.length);
        for (let i = 0; i < bytes.length; i++) {
          chars[i] = String.fromCharCode(bytes[i]);
        }
        return btoa(chars.join(''));
      } else {
        const chunks: string[] = [];
        for (let i = 0; i < bytes.length; i += chunkSize) {
          const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
          const chars: string[] = new Array(chunk.length);
          for (let j = 0; j < chunk.length; j++) {
            chars[j] = String.fromCharCode(chunk[j]);
          }
          chunks.push(chars.join(''));
        }
        return btoa(chunks.join(''));
      }
    } else if (typeof Buffer !== 'undefined') {
      return Buffer.from(bytes).toString('base64');
    } else {
      throw new Error('Base64 encoding not available in this environment');
    }
  }

  public static decode(base64: string): Packet {
    let bytes: Uint8Array;
    
    // Use atob in browser, Buffer in Node.js
    if (typeof atob !== 'undefined') {
      const binary = atob(base64);
      bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
    } else if (typeof Buffer !== 'undefined') {
      const buffer = Buffer.from(base64, 'base64');
      bytes = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    } else {
      throw new Error('Base64 decoding not available in this environment');
    }

    return new Packet(bytes);
  }

  // Read

  /** Read 1 byte from the current offset as a signed number */
  public readSByte() {
    const value = this.view.getInt8(this.offset);
    this.offset += 1;
    return value;
  }

  /** Read 2 bytes from the current offset as a signed number */
  public readInt16(): number;
  public readInt16(endianness: Endianness): number;
  public readInt16(endianness: Endianness = this.endianness): number {
    const value = this.view.getInt16(this.offset, endianness === 'LE');
    this.offset += 2;
    return value;
  }

  /** Read 4 bytes from the current offset as a signed number */
  public readInt32(): number;
  public readInt32(endianness: Endianness): number;
  public readInt32(endianness: Endianness = this.endianness): number {
    const value = this.view.getInt32(this.offset, endianness === 'LE');
    this.offset += 4;
    return value;
  }

  /** Read 8 bytes from the current offset as a signed bigint */
  public readInt64(): bigint;
  public readInt64(endianness: Endianness): bigint;
  public readInt64(endianness: Endianness = this.endianness): bigint {
    const value = this.view.getBigInt64(this.offset, endianness === 'LE');
    this.offset += 8;
    return value;
  }

  /** Read 1 byte from the current offset as an unsigned number */
  public readByte() {
    const value = this.view.getUint8(this.offset);
    this.offset += 1;
    return value;
  }

  /** Read 2 bytes from the current offset as an unsigned number */
  public readUInt16(): number;
  public readUInt16(endianness: Endianness): number;
  public readUInt16(endianness: Endianness = this.endianness): number {
    const value = this.view.getUint16(this.offset, endianness === 'LE');
    this.offset += 2;
    return value;
  }

  /** Read 4 bytes from the current offset as an unsigned number */
  public readUInt32(): number;
  public readUInt32(endianness: Endianness): number;
  public readUInt32(endianness: Endianness = this.endianness): number {
    const value = this.view.getUint32(this.offset, endianness === 'LE');
    this.offset += 4;
    return value;
  }

  /** Read 8 bytes from the current offset as an unsigned bigint */
  public readUInt64(): bigint;
  public readUInt64(endianness: Endianness): bigint;
  public readUInt64(endianness: Endianness = this.endianness): bigint {
    const value = this.view.getBigUint64(this.offset, endianness === 'LE');
    this.offset += 8;
    return value;
  }

  /** Read 8 bytes from the current offset as a double */
  public readDouble(): number;
  public readDouble(endianness: Endianness): number;
  public readDouble(endianness: Endianness = this.endianness): number {
    const value = this.view.getFloat64(this.offset, endianness === 'LE');
    this.offset += 8;
    return value;
  }

  /** Read 4 bytes from the current offset as a float */
  public readFloat(): number;
  public readFloat(endianness: Endianness): number;
  public readFloat(endianness: Endianness = this.endianness): number {
    const value = this.view.getFloat32(this.offset, endianness === 'LE');
    this.offset += 4;
    return value;
  }

  /** Read `length` bytes (not characters) from the current offset as a string */
  public readString(length: number): string;
  public readString(length: number, encoding: StringEncoding): string;
  public readString(length: number, encoding: StringEncoding = this.encoding): string {
    this.checkBounds(length);
    const bytes = this.bytes.subarray(this.offset, this.offset + length);

    let text: string;
    if (encoding === 'utf8') {
      text = utf8Decoder.decode(bytes);
    } else {
      const chars: string[] = new Array(length);
      for (let i = 0; i < length; i++) {
        chars[i] = String.fromCharCode(bytes[i]);
      }
      text = chars.join('');
    }

    this.offset += length;
    return text;
  }

  /** Read any number of bytes from the current offset as a copy */
  public readBytes(length: number): Uint8Array {
    this.checkBounds(length);
    const bytes = this.bytes.slice(this.offset, this.offset + length);
    this.offset += length;
    return bytes;
  }

  // Write

  /** Write 1 signed byte to the current offset */
  public writeSByte(value: number) {
    this.view.setInt8(this.offset, value);
    this.offset += 1;
    return this;
  }

  /** Write 2 signed bytes to the current offset */
  public writeInt16(value: number): this;
  public writeInt16(value: number, endianness: Endianness): this;
  public writeInt16(value: number, endianness: Endianness = this.endianness): this {
    this.view.setInt16(this.offset, value, endianness === 'LE');
    this.offset += 2;
    return this;
  }

  /** Write 4 signed bytes to the current offset */
  public writeInt32(value: number): this;
  public writeInt32(value: number, endianness: Endianness): this;
  public writeInt32(value: number, endianness: Endianness = this.endianness): this {
    this.view.setInt32(this.offset, value, endianness === 'LE');
    this.offset += 4;
    return this;
  }

  /** Write 8 signed bytes to the current offset */
  public writeInt64(value: bigint): this;
  public writeInt64(value: bigint, endianness: Endianness): this;
  public writeInt64(value: bigint, endianness: Endianness = this.endianness): this {
    this.view.setBigInt64(this.offset, value, endianness === 'LE');
    this.offset += 8;
    return this;
  }

  /** Write 1 unsigned byte to the current offset */
  public writeByte(value: number) {
    this.view.setUint8(this.offset, value);
    this.offset += 1;
    return this;
  }

  /** Write 2 unsigned bytes to the current offset */
  public writeUInt16(value: number): this;
  public writeUInt16(value: number, endianness: Endianness): this;
  public writeUInt16(value: number, endianness: Endianness = this.endianness): this {
    this.view.setUint16(this.offset, value, endianness === 'LE');
    this.offset += 2;
    return this;
  }

  /** Write 4 unsigned bytes to the current offset */
  public writeUInt32(value: number): this;
  public writeUInt32(value: number, endianness: Endianness): this;
  public writeUInt32(value: number, endianness: Endianness = this.endianness): this {
    this.view.setUint32(this.offset, value, endianness === 'LE');
    this.offset += 4;
    return this;
  }

  /** Write 8 unsigned bytes to the current offset */
  public writeUInt64(value: bigint): this;
  public writeUInt64(value: bigint, endianness: Endianness): this;
  public writeUInt64(value: bigint, endianness: Endianness = this.endianness): this {
    this.view.setBigUint64(this.offset, value, endianness === 'LE');
    this.offset += 8;
    return this;
  }

  /** Write 8 bytes to the current offset as a double */
  public writeDouble(value: number): this;
  public writeDouble(value: number, endianness: Endianness): this;
  public writeDouble(value: number, endianness: Endianness = this.endianness): this {
    this.view.setFloat64(this.offset, value, endianness === 'LE');
    this.offset += 8;
    return this;
  }

  /** Write 4 bytes to the current offset as a float */
  public writeFloat(value: number): this;
  public writeFloat(value: number, endianness: Endianness): this;
  public writeFloat(value: number, endianness: Endianness = this.endianness): this {
    this.view.setFloat32(this.offset, value, endianness === 'LE');
    this.offset += 4;
    return this;
  }

  /** Write raw bytes to the current offset */
  public writeBytes(bytes: Uint8Array) {
    this.checkBounds(bytes.length);
    this.bytes.set(bytes, this.offset);
    this.offset += bytes.length;
    return this;
  }

  /** Write a string to the current offset */
  public writeString(text: string): this;
  public writeString(text: string, encoding: StringEncoding): this;
  public writeString(text: string, encoding: StringEncoding = this.encoding): this {
    return this.writeBytes(Packet.encodeString(text, encoding));
  }

  // Append

  /** Append 1 signed byte to the current offset */
  public appendSByte(value: number) {
    this.grow(1);
    return this.writeSByte(value);
  }

  /** Append 2 signed bytes to the current offset */
  public appendInt16(value: number): this;
  public appendInt16(value: number, endianness: Endianness): this;
  public appendInt16(value: number, endianness: Endianness = this.endianness): this {
    this.grow(2);
    return this.writeInt16(value, endianness);
  }

  /** Append 4 signed bytes to the current offset */
  public appendInt32(value: number): this;
  public appendInt32(value: number, endianness: Endianness): this;
  public appendInt32(value: number, endianness: Endianness = this.endianness): this {
    this.grow(4);
    return this.writeInt32(value, endianness);
  }

  /** Append 8 signed bytes to the current offset */
  public appendInt64(value: bigint): this;
  public appendInt64(value: bigint, endianness: Endianness): this;
  public appendInt64(value: bigint, endianness: Endianness = this.endianness): this {
    this.grow(8);
    return this.writeInt64(value, endianness);
  }

  /** Append 1 unsigned byte to the current offset */
  public appendByte(value: number) {
    this.grow(1);
    return this.writeByte(value);
  }

  /** Append 2 unsigned bytes to the current offset */
  public appendUInt16(value: number): this;
  public appendUInt16(value: number, endianness: Endianness): this;
  public appendUInt16(value: number, endianness: Endianness = this.endianness): this {
    this.grow(2);
    return this.writeUInt16(value, endianness);
  }

  /** Append 4 unsigned bytes to the current offset */
  public appendUInt32(value: number): this;
  public appendUInt32(value: number, endianness: Endianness): this;
  public appendUInt32(value: number, endianness: Endianness = this.endianness): this {
    this.grow(4);
    return this.writeUInt32(value, endianness);
  }

  /** Append 8 unsigned bytes to the current offset */
  public appendUInt64(value: bigint): this;
  public appendUInt64(value: bigint, endianness: Endianness): this;
  public appendUInt64(value: bigint, endianness: Endianness = this.endianness): this {
    this.grow(8);
    return this.writeUInt64(value, endianness);
  }

  /** Append 8 bytes to the current offset as a double */
  public appendDouble(value: number): this;
  public appendDouble(value: number, endianness: Endianness): this;
  public appendDouble(value: number, endianness: Endianness = this.endianness): this {
    this.grow(8);
    return this.writeDouble(value, endianness);
  }

  /** Append 4 bytes to the current offset as a float */
  public appendFloat(value: number): this;
  public appendFloat(value: number, endianness: Endianness): this;
  public appendFloat(value: number, endianness: Endianness = this.endianness): this {
    this.grow(4);
    return this.writeFloat(value, endianness);
  }

  /** Append raw bytes to the current offset */
  public appendBytes(bytes: Uint8Array) {
    this.grow(bytes.length);
    return this.writeBytes(bytes);
  }

  /** Append a string to the current offset, growing by its encoded byte length */
  public appendString(text: string): this;
  public appendString(text: string, encoding: StringEncoding): this;
  public appendString(text: string, encoding: StringEncoding = this.encoding): this {
    return this.appendBytes(Packet.encodeString(text, encoding));
  }

  // Helpers

  /** Set the byte order used by subsequent multi-byte reads and writes */
  public useEndianness(order: Endianness) {
    this.littleEndian = order === 'LE';
    return this;
  }

  /** Set the string encoding used by subsequent string reads and writes */
  public useEncoding(encoding: StringEncoding) {
    this.encoding = encoding;
    return this;
  }

  private get endianness(): Endianness {
    return this.littleEndian ? 'LE' : 'BE';
  }

  private checkBounds(length: number) {
    if (this.offset < 0 || length < 0 || this.offset + length > this.byteLength) {
      throw new RangeError(
        `Cannot access ${length} byte(s) at offset ${this.offset}; packet is ${this.byteLength} byte(s)`
      );
    }
  }

  /** Ensure there is room for `by` bytes at the current offset, enlarging the buffer if needed */
  public grow(by: number) {
    const requiredSize = this.offset + by;
    if (requiredSize <= this.byteLength) return;

    // `bytes` covers only the packet's contents; the buffer behind it may have spare capacity
    let storage = this.bytes.buffer;
    if (requiredSize > storage.byteLength) {
      // Grow by 1.5x once past 128 bytes to reduce reallocations; small buffers grow exactly
      const capacity = storage.byteLength > 128
        ? Math.max(requiredSize, Math.floor(storage.byteLength * 1.5))
        : requiredSize;
      const newBytes = new Uint8Array(capacity);
      newBytes.set(this.bytes);
      storage = newBytes.buffer;
    }

    this.bytes = new Uint8Array(storage, 0, requiredSize);
    this.view = new DataView(storage, 0, requiredSize);
  }

  /** Move the offset by `count`, relative to the beginning, the current offset, or the end */
  public skip(count: number, origin: 'begin' | 'current' | 'end' = 'current') {
    switch (origin) {
      case 'begin':
        this.offset = count;
        break;
      case 'current':
        this.offset += count;
        break;
      case 'end':
        this.offset = this.bytes.length - count;
        break;
    }
    return this;
  }

  public get byteLength() {
    return this.bytes.length;
  }

  /** Return a DataView over a copy of the packet's bytes */
  public toDataView(byteOffset?: number, byteLength?: number) {
    const clone = this.bytes.buffer.slice(this.bytes.byteOffset, this.bytes.byteOffset + this.bytes.byteLength);
    const view = new DataView(clone, byteOffset, byteLength);
    return view;
  }

  /** Get a hex dump of the packet */
  public toString() {
    const lines: string[] = [];
    const byteLength = this.bytes.length;

    for (let lineIndex = 0; lineIndex < byteLength; lineIndex += 16) {
      const parts: string[] = [lineIndex.toString(16).padStart(8, '0')];

      // Hex bytes
      for (let i = lineIndex; i < lineIndex + 16; i++) {
        parts.push(i % 8 === 0 ? '  ' : ' ');
        parts.push(i < byteLength ? this.bytes[i].toString(16).padStart(2, '0') : '  ');
      }

      parts.push('  | ');

      // ASCII representation
      for (let i = lineIndex; i < lineIndex + 16; i++) {
        if (i < byteLength) {
          const value = this.bytes[i];
          parts.push(value < 32 || value > 126 ? '.' : String.fromCharCode(value));
        } else {
          parts.push(' ');
        }
      }

      parts.push(' |');
      lines.push(parts.join(''));
    }

    return lines.join('\n');
  }
}
