const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium-browser',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const args = process.argv.slice(2);
  const personName = args[0];
  const companyName = args[1];

  let result = { personName, companyName, profileData: {}, error: null };

  try {
    const page = await browser.newPage();

    // Pretend to be a normal browser
    await page.setExtraHTTPHeaders({
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
    });

    const searchQuery = `site:linkedin.com/in "${personName}" "${companyName}"`;
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;

    let response = await page.goto(searchUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    if (response) {
      result.status = response.status();
      result.statusText = response.statusText();
    }

    await page.waitForTimeout(5000);

    // Grab all search results
    const results = await page.$$eval('div.tF2Cxc', nodes =>
      nodes.map(node => ({
        title: node.querySelector('h3')?.innerText || null,
        snippet: node.querySelector('.VwiC3b')?.innerText || null,
        link: node.querySelector('a')?.href || null
      }))
    );

    // Pick the first LinkedIn result if available
    const linkedinResult = results.find(r => r.link && r.link.includes("linkedin.com/in"));

    result.profileData = {
      name: personName,
      company: companyName,
      title: linkedinResult?.title || "Not found",
      snippet: linkedinResult?.snippet || "Not found",
      link: linkedinResult?.link || "Not found"
    };

    result.searchUrl = searchUrl;

    await page.close();
  } catch (err) {
    result.error = err.message;
  }

  console.log(JSON.stringify(result));
  await browser.close();
})();
