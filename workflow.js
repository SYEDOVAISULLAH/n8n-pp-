const { chromium } = require('playwright');

// Normalize the company name to make the comparison case-insensitive
function normalizeName(name) {
  return name.toLowerCase().trim();
}

async function scrapeLinkedInProfile(linkedinUrl, company) {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  try {
    // Go to the LinkedIn profile
    await page.goto(linkedinUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Wait for the profile's job history to load
    await page.waitForSelector('.pv-entity__secondary-title');

    // Extract the current company and job title
    const profileData = await page.evaluate(() => {
      const currentJobTitle = document.querySelector('.pv-entity__secondary-title')?.innerText || '';
      const currentCompany = document.querySelector('.pv-entity__secondary-title')?.innerText || '';
      return { currentJobTitle, currentCompany };
    });

    // Normalize both company name and LinkedIn profile data to lowercase for comparison
    const normalizedCompany = normalizeName(company);
    const normalizedProfileCompany = normalizeName(profileData.currentCompany);

    // Check if the company is mentioned in the profile
    const foundCompany = normalizedProfileCompany.includes(normalizedCompany);

    await browser.close();
    return foundCompany; // Return true if the company is mentioned, otherwise false
  } catch (error) {
    console.error(`Error while scraping LinkedIn profile: ${error.message}`);
    await browser.close();
    return false;
  }
}

// Example usage
const linkedinUrl = 'https://www.linkedin.com/in/some-person'; // Replace with actual LinkedIn URL
const company = 'Example Corp'; // The company you're checking for

scrapeLinkedInProfile(linkedinUrl, company)
  .then((found) => {
    if (found) {
      console.log('The person works at the company!');
    } else {
      console.log('The person does not work at the company.');
    }
  })
  .catch((err) => console.error(err));

