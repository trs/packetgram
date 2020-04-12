export default class Packet {
  private buffer: ArrayBuffer;
  private view: DataView;

  public offset: number = 0;

  public constructor(size?: number)
  public constructor(data?: ArrayBuffer, offset?: number, length?: number)
  public constructor(data?: number | ArrayBuffer, offset?: number, length?: number) {
    if (typeof data === 'undefined') data = 0;

    if (typeof data === 'number') {
      this.buffer = new ArrayBuffer(data);
    } else {
      this.buffer = data.slice(offset ?? 0, length);
    }
    this.view = new DataView(this.buffer);
  }

  // Static

  /** Allocate a new buffer with the given size. */
  public static alloc(size?: number) {
    return new Packet(size);
  }

  public static from(data: ArrayBuffer) {
    return new Packet(data);
  }

  // Read

  /** Read 1 byte from the current offset as a signed number */
  public readSByte() {
    const value = this.view.getInt8(this.offset);
    this.offset += 1;
    return value;
  }

  /** Read 2 bytes from the current offset as a signed number */
  public readInt16LE() {
    const value = this.view.getInt16(this.offset, true);
    this.offset += 2;
    return value;
  }

  /** Read 4 bytes from the current offset as a signed number */
  public readInt32LE() {
    const value = this.view.getInt32(this.offset, true);
    this.offset += 4;
    return value;
  }

  /** Read 4 bytes from the current offset as a signed bigint */
  public readInt64LE() {
    const value = this.view.getBigInt64(this.offset, true);
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
  public readUInt16LE() {
    const value = this.view.getUint16(this.offset, true);
    this.offset += 2;
    return value;
  }

  /** Read 4 bytes from the current offset as an unsigned number */
  public readUInt32LE() {
    const value = this.view.getUint32(this.offset, true);
    this.offset += 4;
    return value;
  }

  /** Read 8 bytes from the current offset as an unsigned bigint */
  public readUInt64LE() {
    const value = this.view.getBigUint64(this.offset, true);
    this.offset += 8;
    return value;
  }

  /** Read 8 bytes from the current offset as a double */
  public readDoubleLE() {
    const value = this.view.getFloat64(this.offset, true);
    this.offset += 8;
    return value;
  }

  /** Read 4 bytes from the current offset as a float */
  public readFloatLE() {
    const value = this.view.getFloat32(this.offset, true);
    this.offset += 4;
    return value;
  }

  /** Read 2 bytes from the current offset as a signed number */
  public readInt16BE() {
    const value = this.view.getInt16(this.offset, false);
    this.offset += 2;
    return value;
  }

  /** Read 4 bytes from the current offset as a signed number */
  public readInt32BE() {
    const value = this.view.getInt32(this.offset, false);
    this.offset += 4;
    return value;
  }

  /** Read 4 bytes from the current offset as a signed bigint */
  public readInt64BE() {
    const value = this.view.getBigInt64(this.offset, false);
    this.offset += 8;
    return value;
  }

  /** Read 2 bytes from the current offset as an unsigned number */
  public readUInt16BE() {
    const value = this.view.getUint16(this.offset, false);
    this.offset += 2;
    return value;
  }

  /** Read 4 bytes from the current offset as an unsigned number */
  public readUInt32BE() {
    const value = this.view.getUint32(this.offset, false);
    this.offset += 4;
    return value;
  }

  /** Read 8 bytes from the current offset as an unsigned bigint */
  public readUInt64BE() {
    const value = this.view.getBigUint64(this.offset, false);
    this.offset += 8;
    return value;
  }

  /** Read 8 bytes from the current offset as a double */
  public readDoubleBE() {
    const value = this.view.getFloat64(this.offset, false);
    this.offset += 8;
    return value;
  }

  /** Read 4 bytes from the current offset as a float */
  public readFloatBE() {
    const value = this.view.getFloat32(this.offset, false);
    this.offset += 4;
    return value;
  }

  /** Read any number of bytes from the current offset as a string */
  public readString(length: number, encoding?: string) {
    let value = '';
    for (let i = 0; i < length; i++) {
      value += String.fromCharCode(this.view.getUint8(this.offset + i));
    }
    this.offset += length;
    return value;
  }

  // Write

  /** Write 1 signed byte to the current offset */
  public writeSByte(value: number) {
    this.view.setInt8(this.offset, value);
    this.offset += 1;
    return this;
  }

  /** Write 2 signed bytes to the current offset */
  public writeInt16LE(value: number) {
    this.view.setInt16(this.offset, value, true);
    this.offset += 2;
    return this;
  }

  /** Write 4 signed bytes to the current offset */
  public writeInt32LE(value: number) {
    this.view.setInt32(this.offset, value, true);
    this.offset += 4;
    return this;
  }

  /** Write 8 signed bytes to the current offset */
  public writeInt64LE(value: bigint) {
    this.view.setBigInt64(this.offset, value, true);
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
  public writeUInt16LE(value: number) {
    this.view.setUint16(this.offset, value, true);
    this.offset += 2;
    return this;
  }

  /** Write 4 unsigned bytes to the current offset */
  public writeUInt32LE(value: number) {
    this.view.setUint32(this.offset, value, true);
    this.offset += 4;
    return this;
  }

  /** Write 8 unsigned bytes to the current offset */
  public writeUInt64LE(value: bigint) {
    this.view.setBigUint64(this.offset, value, true);
    this.offset += 8;
    return this;
  }

  /** Write 8 unsigned bytes to the current offset */
  public writeDoubleLE(value: number) {
    this.view.setFloat64(this.offset, value, true);
    this.offset += 8;
    return this;
  }

  /** Write 4 unsigned bytes to the current offset */
  public writeFloatLE(value: number) {
    this.view.setFloat32(this.offset, value, true);
    this.offset += 4;
    return this;
  }

  /** Write 2 signed bytes to the current offset */
  public writeInt16BE(value: number) {
    this.view.setInt16(this.offset, value, false);
    this.offset += 2;
    return this;
  }

  /** Write 4 signed bytes to the current offset */
  public writeInt32BE(value: number) {
    this.view.setInt32(this.offset, value, false);
    this.offset += 4;
    return this;
  }

  /** Write 8 signed bytes to the current offset */
  public writeInt64BE(value: bigint) {
    this.view.setBigInt64(this.offset, value, false);
    this.offset += 8;
    return this;
  }

  /** Write 1 unsigned byte to the current offset */
  public writeUInt8BE(value: number) {
    this.view.setUint8(this.offset, value);
    this.offset += 1;
    return this;
  }

  /** Write 2 unsigned bytes to the current offset */
  public writeUInt16BE(value: number) {
    this.view.setUint16(this.offset, value, false);
    this.offset += 2;
    return this;
  }

  /** Write 4 unsigned bytes to the current offset */
  public writeUInt32BE(value: number) {
    this.view.setUint32(this.offset, value, false);
    this.offset += 4;
    return this;
  }

  /** Write 8 unsigned bytes to the current offset */
  public writeUInt64BE(value: bigint) {
    this.view.setBigUint64(this.offset, value, false);
    this.offset += 8;
    return this;
  }

  /** Write 8 unsigned bytes to the current offset */
  public writeDoubleBE(value: number) {
    this.view.setFloat64(this.offset, value, false);
    this.offset += 8;
    return this;
  }

  /** Write 4 unsigned bytes to the current offset */
  public writeFloatBE(value: number) {
    this.view.setFloat32(this.offset, value, false);
    this.offset += 4;
    return this;
  }

  /** Write any number bytes as a string to the current offset */
  public writeString(text: string) {
    for (let i = 0; i < text.length; i++) {
      this.view.setUint8(this.offset++, text.charCodeAt(i));
    }
    return this;
  }

  // Append

  /** Append 1 signed byte to the current offset */
  public appendSByte(value: number) {
    this.grow(1);
    return this.writeSByte(value);
  }

  /** Append 2 signed bytes to the current offset */
  public appendInt16LE(value: number) {
    this.grow(2);
    return this.writeInt16LE(value);
  }

  /** Append 4 signed bytes to the current offset */
  public appendInt32LE(value: number) {
    this.grow(4);
    return this.writeInt32LE(value);
  }

  /** Append 8 signed bytes to the current offset */
  public appendInt64LE(value: bigint) {
    this.grow(8);
    return this.writeInt64LE(value);
  }

  /** Append 1 signed byte to the current offset */
  public appendByte(value: number) {
    this.grow(1);
    return this.writeByte(value);
  }

  /** Append 2 signed bytes to the current offset */
  public appendUInt16LE(value: number) {
    this.grow(2);
    return this.writeUInt16LE(value);
  }

  /** Append 4 signed bytes to the current offset */
  public appendUInt32LE(value: number) {
    this.grow(4);
    return this.writeUInt32LE(value);
  }

  /** Append 8 signed bytes to the current offset */
  public appendUInt64LE(value: bigint) {
    this.grow(8);
    return this.writeUInt64LE(value);
  }

  /** Append 8 signed bytes to the current offset */
  public appendDoubleLE(value: number) {
    this.grow(8);
    return this.writeDoubleLE(value);
  }

  /** Append 4 signed bytes to the current offset */
  public appendFloatLE(value: number) {
    this.grow(4);
    return this.writeFloatLE(value);
  }

  /** Append 2 signed bytes to the current offset */
  public appendInt16BE(value: number) {
    this.grow(2);
    return this.writeInt16BE(value);
  }

  /** Append 4 signed bytes to the current offset */
  public appendInt32BE(value: number) {
    this.grow(4);
    return this.writeInt32BE(value);
  }

  /** Append 8 signed bytes to the current offset */
  public appendInt64BE(value: bigint) {
    this.grow(8);
    return this.writeInt64BE(value);
  }

  /** Append 2 signed bytes to the current offset */
  public appendUInt16BE(value: number) {
    this.grow(2);
    return this.writeUInt16BE(value);
  }

  /** Append 4 signed bytes to the current offset */
  public appendUInt32BE(value: number) {
    this.grow(4);
    return this.writeUInt32BE(value);
  }

  /** Append 8 signed bytes to the current offset */
  public appendUInt64BE(value: bigint) {
    this.grow(8);
    return this.writeUInt64BE(value);
  }

  /** Append 8 signed bytes to the current offset */
  public appendDoubleBE(value: number) {
    this.grow(8);
    return this.writeDoubleBE(value);
  }

  /** Append 4 signed bytes to the current offset */
  public appendFloatBE(value: number) {
    this.grow(4);
    return this.writeFloatBE(value);
  }

  /** Append any number bytes as a string to the current offset */
  public appendString(text: string) {
    this.grow(text.length);
    return this.writeString(text);
  }

  // Helpers

  public grow(by: number) {
    if (this.offset + by >= this.byteLength) {
      const newBuffer = new ArrayBuffer(this.offset + by);
      const newView = new DataView(newBuffer);

      for (let i = 0; i < this.byteLength; i++) {
        newView.setUint8(i, this.view.getUint8(i));
      }

      this.buffer = newBuffer;
      this.view = newView;
    }
  }

  /** Increment of the offset by the given count */
  public skip(count: number) {
    this.offset += count;
    return this;
  }

  public get byteLength() {
    return this.view.byteLength;
  }

  /** Return a copy of the underlying packet */
  public toDataView(byteOffset?: number, byteLength?: number) {
    const clone = this.buffer.slice(0);
    const view = new DataView(clone, byteOffset, byteLength);
    return view;
  }

  /** Get a hex dump of the packet */
  public toString() {
    let text = '';

    for (let lineIndex = 0; lineIndex < this.view.byteLength; lineIndex += 16) {
      text += lineIndex.toString(16).padStart(8, '0');

      for (let i = lineIndex; i < lineIndex + 16; i++) {
        text += i % 8 === 0 ? '  ' : ' ';
        text += i < this.view.byteLength ? this.view.getUint8(i).toString(16).padStart(2, '0') : '  ';
      }

      text += '  | ';

      for (let i = lineIndex; i < lineIndex + 16; i++) {
        if (i < this.view.byteLength) {
          const value = this.view.getUint8(i);
          text += value < 32 || value > 126 ? '.' : String.fromCharCode(value);
        } else {
          text += ' ';
        }
      }

      text += ' |\n';
    }

    return text.trimRight();
  }
}
