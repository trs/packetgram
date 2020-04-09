interface PacketSettings {
  unsafe: boolean;
}

export default class Packet {
  #buffer: Buffer;
  public offset: number = 0;

  public constructor(size: number, settings?: PacketSettings)
  public constructor(data: Buffer | ArrayBuffer | SharedArrayBuffer, offset?: number, length?: number)
  public constructor(value: Buffer | ArrayBuffer | SharedArrayBuffer | number, offsetOrSettings?: number | PacketSettings, length?: number) {
    if (typeof value === 'number' && (typeof offsetOrSettings === 'object' || typeof offsetOrSettings === 'undefined')) {
      this.#buffer = (offsetOrSettings ?? {}).unsafe === true
        ? Buffer.allocUnsafe(value)
        : Buffer.alloc(value);
    } else if (typeof value !== 'number' && (typeof offsetOrSettings === 'number' || typeof offsetOrSettings === 'undefined')) {
      this.#buffer = Buffer.from(value, offsetOrSettings ?? 0, length);
    } else {
      throw new TypeError();
    }
  }

  // Static

  /** Allocate a new buffer with the given size. */
  public static alloc(size: number) {
    return new Packet(size);
  }

  /** Allocate a new buffer with the given size. */
  public static allocUnsafe(size: number) {
    return new Packet(size, {unsafe: true});
  }

  /** Create a buffer from a given source */
  public static from(value: Packet | Buffer | ArrayBuffer | SharedArrayBuffer, offset?: number, length?: number) {
    if (value instanceof Packet) {
      return new Packet(value.toBuffer(), offset, length);
    } else {
      return new Packet(value, offset, length);
    }
  }

  // Read

  /** Read 1 byte from the current offset as a signed number */
  public readSByte() {
    const value = this.#buffer.readInt8(this.offset);
    this.offset += 1;
    return value;
  }

  /** Read 2 bytes from the current offset as a signed number */
  public readInt16LE() {
    const value = this.#buffer.readInt16LE(this.offset);
    this.offset += 2;
    return value;
  }

  /** Read 4 bytes from the current offset as a signed number */
  public readInt32LE() {
    const value = this.#buffer.readInt32LE(this.offset);
    this.offset += 4;
    return value;
  }

  /** Read 4 bytes from the current offset as a signed bigint */
  public readInt64LE() {
    const value = this.#buffer.readBigInt64LE(this.offset);
    this.offset += 8;
    return value;
  }

  /** Read 1 byte from the current offset as an unsigned number */
  public readByte() {
    const value = this.#buffer.readUInt8(this.offset);
    this.offset += 1;
    return value;
  }

  /** Read 2 bytes from the current offset as an unsigned number */
  public readUInt16LE() {
    const value = this.#buffer.readUInt16LE(this.offset);
    this.offset += 2;
    return value;
  }

  /** Read 4 bytes from the current offset as an unsigned number */
  public readUInt32LE() {
    const value = this.#buffer.readUInt32LE(this.offset);
    this.offset += 4;
    return value;
  }

  /** Read 8 bytes from the current offset as an unsigned bigint */
  public readUInt64LE() {
    const value = this.#buffer.readBigUInt64LE(this.offset);
    this.offset += 8;
    return value;
  }

  /** Read 8 bytes from the current offset as a double */
  public readDoubleLE() {
    const value = this.#buffer.readDoubleLE(this.offset);
    this.offset += 8;
    return value;
  }

  /** Read 4 bytes from the current offset as a float */
  public readFloatLE() {
    const value = this.#buffer.readFloatLE(this.offset);
    this.offset += 4;
    return value;
  }

  /** Read 2 bytes from the current offset as a signed number */
  public readInt16BE() {
    const value = this.#buffer.readInt16BE(this.offset);
    this.offset += 2;
    return value;
  }

  /** Read 4 bytes from the current offset as a signed number */
  public readInt32BE() {
    const value = this.#buffer.readInt32BE(this.offset);
    this.offset += 4;
    return value;
  }

  /** Read 4 bytes from the current offset as a signed bigint */
  public readInt64BE() {
    const value = this.#buffer.readBigInt64BE(this.offset);
    this.offset += 8;
    return value;
  }

  /** Read 2 bytes from the current offset as an unsigned number */
  public readUInt16BE() {
    const value = this.#buffer.readUInt16BE(this.offset);
    this.offset += 2;
    return value;
  }

  /** Read 4 bytes from the current offset as an unsigned number */
  public readUInt32BE() {
    const value = this.#buffer.readUInt32BE(this.offset);
    this.offset += 4;
    return value;
  }

  /** Read 8 bytes from the current offset as an unsigned bigint */
  public readUInt64BE() {
    const value = this.#buffer.readBigUInt64BE(this.offset);
    this.offset += 8;
    return value;
  }

  /** Read 8 bytes from the current offset as a double */
  public readDoubleBE() {
    const value = this.#buffer.readDoubleBE(this.offset);
    this.offset += 8;
    return value;
  }

  /** Read 4 bytes from the current offset as a float */
  public readFloatBE() {
    const value = this.#buffer.readFloatBE(this.offset);
    this.offset += 4;
    return value;
  }

  /** Read any number of bytes from the current offset as a string */
  public readString(length: number, encoding: BufferEncoding = 'utf-8') {
    const value = this.#buffer.toString(encoding, this.offset, this.offset + length);
    this.offset += length;
    return value;
  }

  // Write LE

  /** Write 1 signed byte to the current offset */
  public writeSByte(value: number) {
    this.#buffer.writeInt8(value, this.offset);
    this.offset += 1;
    return this;
  }

  /** Write 2 signed bytes to the current offset */
  public writeInt16LE(value: number) {
    this.#buffer.writeInt16LE(value, this.offset);
    this.offset += 2;
    return this;
  }

  /** Write 4 signed bytes to the current offset */
  public writeInt32LE(value: number) {
    this.#buffer.writeInt32LE(value, this.offset);
    this.offset += 4;
    return this;
  }

  /** Write 8 signed bytes to the current offset */
  public writeInt64LE(value: bigint) {
    this.#buffer.writeBigInt64LE(value, this.offset);
    this.offset += 8;
    return this;
  }

  /** Write 1 unsigned byte to the current offset */
  public writeByte(value: number) {
    this.#buffer.writeUInt8(value, this.offset);
    this.offset += 1;
    return this;
  }

  /** Write 2 unsigned bytes to the current offset */
  public writeUInt16LE(value: number) {
    this.#buffer.writeUInt16LE(value, this.offset);
    this.offset += 2;
    return this;
  }

  /** Write 4 unsigned bytes to the current offset */
  public writeUInt32LE(value: number) {
    this.#buffer.writeUInt32LE(value, this.offset);
    this.offset += 4;
    return this;
  }

  /** Write 8 unsigned bytes to the current offset */
  public writeUInt64LE(value: bigint) {
    this.#buffer.writeBigUInt64LE(value, this.offset);
    this.offset += 8;
    return this;
  }

  /** Write 8 unsigned bytes to the current offset */
  public writeDoubleLE(value: number) {
    this.#buffer.writeDoubleLE(value, this.offset);
    this.offset += 8;
    return this;
  }

  /** Write 4 unsigned bytes to the current offset */
  public writeFloatLE(value: number) {
    this.#buffer.writeFloatLE(value, this.offset);
    this.offset += 4;
    return this;
  }

  /** Write 2 signed bytes to the current offset */
  public writeInt16BE(value: number) {
    this.#buffer.writeInt16BE(value, this.offset);
    this.offset += 2;
    return this;
  }

  /** Write 4 signed bytes to the current offset */
  public writeInt32BE(value: number) {
    this.#buffer.writeInt32BE(value, this.offset);
    this.offset += 4;
    return this;
  }

  /** Write 8 signed bytes to the current offset */
  public writeInt64BE(value: bigint) {
    this.#buffer.writeBigInt64BE(value, this.offset);
    this.offset += 8;
    return this;
  }

  /** Write 1 unsigned byte to the current offset */
  public writeUInt8BE(value: number) {
    this.#buffer.writeUInt8(value, this.offset);
    this.offset += 1;
    return this;
  }

  /** Write 2 unsigned bytes to the current offset */
  public writeUInt16BE(value: number) {
    this.#buffer.writeUInt16BE(value, this.offset);
    this.offset += 2;
    return this;
  }

  /** Write 4 unsigned bytes to the current offset */
  public writeUInt32BE(value: number) {
    this.#buffer.writeUInt32BE(value, this.offset);
    this.offset += 4;
    return this;
  }

  /** Write 8 unsigned bytes to the current offset */
  public writeUInt64BE(value: bigint) {
    this.#buffer.writeBigUInt64BE(value, this.offset);
    this.offset += 8;
    return this;
  }

  /** Write 8 unsigned bytes to the current offset */
  public writeDoubleBE(value: number) {
    this.#buffer.writeDoubleBE(value, this.offset);
    this.offset += 8;
    return this;
  }

  /** Write 4 unsigned bytes to the current offset */
  public writeFloatBE(value: number) {
    this.#buffer.writeFloatBE(value, this.offset);
    this.offset += 4;
    return this;
  }

  /** Write any number bytes as a string to the current offset */
  public writeString(value: string, encoding: BufferEncoding = 'utf-8') {
    this.#buffer.write(value, this.offset, value.length, encoding);
    this.offset += value.length;
    return value;
  }

  // Helpers

  /** Increment of the offset by the given count */
  public skip(count: number) {
    this.offset += count;
    return this;
  }

  public changeSize(size: number) {
    const growth = Buffer.alloc(size);
    this.#buffer.copy(growth, 0, 0, Math.min(this.#buffer.length, growth.length));
    this.#buffer = growth;
    return this;
  }

  public grow(by: number) {
    return this.changeSize(this.#buffer.length + by);
  }

  public shrink(by: number) {
    return this.changeSize(this.#buffer.length - by);
  }

  public get length() {
    return this.#buffer.length;
  }

  public get byteLength() {
    return this.#buffer.byteLength;
  }

  /** Return a copy of the underlying buffer of the packet */
  public toBuffer() {
    const clone = Buffer.alloc(this.#buffer.length);
    this.#buffer.copy(clone, 0, 0, clone.length);
    return clone;
  }
}
