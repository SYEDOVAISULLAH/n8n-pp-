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
    const url = "https://duckduckgo.com/html/?q=" + encodeURIComponent(query);

    let response = await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    if (response) {
      result.status = response.status();
      result.statusText = response.statusText();
    }

    // Wait for results
    await page.waitForSelector('.result__title a', { timeout: 10000 });

    // Extract search results
    result.results = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.result__title a')).map(el => {
        const link = el.href || "";
        const title = el.innerText || "";
        const snippet = el.closest('.result').querySelector('.result__snippet')?.innerText || "";
        return { title, snippet, link };
      });
    });

    // Basic verification logic:
    // Check if any LinkedIn link contains both person and company info
    const lowerQuery = query.toLowerCase();
    const [name, company] = lowerQuery.replace(/"/g, '').split(/\s+(?=\w+\s+\w+)/); 
    // ⚠️ you can also pass name/company separately from n8n if you prefer

    result.verified = result.results.some(r =>
      r.link.includes("linkedin.com") &&
      (
        r.title.toLowerCase().includes(name) || r.snippet.toLowerCase().includes(name)
      ) &&
      (
        r.title.toLowerCase().includes(company) || r.snippet.toLowerCase().includes(company)
      )
    );

    await page.close();
  } catch (err) {
    result.error = err.message;
  }

  console.log(JSON.stringify(result, null, 2));
  await browser.close();
})();
