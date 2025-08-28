const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium-browser',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const urls = process.argv.slice(2); // Read URLs from command line arguments

  // Loop through each URL to scrape
  for (const url of urls) {
    let result = { url, mapLinks: [], addresses: [], foundEmployee: false };

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

      // Wait for content to load
      await page.waitForTimeout(5000);

      // 1. Scrape links to specific pages like 'About Us', 'Our Team', etc.
      const teamLinks = await page.$$eval(
        'a[href*="team"], a[href*="about"], a[href*="staff"], a[href*="our-team"]', // Searching for common team-related keywords
        anchors => anchors.map(a => a.href)
      );

      // 2. Try to extract employee names from the pages
      const extractEmployeeNames = async (url) => {
        try {
          const employeeNames = [];
          const teamPage = await browser.newPage();
          await teamPage.goto(url, { waitUntil: 'domcontentloaded' });

          // Wait for the page to load
          await teamPage.waitForTimeout(5000);

          // Scrape staff names or any visible employee details (this can be customized based on the page structure)
          const names = await teamPage.$$eval(
            'h2, h3, .staff-name, .team-member', // Add other potential selectors for employee names
            elements => elements.map(el => el.innerText.trim())
          );

          employeeNames.push(...names);
          await teamPage.close();
          return employeeNames;
        } catch (err) {
          console.error(`Error scraping team page: ${err.message}`);
          return [];
        }
      };

      // If 'Our Team' or similar pages are found, scrape employee names
      if (teamLinks.length > 0) {
        for (const link of teamLinks) {
          const employeeNames = await extractEmployeeNames(link);
          if (employeeNames.length > 0) {
            // Here, you can compare employee names with the person’s name (from the sheet)
            const personName = "John Doe";  // This should come from your Google Sheets data (e.g., via n8n input)
            if (employeeNames.some(name => name.toLowerCase().includes(personName.toLowerCase()))) {
              result.foundEmployee = true;
              break;  // If employee is found, stop checking further
            }
          }
        }
      }

      // If no employee name found in the team pages, check the main page for mentions
      if (!result.foundEmployee) {
        const mainPageText = await page.evaluate(() => document.body.innerText);
        const personName = "John Doe";  // This should come from your Google Sheets data

        // Check if the person's name is mentioned anywhere on the main page
        if (mainPageText.toLowerCase().includes(personName.toLowerCase())) {
          result.foundEmployee = true;
        }
      }

      // Final result (whether employee is found or not)
      await page.close();
    } catch (err) {
      result.error = err.message;
    }

    console.log(JSON.stringify(result));  // Output the result in JSON format
  }

  await browser.close();
})();
