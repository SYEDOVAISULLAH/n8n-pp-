const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium-browser',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const urls = process.argv.slice(2);

  for (const url of urls) {
    let result = { url, mapLinks: [] };

    try {
      const page = await browser.newPage();

      let response = await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 60000
      });

      // Capture HTTP status
      if (response) {
        result.status = response.status();
        result.statusText = response.statusText();
      } else {
        result.status = "NO_RESPONSE";
        result.statusText = "No response (possibly blocked by region)";
      }

      // If site is not OK, no need to continue
      if (!response || response.status() >= 400) {
        await page.close();
        console.log(JSON.stringify(result));
        continue;
      }

      // Wait for maps to load
      await page.waitForTimeout(5000);

      // 1. Google Maps shortlinks in <a>
      const mapLinksA = await page.$$eval(
        'a[href*="google.com/maps"], a[href^="https://goo.gl/maps"]',
        anchors => anchors.map(a => a.href)
      );

      // 2. Google Maps embeds in iframes
      const mapLinksIframe = await page.$$eval(
        'iframe[src*="google.com/maps"]',
        iframes => iframes.map(f => f.src)
      );

      // 3. OpenStreetMap / Mapbox embeds
      const mapLinksOSM = await page.$$eval(
        'iframe[src*="openstreetmap.org"], iframe[src*="mapbox.com"]',
        iframes => iframes.map(f => f.src)
      );

      result.mapLinks = [...new Set([...mapLinksA, ...mapLinksIframe, ...mapLinksOSM])];

      await page.close();
    } catch (err) {
      result.error = err.message;
    }

    // Always output JSON
    console.log(JSON.stringify(result));
  }

  await browser.close();
})();
