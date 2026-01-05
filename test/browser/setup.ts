import puppeteer, { type Browser } from 'puppeteer';
import { beforeAll, afterAll } from 'vitest';

let browser: Browser;

beforeAll(async () => {
  browser = await puppeteer.launch();
  globalThis.page = await browser.newPage();
});

afterAll(async () => {
  if (browser) {
    await browser.close();
  }
});

