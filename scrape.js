const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium-browser',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const urls = process.argv.slice(2, 3); // The URL will be the first argument after the script
  const city = process.argv[3]; // City passed as the second argument
  const state = process.argv[4]; // State passed as the third argument

  for (const url of urls) {
    let result = { 
      url, 
      mapLinks: [], 
      addresses: [],
      city: city,  // Include city in result
      state: state,  // Include state in result
    };

    try {
      const page = await browser.newPage();

      let response = await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 60000
      });

      if (response) {
        result.status = response.status();
        result.statusText = response.statusText();
      }

      // Wait for content to fully load
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

        // Simple U.S. address regex (street + city + state + zip)
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

    // Log the result to include city and state
    console.log(JSON.stringify(result));
  }

  await browser.close();
})();
