const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium-browser',  // system Chromium path in Alpine
    headless: true
  });

  const urls = process.argv.slice(2); // Take all arguments after `node scrape.js`

  const results = [];

  for (const url of urls) {
    try {
      const page = await browser.newPage();
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      const content = await page.content();
      results.push({ url, html: content });
      await page.close();
    } catch (err) {
      results.push({ url, error: err.message });
    }
  }

  console.log(JSON.stringify(results, null, 2));
  await browser.close();
})();
