const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium-browser',
    headless: true
  });

  const url = process.argv[2]; // 👉 Only handle the single URL for this run
  let result;

  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Extract all <a> with href starting with "https://goo.gl/maps"
    const mapLinks = await page.$$eval('a[href^="https://goo.gl/maps"]', anchors =>
      anchors.map(a => a.href)
    );

    // Remove duplicates
    const uniqueLinks = [...new Set(mapLinks)];

    // ✅ Only return mapLinks (not all URLs)
    result = { mapLinks: uniqueLinks };

    await page.close();
  } catch (err) {
    result = { mapLinks, error: err.message };
  }

  // 👉 Output exactly ONE JSON per run
  console.log(JSON.stringify(result));

  await browser.close();
})();
