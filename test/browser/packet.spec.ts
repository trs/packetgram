import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { describe, it, expect, beforeAll } from 'vitest';
import type { Page } from 'puppeteer';
import type PacketClass from '../../src/packet';

declare global {
  var page: Page;
  interface Window {
    Packet: typeof PacketClass;
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Browser', () => {
  beforeAll(async () => {
    await page.goto(`file://${join(__dirname, 'packet.html')}`, { waitUntil: 'load' });
  });

  it('dumps and base64-encodes a packet', async () => {
    const result = await page.evaluate(() => {
      const packet = new window.Packet(5);
      packet.writeString('Hello');
      packet.appendString(' World!');
      return { dump: packet.toString(), encoded: packet.toBase64() };
    });

    expect(result.dump).toBe(
      '00000000  48 65 6c 6c 6f 20 57 6f  72 6c 64 21              | Hello World!     |'
    );
    expect(result.encoded).toBe('SGVsbG8gV29ybGQh');
  });

  it('round-trips utf8 strings, bigints and large packets', async () => {
    const result = await page.evaluate(() => {
      const { Packet } = window;

      const text = 'héllo € 😀';
      const strings = new Packet().appendString(text);
      strings.offset = 0;

      const numbers = new Packet().useEndianness('LE');
      numbers.appendInt64(-(BigInt(2) ** BigInt(63))).appendUInt64(BigInt(2) ** BigInt(64) - BigInt(1));
      numbers.offset = 0;

      const bytes = new Uint8Array(20000);
      for (let i = 0; i < bytes.length; i++) bytes[i] = i % 256;
      const decoded = Packet.fromBase64(Packet.from(bytes).toBase64()).toUint8Array();

      return {
        text: strings.readString(strings.byteLength),
        int64: numbers.readInt64().toString(),
        uint64: numbers.readUInt64().toString(),
        largeRoundTrip: decoded.length === bytes.length && decoded.every((value, i) => value === bytes[i]),
      };
    });

    expect(result.text).toBe('héllo € 😀');
    expect(result.int64).toBe((-(BigInt(2) ** BigInt(63))).toString());
    expect(result.uint64).toBe((BigInt(2) ** BigInt(64) - BigInt(1)).toString());
    expect(result.largeRoundTrip).toBe(true);
  });

  it('matches the Node base64 output for large packets', async () => {
    const encoded = await page.evaluate(() => {
      const bytes = new Uint8Array(20000);
      for (let i = 0; i < bytes.length; i++) bytes[i] = i % 256;
      return window.Packet.from(bytes).toBase64();
    });

    const bytes = new Uint8Array(20000);
    for (let i = 0; i < bytes.length; i++) bytes[i] = i % 256;
    expect(encoded).toBe(Buffer.from(bytes).toString('base64'));
  });
});
