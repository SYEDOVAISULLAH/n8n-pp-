const { chromium } = require('playwright');

(async () => {
  const url = process.argv[2]; // get URL from command argument
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium-browser',
    headless: true
  });
  const page = await browser.newPage();

  await page.goto(url, { waitUntil: 'domcontentloaded' });

  // Get HTML
  const html = await page.content();
  console.log(html);

  await browser.close();
})();
