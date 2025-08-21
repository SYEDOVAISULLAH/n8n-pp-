const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium-browser',  // 👈 system Chromium path in Alpine
    headless: true
  });

  const page = await browser.newPage();
  await page.goto('https://www.abilenefamilydentistry.com');

  console.log(await page.content());

  await browser.close();
})();
