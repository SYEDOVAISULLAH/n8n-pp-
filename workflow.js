const { chromium } = require('playwright');
const Tesseract = require('tesseract.js');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.goto('http://www.linkedin.com/in/your-profile-url', {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  });

  // Take a screenshot of the profile page
  const screenshotPath = '/path/to/screenshot.png';
  await page.screenshot({ path: screenshotPath });

  // Use OCR to extract text from the screenshot
  Tesseract.recognize(screenshotPath, 'eng', { logger: (m) => console.log(m) })
    .then(({ data: { text } }) => {
      console.log('OCR Text:', text);
      // Search for company names in the extracted text
      if (text.toLowerCase().includes('company-name')) {
        console.log('Found the company name!');
      }
    })
    .catch((err) => {
      console.log('Error in OCR:', err);
    });

  await browser.close();
})();
