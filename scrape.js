const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium-browser',
    headless: true
  });

  const urls = process.argv.slice(2); // Take all URLs as arguments

  for (const url of urls) {
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

      result = { mapLinks: uniqueLinks };

      await page.close();
    } catch (err) {
      result = { error: err.message };
    }

    // 👉 Output one line of JSON per site (n8n treats each as a separate item)
    console.log(JSON.stringify(result));
  }

  await browser.close();
})();
