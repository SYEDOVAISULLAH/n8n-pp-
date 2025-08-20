// /home/node/scripts/scrape.js
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true // headless = no UI, good for servers
  });
  const page = await browser.newPage();

  // Go to your target site
  await page.goto('https://example.com');

  // Replace with the selector for the location element
  const location = await page.textContent('h1');  

  // Print as JSON so n8n can read it
  console.log(JSON.stringify({ location }));

  await browser.close();
})();
