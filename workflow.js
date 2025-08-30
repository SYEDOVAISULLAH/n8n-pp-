const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium-browser',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--incognito']
  });

  // Get LinkedIn URL and Company Name from command line arguments
  const args = process.argv.slice(2);
  const linkedInProfile = args[0];  // The person's LinkedIn profile URL
  const companyName = args[1];      // The company name to check

  let result = { linkedInProfile, foundCompany: false, previousCompanies: [], error: null };

  try {
    const page = await browser.newPage();
    
    // Go to the LinkedIn profile
    let response = await page.goto(linkedInProfile, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    if (response) {
      result.status = response.status();
      result.statusText = response.statusText();
    }

    // Wait for the page content to load
    await page.waitForTimeout(5000);

    // Step 1: Scrape the current and previous job companies from the LinkedIn profile
    const jobHistory = await page.$$eval(
      '.experience-section li .pv-entity__secondary-title',  // This selector targets company names in the experience section
      items => items.map(item => item.innerText.trim())
    );

    // Step 2: Check if the person currently works or has worked at the specified company
    result.previousCompanies = jobHistory;  // Store all previous companies

    if (jobHistory.some(company => company.toLowerCase().includes(companyName.toLowerCase()))) {
      result.foundCompany = true;  // If the company is found, set the flag to true
    }

    // Close the page after scraping
    await page.close();

  } catch (err) {
    result.error = err.message;
  }

  // Output the result in JSON format
  console.log(JSON.stringify(result));

  // Close the browser when done
  await browser.close();
})();
