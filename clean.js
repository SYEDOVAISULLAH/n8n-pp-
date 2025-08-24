const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium-browser",
    headless: true
  });

  const urls = process.argv.slice(2);

  for (const url of urls) {
    let result;
    try {
      const page = await browser.newPage();
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

      // Extract map links
      const mapLinks = await page.$$eval(
        'a[href^="https://goo.gl/maps"], a[href^="https://www.google.com/maps"]',
        anchors => anchors.map(a => a.href)
      );

      // Extract text addresses
      const addresses = await page.$$eval("body", nodes => {
        const text = nodes[0].innerText;
        const matches = text.match(/\d{1,5}\s+[\w\s.,]+,\s*[A-Z]{2}\s*\d{5}/g) || [];
        return matches;
      });

      const cleanText = str => str.replace(/\s+/g, " ").trim();

      result = {
        url,
        mapLink: mapLinks.length ? [...new Set(mapLinks)].join(", ") : "",
        address: addresses.length ? cleanText(addresses.join(" | ")) : "",
        status: "200"
      };

      await page.close();
    } catch (err) {
      result = { url, error: err.message };
    }

    console.log(JSON.stringify(result));
  }

  await browser.close();
})();
