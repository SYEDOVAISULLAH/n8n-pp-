const { chromium } = require("playwright");

(async () => {
  const [,, person, company, city, state] = process.argv;
  const query = `${person} ${company} ${city} ${state}`;
  let searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;

  const browser = await chromium.launch({
    headless: true,
    executablePath: '/usr/bin/chromium-browser'
  });
  const page = await browser.newPage();

  let links = [];

  try {
    await page.goto(searchUrl, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("a.result__a", { timeout: 10000 });
    links = await page.$$eval("a.result__a", as =>
      as.map(a => a.href).filter(href => href.startsWith("http")).slice(0, 5)
    );
  } catch (e) {
    // ignore, will try Bing
  }

  // Fallback to Bing if DuckDuckGo gave no results
  if (links.length === 0) {
    searchUrl = `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
    await page.goto(searchUrl, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("li.b_algo h2 a", { timeout: 10000 });
    links = await page.$$eval("li.b_algo h2 a", as =>
      as.map(a => a.href).filter(href => href.startsWith("http")).slice(0, 5)
    );
  }

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
