const { chromium } = require('playwright');

(async () => {
  // Collect JSON input from stdin
  let input = '';
  process.stdin.on('data', chunk => input += chunk);
  process.stdin.on('end', async () => {
    let items;
    try {
      items = JSON.parse(input); // Expecting array of n8n items
    } catch (err) {
      console.error("Failed to parse input:", err.message);
      process.exit(1);
    }

    const browser = await chromium.launch({
      executablePath: '/usr/bin/chromium-browser',  // system Chromium path in Alpine
      headless: true
    });

    const results = [];

    for (const item of items) {
      const url = item.json["Organization Website"];
      if (!url) continue;

      try {
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
        const content = await page.content();
        results.push({ url, html: content });
        await page.close();
      } catch (err) {
        results.push({ url, error: err.message });
      }
    }

    console.log(JSON.stringify(results, null, 2)); // Output JSON back to n8n
    await browser.close();
  });
})();
