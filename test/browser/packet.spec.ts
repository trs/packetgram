describe('Browser', () => {
  it('works', async () => {
    await page.goto(`${__dirname}/packet.html`, {waitUntil: 'load'});

    const packet = await page.evaluate(() => document.getElementById('packet').innerText);

    expect(packet).toBe('00000000 48 65 6c 6c 6f 20 57 6f 72 6c 64 21 | Hello World! |')
  });
});
