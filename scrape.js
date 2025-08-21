const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium-browser', // system Chromium path in Alpine
    headless: true
  });

  const urls = process.argv.slice(2); // Take all URLs as arguments
  const results = [];

  for (const url of urls) {
    try {
      const page = await browser.newPage();
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

      // Extract all <a> tags with href starting with "https://goo.gl/maps"
      const mapLinks = await page.$$eval('a[href^="https://goo.gl/maps"]', anchors =>
        anchors.map(a => a.href)
      );

      results.push({ url, mapLinks });
      await page.close();
    } catch (err) {
      results.push({ url, error: err.message });
    }
  }

  console.log(JSON.stringify(results, null, 2));
  await browser.close();
})();
