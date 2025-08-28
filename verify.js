const { chromium } = require('playwright');

// Normalize function to handle name variations like "Dr." or "Mr." and make the comparison case-insensitive
function normalizeName(name) {
  // Remove common titles like 'Dr.', 'Mr.', etc., and trim any extra spaces
  return name.replace(/^(Dr\.|Mr\.|Mrs\.|Ms\.)\s*/i, '').toLowerCase().trim();
}

(async () => {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium-browser',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  // Get URLs and person name from command line arguments
  const args = process.argv.slice(2);
  const websiteUrl = args[0];   // The company website URL
  const personName = args[1];   // The person's name to search for

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

    // Step 1: Scrape links for team pages (About Us, Our Team, etc.)
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

    // Step 3: Check if any team page contains the person’s name
    if (teamLinks.length > 0) {
      for (const link of teamLinks) {
        const employeeNames = await extractEmployeeNames(link);
        result.employeeNames.pus
