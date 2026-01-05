import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { describe, it, expect } from 'vitest';
import type { Page } from 'puppeteer';

declare global {
  var page: Page;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Browser', () => {
  it('works', async () => {
    await page.goto(`file://${join(__dirname, 'packet.html')}`, {waitUntil: 'load'});

    const packet = await page.evaluate(() => document.getElementById('packet')?.innerText);

    expect(packet).toBe('00000000 48 65 6c 6c 6f 20 57 6f 72 6c 64 21 | Hello World! |');

    const packetEncoded = await page.evaluate(() => document.getElementById('packet-encoded')?.innerText);

    expect(packetEncoded).toBe('SGVsbG8gV29ybGQh');
  });
});
