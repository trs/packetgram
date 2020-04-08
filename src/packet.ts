export type Endianness = 'LE' | 'BE';

export interface PacketSettings {
  encoding: BufferEncoding;
  endianness: Endianness;
}

export default class Packet {
  private buffer: Buffer;
  private offset: number = 0;

  private settings: PacketSettings = {
    encoding: 'utf8',
    endianness: 'LE'
  };

  public constructor(size: number, settings?: Partial<PacketSettings>)
  public constructor(data: Buffer, settings?: Partial<PacketSettings>)
  public constructor(arg: number | Buffer, settings?: Partial<PacketSettings>) {
    if (typeof arg === 'number') {
      this.buffer = Buffer.alloc(arg);
    } else if (Buffer.isBuffer(arg)) {
      this.buffer = Buffer.from(arg);
    } else {
      throw new TypeError();
    }

    this.settings = {
      ...this.settings,
      ...(settings ?? {})
    };
  }

  // Read

  /** 1 */
  public readInt8() {
    const value = this.buffer.readInt8(this.offset);
    this.offset += 1;
    return value;
  }

  /** 2 */
  public readInt16() {
    const value = this.buffer.readInt16LE(this.offset);
    this.offset += 2;
    return value;
  }

  /** 4 */
  public readInt32() {
    const value = this.buffer.readInt32LE(this.offset);
    this.offset += 4;
    return value;
  }

  /** 8 */
  public readInt64() {
    const value = this.buffer.readBigInt64LE(this.offset);
    this.offset += 8;
    return value;
  }

  /** 1 */
  public readUInt8() {
    const value = this.buffer.readUInt8(this.offset);
    this.offset += 1;
    return value;
  }

  /** 2 */
  public readUInt16() {
    const value = this.buffer.readUInt16LE(this.offset);
    this.offset += 2;
    return value;
  }

  /** 4 */
  public readUInt32() {
    const value = this.buffer.readUInt32LE(this.offset);
    this.offset += 4;
    return value;
  }

  /** 8 */
  public readUInt64() {
    const value = this.buffer.readBigUInt64LE(this.offset);
    this.offset += 8;
    return value;
  }

  /** 8 */
  public readDouble() {
    const value = this.buffer.readDoubleLE(this.offset);
    this.offset += 8;
    return value;
  }

  /**4 */
  public readFloat() {
    const value = this.buffer.readFloatLE(this.offset);
    this.offset += 4;
    return value;
  }

  /** n */
  public readString(length: number) {
    const value = this.buffer.subarray(this.offset, length).toString(this.settings.encoding);
    this.offset += length;
    return value;
  }

  // Write

  /** 1 */
  public writeInt8(value: number) {
    this.buffer.writeInt8(value, this.offset);
    this.offset += 1;
    return this;
  }

  /** 2 */
  public writeInt16(value: number) {
    this.buffer.writeInt16LE(value, this.offset);
    this.offset += 2;
    return this;
  }

  /** 4 */
  public writeInt32(value: number) {
    this.buffer.writeInt32LE(value, this.offset);
    this.offset += 4;
    return this;
  }

  /** 8 */
  public writeInt64(value: bigint) {
    this.buffer.writeBigInt64LE(value, this.offset);
    this.offset += 8;
    return this;
  }

  /** 1 */
  public writeUInt8(value: number) {
    this.buffer.writeUInt8(value, this.offset);
    this.offset += 1;
    return this;
  }

  /** 2 */
  public writeUInt16(value: number) {
    this.buffer.writeUInt16LE(value, this.offset);
    this.offset += 2;
    return this;
  }

  /** 4 */
  public writeUInt32(value: number) {
    this.buffer.writeUInt32LE(value, this.offset);
    this.offset += 4;
    return this;
  }

  /** 8 */
  public writeUInt64(value: bigint) {
    this.buffer.writeBigUInt64LE(value, this.offset);
    this.offset += 8;
    return this;
  }

  /** 8 */
  public writeDouble(value: number) {
    this.buffer.writeDoubleLE(value, this.offset);
    this.offset += 8;
    return this;
  }

  /** 4 */
  public writeFloat(value: number) {
    this.buffer.writeFloatLE(value, this.offset);
    this.offset += 4;
    return this;
  }

  /** n */
  public writeRawString(value: string) {
    this.buffer.write(value, this.offset, value.length, this.settings.encoding);
    this.offset += length;
    return value;
  }

  /** n */
  public writeString(value: string) {
    this.writeInt8(value.length);
    this.writeRawString(value);
    return this;
  }

  // Helpers

  public skip(count: number) {
    this.offset += count;
    return this;
  }

  public resetOffset(offset: number = 0) {
    this.offset = offset;
    return this;
  }

  public toBuffer() {
    const clone = Buffer.alloc(this.buffer.byteLength);
    this.buffer.copy(clone, 0, 0, clone.byteLength);
    return clone;
  }
}
