import puppeteer, { type Browser } from 'puppeteer';
import { beforeAll, afterAll } from 'vitest';

let browser: Browser;

beforeAll(async () => {
  // GitHub's Ubuntu runners block Chrome's sandbox, so disable it in CI only
  browser = await puppeteer.launch({ args: process.env.CI ? ['--no-sandbox'] : [] });
  globalThis.page = await browser.newPage();
});

afterAll(async () => {
  if (browser) {
    await browser.close();
  }
});

