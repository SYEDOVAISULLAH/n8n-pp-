const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium-browser',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  // Get LinkedIn URL and Company Name from command line arguments
  const args = process.argv.slice(2);
  const linkedInProfile = args[0];  // The person's LinkedIn profile URL
  const companyName = args[1];      // The company name to check

  let result = { linkedInProfile, foundCompany: false, error: null };

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

    // Step 1: Extract the raw HTML of the LinkedIn profile page
    const pageHTML = await page.content();  // This will get the full HTML content of the page

    // Step 2: Check if the company name is found in the HTML content
    if (pageHTML.toLowerCase().includes(companyName.toLowerCase())) {
      result.foundCompany = true;  // If the company name is found, set the flag to true
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
