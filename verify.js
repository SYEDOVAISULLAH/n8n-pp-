const { chromium } = require("playwright");

(async () => {
  const [,, person, company, city, state] = process.argv;
  const query = `${person} ${company} ${city} ${state}`;
  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;

const browser = await chromium.launch({
  headless: true,
  executablePath: '/usr/bin/chromium-browser'
});
  const page = await browser.newPage();
  await page.goto(searchUrl, { waitUntil: "domcontentloaded" });

  // Grab first 5 result links
  const links = await page.$$eval('a', as => as
    .map(a => a.href)
    .filter(href => href.startsWith("http"))
    .slice(0, 5)
  );

  let verified = false;

  for (const link of links) {
    try {
      const resPage = await browser.newPage();
      await resPage.goto(link, { timeout: 15000 });
      const text = await resPage.content();

      if (text.includes(person) && text.includes(company)) {
        verified = true;
        await resPage.close();
        break;
      }
      await resPage.close();
    } catch (e) {
      // ignore bad links
    }
  }

  await browser.close();

  console.log(JSON.stringify({
    person,
    company,
    city,
    state,
    query,
    searchUrl,
    checkedLinks: links,
    verified
  }, null, 2));
})();
