const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium-browser',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const query = process.argv[2];  
  const employee = process.argv[3]; // pass employee name separately
  const company = process.argv[4];  // pass company name separately

  const result = { query, employee, company, results: [], verified: false, error: null };

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
    await page.waitForSelector('h3', { timeout: 10000 });

    // Extract each search result block (outerHTML)
    const searchResults = await page.$$eval('.tF2Cxc', nodes =>
      nodes.map(node => node.outerHTML)
    );

    result.results = searchResults;

    // Check if any block contains both employee + company
    result.verified = searchResults.some(html =>
      html.toLowerCase().includes(employee.toLowerCase()) &&
      html.toLowerCase().includes(company.toLowerCase())
    );

    await page.close();
  } catch (err) {
    result.error = err.message;
  }

  console.log(JSON.stringify(result, null, 2));
  await browser.close();
})();
