const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium-browser',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  // Get person name and company from the command line arguments
  const args = process.argv.slice(2);
  const personName = args[0];   // e.g., "Melanie Beam"
  const companyName = args[1];  // e.g., "Akron Dental Care"

  let result = { personName, companyName, profileData: {}, error: null };

  try {
    const page = await browser.newPage();

    // Build Google search query
    const searchQuery = `site:linkedin.com/in "${personName}" "${companyName}"`;
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;

    // Go to Google search results
    let response = await page.goto(searchUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    if (response) {
      result.status = response.status();
      result.statusText = response.statusText();
    }

    // Wait for results to load
    await page.waitForTimeout(5000);

    // Extract the first search result snippet (title + description)
    const title = await page.$eval('h3', el => el.innerText).catch(() => null);
    const snippet = await page.$eval('.VwiC3b', el => el.innerText).catch(() => null);

    result.profileData = {
      name: personName,
      company: companyName,
      snippet: snippet || 'Not found',
      title: title || 'Not found'
    };

    await page.close();
  } catch (err) {
    result.error = err.message;
  }

  console.log(JSON.stringify(result));

  await browser.close();
})();
