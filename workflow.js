const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium-browser',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const query = process.argv[2];   // get query from command line
  const result = { query, results: [], error: null };

  try {
    const page = await browser.newPage();
    const url = "https://www.google.com/search?q=" + encodeURIComponent(query);

    let response = await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    if (response) {
      result.status = response.status();
      result.statusText = response.statusText();
    }

    // Wait for results to load
    await page.waitForTimeout(5000);

    // Extract search results
    result.results = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('div.g')).map(el => {
        const title = el.querySelector('h3')?.innerText || "";
        const snippet = el.querySelector('.VwiC3b')?.innerText || "";
        const link = el.querySelector('a')?.href || "";
        return { title, snippet, link };
      });
    });

    await page.close();
  } catch (err) {
    result.error = err.message;
  }

  console.log(JSON.stringify(result, null, 2));

  await browser.close();
})();
