const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium-browser',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  // Get LinkedIn URLs from the command line arguments
  const urls = process.argv.slice(2);

  for (const url of urls) {
    let result = { url, profileData: {}, error: null };

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

      // Step 1: Extract the raw HTML of the LinkedIn profile
      const pageHTML = await page.content();

      // Step 2: Search for key elements in the HTML (for example, company name and job title)
      // Scrape name and current company from LinkedIn profile
      const name = await page.$eval('.top-card-layout__title', el => el.innerText.trim()).catch(() => null);  // Name selector
      const currentCompany = await page.$eval('.top-card-layout__company', el => el.innerText.trim()).catch(() => null);  // Current company selector
      const jobTitle = await page.$eval('.top-card-layout__headline', el => el.innerText.trim()).catch(() => null);  // Job title selector

      // Save the extracted data in the result
      result.profileData = {
        name: name || 'Not found',
        currentCompany: currentCompany || 'Not found',
        jobTitle: jobTitle || 'Not found',
      };

      // Step 3: If no profile data found, look for more detailed information in HTML (fallback)
      if (!name || !currentCompany) {
        const bodyText = await page.evaluate(() => document.body.innerText);

        // Simple regex for searching company names or other information
        const companyRegex = /([A-Za-z0-9&]+(?: Inc| LLC| Ltd| Co| Corp| International)?)/g;
        const matches = bodyText.match(companyRegex);

        if (matches) {
          result.profileData.fallbackCompanies = matches;
        }
      }

      await page.close();
    } catch (err) {
      result.error = err.message;
    }

    console.log(JSON.stringify(result));
  }

  await browser.close();
})();
