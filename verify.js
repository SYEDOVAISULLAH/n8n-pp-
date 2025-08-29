const { chromium } = require('playwright');

// Normalize the name by removing titles like "Dr.", "Mr.", etc., and trimming extra spaces
function normalizeName(name) {
  return name.replace(/^(Dr\.|Mr\.|Mrs\.|Ms\.)\s*/i, '').toLowerCase().trim();
}

(async () => {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium-browser',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  // Get the full name, first name, last name, and website URL from command line arguments
  const args = process.argv.slice(4);
  const websiteUrl = args[0];   // The company website URL
  const fullName = args[1];     // The full name (e.g., "Hamid Amiri")
  const firstName = args[2];    // The person's first name (e.g., "Hamid")
  const lastName = args[3];     // The person's last name (e.g., "Amiri")

  let result = { url: websiteUrl, foundEmployee: false, employeeNames: [], error: null };

  try {
    const page = await browser.newPage();
    
    // Go to the company website
    let response = await page.goto(websiteUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    if (response) {
      result.status = response.status();
      result.statusText = response.statusText();
    }

    // Wait for the page content to load
    await page.waitForTimeout(5000);

    // Scrape links for team pages (About Us, Our Team, etc.)
    const teamLinks = await page.$$eval(
      'a[href*="team"], a[href*="about"], a[href*="staff"], a[href*="our-team"]',  // Looking for common team-related keywords
      anchors => anchors.map(a => a.href)
    );

    // Step 2: Extract employee names from the team pages if found
    const extractEmployeeNames = async (url) => {
      try {
        const employeeNames = [];
        const teamPage = await browser.newPage();
        await teamPage.goto(url, { waitUntil: 'domcontentloaded' });

        // Wait for the page to load
        await teamPage.waitForTimeout(5000);

        // Scrape visible employee details, looking for headings or specific classes that contain staff names
        const names = await teamPage.$$eval(
          'h2, h3, .staff-name, .team-member',  // Add more selectors based on the website structure
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

    // Step 3: Check if any team page contains the person's name (first name, last name, or full name)
    if (teamLinks.length > 0) {
      for (const link of teamLinks) {
        const employeeNames = await extractEmployeeNames(link);
        result.employeeNames.push(...employeeNames);  // Collect all employee names

        // Normalize and compare the employee names with the target person's first, last, or full name
        if (employeeNames.some(name => 
          normalizeName(name).includes(normalizeName(firstName)) ||  // Check first name
          normalizeName(name).includes(normalizeName(lastName)) ||   // Check last name
          normalizeName(name).includes(normalizeName(fullName))      // Check full name
        )) {
          result.foundEmployee = true;
          break;  // If the person is found, stop checking further
        }
      }
    }

    // Step 4: If no employee name found in the team pages, check the main page for mentions
    if (!result.foundEmployee) {
      const mainPageText = await page.evaluate(() => document.body.innerText);

      // Normalize and check if any part of the name (first, last, or full name) is mentioned anywhere on the main page
      if (
        mainPageText.toLowerCase().includes(normalizeName(firstName)) || 
        mainPageText.toLowerCase().includes(normalizeName(lastName)) || 
        mainPageText.toLowerCase().includes(normalizeName(fullName))
      ) {
        result.foundEmployee = true;
      }
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
