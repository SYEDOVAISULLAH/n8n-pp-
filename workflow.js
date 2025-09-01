const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium-browser',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const query = process.argv[2];  
  const result = { query, results: [], verified: false, error: null };

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

    // Wait for results
    await page.waitForSelector('a h3', { timeout: 10000 });

    // Extract search results
    result.results = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a h3')).map(el => {
        const link = el.closest('a')?.href || "";
        const title = el.innerText || "";
        const snippet = el.parentElement?.parentElement?.querySelector('div')?.innerText || "";
        return { title, snippet, link };
      });
    });

    // Basic verification logic:
    // Check if any LinkedIn link contains the person/company info
    const lowerQuery = query.toLowerCase();
    result.verified = result.results.some(r =>
      r.link.includes("linkedin.com") &&
      (r.title.toLowerCase().includes("melanie beam") || r.snippet.toLowerCase().includes("melanie beam")) &&
      (r.title.toLowerCase().includes("akron dental care") || r.snippet.toLowerCase().includes("akron dental care"))
    );

    await page.close();
  } catch (err) {
    result.error = err.message;
  }

  console.log(JSON.stringify(result, null, 2));
  await browser.close();
})();
