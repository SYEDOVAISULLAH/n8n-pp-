const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium-browser',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const args = process.argv.slice(2);

  // Expecting arguments in sets of 4: [url1, city1, state1, row1, url2, city2, state2, row2, ...]
  for (let i = 0; i < args.length; i += 4) {
    const url = args[i];
    const city = args[i + 1];
    const state = args[i + 2];
    const rowNumber = args[i + 3];   // new row number

    let result = { url, city, state, rowNumber, mapLinks: [], addresses: [] };

    try {
      const page = await browser.newPage();

      const response = await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 60000
      });

      if (response) {
        result.status = response.status();
        result.statusText = response.statusText();
      }

      await page.waitForTimeout(5000);

      // 1. Google Maps shortlinks
      const mapLinksA = await page.$$eval(
        'a[href*="google.com/maps"], a[href^="https://goo.gl/maps"]',
        anchors => anchors.map(a => a.href)
      );

      // 2. Google Maps iframes
      const mapLinksIframe = await page.$$eval(
        'iframe[src*="google.com/maps"]',
        iframes => iframes.map(f => f.src)
      );

      // 3. OpenStreetMap / Mapbox iframes
      const mapLinksOSM = await page.$$eval(
        'iframe[src*="openstreetmap.org"], iframe[src*="mapbox.com"]',
        iframes => iframes.map(f => f.src)
      );

      result.mapLinks = [...new Set([...mapLinksA, ...mapLinksIframe, ...mapLinksOSM])];

      // 4. If no map links found, try extracting plain text addresses
      if (result.mapLinks.length === 0) {
        const bodyText = await page.evaluate(() => document.body.innerText);

        const addressRegex = /\d{1,5}\s[\w\s.,-]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Court|Ct)\s*[\s\S]{0,50}?\b[A-Z][a-z]+,\s*[A-Z]{2}\s*\d{5}/g;

        const matches = bodyText.match(addressRegex);
        if (matches) {
          result.addresses = matches.map(addr => addr.trim());
        }
      }

      await page.close();
    } catch (err) {
      result.error = err.message;
    }

    // Output the result for each URL
    console.log(JSON.stringify(result));
  }

  await browser.close();
})();
