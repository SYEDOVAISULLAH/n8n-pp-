const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium-browser',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  // Arguments: node verify.js "John Doe" "ABC Corp" "New York" "NY"
  const [personName, companyName, city, state] = process.argv.slice(2);

  const query = `${personName} ${companyName} ${city} ${state}`;
  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;

  let result = {
    person: personName,
    company: companyName,
    city,
    state,
    query,
    searchUrl,
    checkedLinks: [],
    verified: false
  };

  try {
    const page = await browser.newPage();
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Get top 5–10 organic result links
    const links = await page.$$eval("a", as =>
      as.map(a => a.href).filter(h =>
        h.startsWith("http") &&
        !h.includes("google.com") &&
        !h.includes("webcache.googleusercontent.com")
      ).slice(0, 10)
    );

    for (const link of links) {
      let linkResult = { link, mentionsPerson: false, mentionsCompany: false, mentionsCityState: false };

      try {
        const subPage = await browser.newPage();
        await subPage.goto(link, { waitUntil: "domcontentloaded", timeout: 30000 });

        const text = await subPage.evaluate(() => document.body.innerText);

        // Check for mentions
        if (text.toLowerCase().includes(personName.toLowerCase())) {
          linkResult.mentionsPerson = true;
        }
        if (text.toLowerCase().includes(companyName.toLowerCase())) {
          linkResult.mentionsCompany = true;
        }
        if (
          text.toLowerCase().includes(city.toLowerCase()) ||
          text.toLowerCase().includes(state.toLowerCase())
        ) {
          linkResult.mentionsCityState = true;
        }

        if (linkResult.mentionsPerson && linkResult.mentionsCompany && linkResult.mentionsCityState) {
          result.verified = true;
        }

        await subPage.close();
      } catch (err) {
        linkResult.error = err.message;
      }

      result.checkedLinks.push(linkResult);
    }

    await page.close();
  } catch (err) {
    result.error = err.message;
  }

  console.log(JSON.stringify(result, null, 2));
  await browser.close();
})();
