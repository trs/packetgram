export type StringEncoding = 'latin1' | 'utf8';
export type Endianness = 'BE' | 'LE';

const utf8Encoder = new TextEncoder();
// fatal: invalid UTF-8 throws instead of silently becoming U+FFFD
// ignoreBOM: keep a leading U+FEFF instead of stripping it
const utf8Decoder = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true });

// Native base64 support (Uint8Array.prototype.toBase64 / Uint8Array.fromBase64) is not in TypeScript's lib yet
type NativeBase64Bytes = Uint8Array & { toBase64?: () => string };
type NativeBase64Constructor = { fromBase64?: (base64: string) => Uint8Array };

const INT64_MIN = -(BigInt(1) << BigInt(63));
const INT64_MAX = (BigInt(1) << BigInt(63)) - BigInt(1);
const UINT64_MAX = (BigInt(1) << BigInt(64)) - BigInt(1);

export default class Packet {
  // Always owned by this packet and starting at byteOffset 0 of its buffer: grow() reuses the
  // spare capacity after it, so it must never be a view into memory the caller can see.
  private bytes: Uint8Array;
  private view: DataView;
  private littleEndian: boolean = false;
  private stringEncoding: StringEncoding = 'utf8';

  public offset: number = 0;

  public constructor(size?: number)
  public constructor(data: ArrayBufferLike | ArrayBufferView, byteOffset?: number, byteLength?: number)
  public constructor(dataOrSize?: number | ArrayBufferLike | ArrayBufferView, byteOffset?: number, byteLength?: number) {
    if (typeof dataOrSize === 'undefined') {
      this.bytes = new Uint8Array(0);
    } else if (typeof dataOrSize === 'number') {
      this.bytes = new Uint8Array(dataOrSize);
    } else {
      const source = Packet.toBytes(dataOrSize);
      const start = byteOffset ?? 0;
      const length = byteLength ?? source.length - start;
      if (!Packet.isIndex(start) || !Packet.isIndex(length) || start + length > source.length) {
        throw new RangeError(
          `Cannot copy ${length} byte(s) at byte offset ${start}; source is ${source.length} byte(s)`
        );
      }
      // slice(), not subarray(), so the packet never shares memory with the caller
      this.bytes = source.slice(start, start + length);
    }
    this.view = new DataView(this.bytes.buffer, this.bytes.byteOffset, this.bytes.byteLength);
  }

  // Static

  /** Allocate a new buffer with the given size. */
  public static alloc(size?: number) {
    return new Packet(size);
  }

  /** Create a packet from a copy of the given buffer or view, optionally limited to a byte range of it. */
  public static from(data: ArrayBufferLike | ArrayBufferView, byteOffset?: number, byteLength?: number) {
    return new Packet(data, byteOffset, byteLength);
  }

  /** Create a packet from base64. Throws on invalid input. */
  public static fromBase64(base64: string): Packet {
    const native = Uint8Array as unknown as NativeBase64Constructor;

    if (typeof native.fromBase64 === 'function') {
      return Packet.own(native.fromBase64(base64));
    }
    // atob before Buffer: Buffer silently skips invalid characters
    if (typeof atob !== 'undefined') {
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return Packet.own(bytes);
    }
    if (typeof Buffer !== 'undefined') {
      return new Packet(Buffer.from(base64, 'base64'));
    }
    throw new Error('Base64 decoding not available in this environment');
  }

  // Read

  /** Read 1 byte from the current offset as a signed number */
  public readInt8(): number {
    this.checkBounds(1);
    const value = this.view.getInt8(this.offset);
    this.offset += 1;
    return value;
  }

  /** Read 2 bytes from the current offset as a signed number */
  public readInt16(): number;
  public readInt16(endianness?: Endianness): number;
  public readInt16(endianness: Endianness = this.endianness): number {
    this.checkBounds(2);
    const value = this.view.getInt16(this.offset, Packet.isLittleEndian(endianness));
    this.offset += 2;
    return value;
  }

  /** Read 4 bytes from the current offset as a signed number */
  public readInt32(): number;
  public readInt32(endianness?: Endianness): number;
  public readInt32(endianness: Endianness = this.endianness): number {
    this.checkBounds(4);
    const value = this.view.getInt32(this.offset, Packet.isLittleEndian(endianness));
    this.offset += 4;
    return value;
  }

  /** Read 8 bytes from the current offset as a signed bigint */
  public readInt64(): bigint;
  public readInt64(endianness?: Endianness): bigint;
  public readInt64(endianness: Endianness = this.endianness): bigint {
    this.checkBounds(8);
    const value = this.view.getBigInt64(this.offset, Packet.isLittleEndian(endianness));
    this.offset += 8;
    return value;
  }

  /** Read 1 byte from the current offset as an unsigned number */
  public readUInt8(): number {
    this.checkBounds(1);
    const value = this.view.getUint8(this.offset);
    this.offset += 1;
    return value;
  }

  /** Read 2 bytes from the current offset as an unsigned number */
  public readUInt16(): number;
  public readUInt16(endianness?: Endianness): number;
  public readUInt16(endianness: Endianness = this.endianness): number {
    this.checkBounds(2);
    const value = this.view.getUint16(this.offset, Packet.isLittleEndian(endianness));
    this.offset += 2;
    return value;
  }

  /** Read 4 bytes from the current offset as an unsigned number */
  public readUInt32(): number;
  public readUInt32(endianness?: Endianness): number;
  public readUInt32(endianness: Endianness = this.endianness): number {
    this.checkBounds(4);
    const value = this.view.getUint32(this.offset, Packet.isLittleEndian(endianness));
    this.offset += 4;
    return value;
  }

  /** Read 8 bytes from the current offset as an unsigned bigint */
  public readUInt64(): bigint;
  public readUInt64(endianness?: Endianness): bigint;
  public readUInt64(endianness: Endianness = this.endianness): bigint {
    this.checkBounds(8);
    const value = this.view.getBigUint64(this.offset, Packet.isLittleEndian(endianness));
    this.offset += 8;
    return value;
  }

  /** Read 8 bytes from the current offset as a double */
  public readDouble(): number;
  public readDouble(endianness?: Endianness): number;
  public readDouble(endianness: Endianness = this.endianness): number {
    this.checkBounds(8);
    const value = this.view.getFloat64(this.offset, Packet.isLittleEndian(endianness));
    this.offset += 8;
    return value;
  }

  /** Read 4 bytes from the current offset as a float */
  public readFloat(): number;
  public readFloat(endianness?: Endianness): number;
  public readFloat(endianness: Endianness = this.endianness): number {
    this.checkBounds(4);
    const value = this.view.getFloat32(this.offset, Packet.isLittleEndian(endianness));
    this.offset += 4;
    return value;
  }

  /** Read `length` bytes (not characters) from the current offset as a string */
  public readString(length: number): string;
  public readString(length: number, encoding?: StringEncoding): string;
  public readString(length: number, encoding: StringEncoding = this.stringEncoding): string {
    Packet.checkEncoding(encoding);
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
  public writeInt8(value: number): this {
    Packet.checkInteger(value, -0x80, 0x7f, 'Int8');
    this.checkBounds(1);
    this.view.setInt8(this.offset, value);
    this.offset += 1;
    return this;
  }

  /** Write 2 signed bytes to the current offset */
  public writeInt16(value: number): this;
  public writeInt16(value: number, endianness?: Endianness): this;
  public writeInt16(value: number, endianness: Endianness = this.endianness): this {
    Packet.checkInteger(value, -0x8000, 0x7fff, 'Int16');
    this.checkBounds(2);
    this.view.setInt16(this.offset, value, Packet.isLittleEndian(endianness));
    this.offset += 2;
    return this;
  }

  /** Write 4 signed bytes to the current offset */
  public writeInt32(value: number): this;
  public writeInt32(value: number, endianness?: Endianness): this;
  public writeInt32(value: number, endianness: Endianness = this.endianness): this {
    Packet.checkInteger(value, -0x80000000, 0x7fffffff, 'Int32');
    this.checkBounds(4);
    this.view.setInt32(this.offset, value, Packet.isLittleEndian(endianness));
    this.offset += 4;
    return this;
  }

  /** Write 8 signed bytes to the current offset */
  public writeInt64(value: bigint): this;
  public writeInt64(value: bigint, endianness?: Endianness): this;
  public writeInt64(value: bigint, endianness: Endianness = this.endianness): this {
    Packet.checkBigInt(value, INT64_MIN, INT64_MAX, 'Int64');
    this.checkBounds(8);
    this.view.setBigInt64(this.offset, value, Packet.isLittleEndian(endianness));
    this.offset += 8;
    return this;
  }

  /** Write 1 unsigned byte to the current offset */
  public writeUInt8(value: number): this {
    Packet.checkInteger(value, 0, 0xff, 'UInt8');
    this.checkBounds(1);
    this.view.setUint8(this.offset, value);
    this.offset += 1;
    return this;
  }

  /** Write 2 unsigned bytes to the current offset */
  public writeUInt16(value: number): this;
  public writeUInt16(value: number, endianness?: Endianness): this;
  public writeUInt16(value: number, endianness: Endianness = this.endianness): this {
    Packet.checkInteger(value, 0, 0xffff, 'UInt16');
    this.checkBounds(2);
    this.view.setUint16(this.offset, value, Packet.isLittleEndian(endianness));
    this.offset += 2;
    return this;
  }

  /** Write 4 unsigned bytes to the current offset */
  public writeUInt32(value: number): this;
  public writeUInt32(value: number, endianness?: Endianness): this;
  public writeUInt32(value: number, endianness: Endianness = this.endianness): this {
    Packet.checkInteger(value, 0, 0xffffffff, 'UInt32');
    this.checkBounds(4);
    this.view.setUint32(this.offset, value, Packet.isLittleEndian(endianness));
    this.offset += 4;
    return this;
  }

  /** Write 8 unsigned bytes to the current offset */
  public writeUInt64(value: bigint): this;
  public writeUInt64(value: bigint, endianness?: Endianness): this;
  public writeUInt64(value: bigint, endianness: Endianness = this.endianness): this {
    Packet.checkBigInt(value, BigInt(0), UINT64_MAX, 'UInt64');
    this.checkBounds(8);
    this.view.setBigUint64(this.offset, value, Packet.isLittleEndian(endianness));
    this.offset += 8;
    return this;
  }

  /** Write 8 bytes to the current offset as a double */
  public writeDouble(value: number): this;
  public writeDouble(value: number, endianness?: Endianness): this;
  public writeDouble(value: number, endianness: Endianness = this.endianness): this {
    this.checkBounds(8);
    this.view.setFloat64(this.offset, value, Packet.isLittleEndian(endianness));
    this.offset += 8;
    return this;
  }

  /** Write 4 bytes to the current offset as a float */
  public writeFloat(value: number): this;
  public writeFloat(value: number, endianness?: Endianness): this;
  public writeFloat(value: number, endianness: Endianness = this.endianness): this {
    this.checkBounds(4);
    this.view.setFloat32(this.offset, value, Packet.isLittleEndian(endianness));
    this.offset += 4;
    return this;
  }

  /** Write raw bytes to the current offset */
  public writeBytes(data: ArrayBufferLike | ArrayBufferView): this {
    const bytes = Packet.toBytes(data);
    this.checkBounds(bytes.length);
    this.bytes.set(bytes, this.offset);
    this.offset += bytes.length;
    return this;
  }

  /** Write a string to the current offset */
  public writeString(text: string): this;
  public writeString(text: string, encoding?: StringEncoding): this;
  public writeString(text: string, encoding: StringEncoding = this.stringEncoding): this {
    return this.writeBytes(Packet.encodeString(text, encoding));
  }

  // Append: the same as write*, but grows the packet first if the value does not fit.
  // They write at the current offset, not at the end, so they only add to the end when the
  // offset is already there; with the offset inside the packet they overwrite like write*.

  /** Write 1 signed byte at the current offset, growing the packet if needed */
  public appendInt8(value: number): this {
    Packet.checkInteger(value, -0x80, 0x7f, 'Int8');
    return this.grow(1).writeInt8(value);
  }

  /** Write 2 signed bytes at the current offset, growing the packet if needed */
  public appendInt16(value: number): this;
  public appendInt16(value: number, endianness?: Endianness): this;
  public appendInt16(value: number, endianness: Endianness = this.endianness): this {
    Packet.checkInteger(value, -0x8000, 0x7fff, 'Int16');
    return this.grow(2).writeInt16(value, endianness);
  }

  /** Write 4 signed bytes at the current offset, growing the packet if needed */
  public appendInt32(value: number): this;
  public appendInt32(value: number, endianness?: Endianness): this;
  public appendInt32(value: number, endianness: Endianness = this.endianness): this {
    Packet.checkInteger(value, -0x80000000, 0x7fffffff, 'Int32');
    return this.grow(4).writeInt32(value, endianness);
  }

  /** Write 8 signed bytes at the current offset, growing the packet if needed */
  public appendInt64(value: bigint): this;
  public appendInt64(value: bigint, endianness?: Endianness): this;
  public appendInt64(value: bigint, endianness: Endianness = this.endianness): this {
    Packet.checkBigInt(value, INT64_MIN, INT64_MAX, 'Int64');
    return this.grow(8).writeInt64(value, endianness);
  }

  /** Write 1 unsigned byte at the current offset, growing the packet if needed */
  public appendUInt8(value: number): this {
    Packet.checkInteger(value, 0, 0xff, 'UInt8');
    return this.grow(1).writeUInt8(value);
  }

  /** Write 2 unsigned bytes at the current offset, growing the packet if needed */
  public appendUInt16(value: number): this;
  public appendUInt16(value: number, endianness?: Endianness): this;
  public appendUInt16(value: number, endianness: Endianness = this.endianness): this {
    Packet.checkInteger(value, 0, 0xffff, 'UInt16');
    return this.grow(2).writeUInt16(value, endianness);
  }

  /** Write 4 unsigned bytes at the current offset, growing the packet if needed */
  public appendUInt32(value: number): this;
  public appendUInt32(value: number, endianness?: Endianness): this;
  public appendUInt32(value: number, endianness: Endianness = this.endianness): this {
    Packet.checkInteger(value, 0, 0xffffffff, 'UInt32');
    return this.grow(4).writeUInt32(value, endianness);
  }

  /** Write 8 unsigned bytes at the current offset, growing the packet if needed */
  public appendUInt64(value: bigint): this;
  public appendUInt64(value: bigint, endianness?: Endianness): this;
  public appendUInt64(value: bigint, endianness: Endianness = this.endianness): this {
    Packet.checkBigInt(value, BigInt(0), UINT64_MAX, 'UInt64');
    return this.grow(8).writeUInt64(value, endianness);
  }

  /** Write 8 bytes at the current offset as a double, growing the packet if needed */
  public appendDouble(value: number): this;
  public appendDouble(value: number, endianness?: Endianness): this;
  public appendDouble(value: number, endianness: Endianness = this.endianness): this {
    return this.grow(8).writeDouble(value, endianness);
  }

  /** Write 4 bytes at the current offset as a float, growing the packet if needed */
  public appendFloat(value: number): this;
  public appendFloat(value: number, endianness?: Endianness): this;
  public appendFloat(value: number, endianness: Endianness = this.endianness): this {
    return this.grow(4).writeFloat(value, endianness);
  }

  /** Write raw bytes at the current offset, growing the packet if needed */
  public appendBytes(data: ArrayBufferLike | ArrayBufferView): this {
    const bytes = Packet.toBytes(data);
    return this.grow(bytes.length).writeBytes(bytes);
  }

  /** Write a string at the current offset, growing the packet if needed */
  public appendString(text: string): this;
  public appendString(text: string, encoding?: StringEncoding): this;
  public appendString(text: string, encoding: StringEncoding = this.stringEncoding): this {
    return this.appendBytes(Packet.encodeString(text, encoding));
  }

  // Helpers

  /** Set the byte order used by subsequent multi-byte reads and writes */
  public useEndianness(order: Endianness): this {
    this.littleEndian = Packet.isLittleEndian(order);
    return this;
  }

  /** Set the string encoding used by subsequent string reads and writes */
  public useEncoding(encoding: StringEncoding): this {
    Packet.checkEncoding(encoding);
    this.stringEncoding = encoding;
    return this;
  }

  /** The byte order used when a read or write is not given one */
  public get endianness(): Endianness {
    return this.littleEndian ? 'LE' : 'BE';
  }

  /** The string encoding used when a string read or write is not given one */
  public get encoding(): StringEncoding {
    return this.stringEncoding;
  }

  /** Ensure there is room for `by` bytes at the current offset, enlarging the buffer if needed */
  public grow(by: number): this {
    if (!Packet.isIndex(by)) {
      throw new RangeError(`Cannot grow by ${by} byte(s); expected a non-negative integer`);
    }
    this.checkOffset();

    const requiredSize = this.offset + by;
    if (requiredSize <= this.byteLength) return this;

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
    return this;
  }

  /**
   * Move the offset. `'begin'` sets it to `count`, `'current'` adds `count`, and `'end'` sets it
   * to `count` bytes before the end (so `skip(4, 'end')` points at the last 4 bytes).
   * The offset may move past the end; a later append fills the gap with zeros.
   */
  public skip(count: number, origin: 'begin' | 'current' | 'end' = 'current'): this {
    if (!Number.isInteger(count)) {
      throw new RangeError(`Cannot skip ${count} byte(s); expected an integer`);
    }

    let offset: number;
    switch (origin) {
      case 'begin':
        offset = count;
        break;
      case 'current':
        offset = this.offset + count;
        break;
      case 'end':
        offset = this.bytes.length - count;
        break;
      default:
        throw new TypeError(`Unknown skip origin ${String(origin)}; expected 'begin', 'current' or 'end'`);
    }

    if (offset < 0) {
      throw new RangeError(`Cannot move to offset ${offset}; offsets cannot be negative`);
    }
    this.offset = offset;
    return this;
  }

  public get byteLength(): number {
    return this.bytes.length;
  }

  /** Encode the packet's bytes as base64 */
  public toBase64(): string {
    const bytes: NativeBase64Bytes = this.bytes;

    if (typeof bytes.toBase64 === 'function') {
      return bytes.toBase64();
    }
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength).toString('base64');
    }
    if (typeof btoa !== 'undefined') {
      const chunkSize = 8192;
      const chunks: string[] = [];
      for (let i = 0; i < bytes.length; i += chunkSize) {
        chunks.push(String.fromCharCode(...bytes.subarray(i, i + chunkSize)));
      }
      return btoa(chunks.join(''));
    }
    throw new Error('Base64 encoding not available in this environment');
  }

  /** Return a copy of the packet's bytes */
  public toUint8Array(): Uint8Array {
    return this.bytes.slice();
  }

  /** Return a DataView over a copy of the packet's bytes */
  public toDataView(byteOffset?: number, byteLength?: number): DataView {
    return new DataView(this.bytes.slice().buffer, byteOffset, byteLength);
  }

  /** Get a hex dump of the packet */
  public toString(): string {
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

  // Internal

  /** Wrap bytes the packet will own, without copying */
  private static own(bytes: Uint8Array): Packet {
    const packet = new Packet();
    packet.bytes = bytes;
    packet.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    return packet;
  }

  /** View any buffer or typed array as bytes, without copying */
  private static toBytes(data: ArrayBufferLike | ArrayBufferView): Uint8Array {
    return ArrayBuffer.isView(data)
      ? new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
      : new Uint8Array(data);
  }

  private static encodeString(text: string, encoding: StringEncoding): Uint8Array {
    Packet.checkEncoding(encoding);
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

  private static isIndex(value: number) {
    return Number.isInteger(value) && value >= 0;
  }

  private static isLittleEndian(endianness: Endianness) {
    if (endianness === 'LE') return true;
    if (endianness === 'BE') return false;
    throw new TypeError(`Unknown endianness ${String(endianness)}; expected 'BE' or 'LE'`);
  }

  private static checkEncoding(encoding: StringEncoding) {
    if (encoding !== 'utf8' && encoding !== 'latin1') {
      throw new TypeError(`Unknown encoding ${String(encoding)}; expected 'utf8' or 'latin1'`);
    }
  }

  private static checkInteger(value: number, min: number, max: number, type: string) {
    if (!Number.isInteger(value) || value < min || value > max) {
      throw new RangeError(`${type} value must be an integer from ${min} to ${max}; received ${value}`);
    }
  }

  private static checkBigInt(value: bigint, min: bigint, max: bigint, type: string) {
    if (typeof value !== 'bigint') {
      throw new TypeError(`${type} value must be a bigint; received ${typeof value}`);
    }
    if (value < min || value > max) {
      throw new RangeError(`${type} value must be from ${min} to ${max}; received ${value}`);
    }
  }

  private checkOffset() {
    if (!Packet.isIndex(this.offset)) {
      throw new RangeError(`Invalid offset ${this.offset}; expected a non-negative integer`);
    }
  }

  private checkBounds(length: number) {
    this.checkOffset();
    if (!Packet.isIndex(length) || this.offset + length > this.byteLength) {
      throw new RangeError(
        `Cannot access ${length} byte(s) at offset ${this.offset}; packet is ${this.byteLength} byte(s)`
      );
    }
  }
}
