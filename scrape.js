const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium-browser',
    headless: true
  });

  const urls = [
    "http://www.kuhndentist.com",
    "http://www.abilenefamilydentistry.com",
    "http://www.acworthpremierdentalcare.com"
  ];

  const results = [];

  for (const url of urls) {
    const page = await browser.newPage();
    try {
      await page.goto(url, { timeout: 30000, waitUntil: "domcontentloaded" });

      // Extract all <a> with goo.gl/maps
      const mapLinks = await page.$$eval("a", (anchors) =>
        anchors
          .map((a) => a.href)
          .filter((href) => href.startsWith("https://goo.gl/maps"))
      );

      results.push({ url, mapLinks });
    } catch (err) {
      results.push({ url, mapLinks: [], error: err.message });
    } finally {
      await page.close();
    }
  }

  await browser.close();

  // Print once as an array (n8n will split nicely)
  console.log(JSON.stringify(results));
})();
