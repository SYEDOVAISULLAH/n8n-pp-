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

  async function getLinks(selectors) {
    for (const sel of selectors) {
      try {
        await page.waitForSelector(sel, { timeout: 3000 });
        const found = await page.$$eval(sel, as =>
          as.map(a => a.href).filter(h => h.startsWith("http"))
        );
        if (found.length) return found;
      } catch (e) {
        // ignore and try next selector
      }
    }
    return [];
  }

  let links = [];

  // Try DuckDuckGo first
  try {
    await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 15000 });
    links = await getLinks([
      "a.result__a",
      "a[data-testid='result-title-a']"
    ]);
  } catch (e) {
    // ignore, fallback to Bing
  }

  // Fallback to Bing
  if (links.length === 0) {
    searchUrl = `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
    try {
      await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 15000 });
      links = await getLinks([
        "li.b_algo h2 a",
        ".b_title h2 a",
        ".b_algo a"
      ]);
    } catch (e) {
      // ignore
    }
  }

  links = links.slice(0, 5); // keep top 5

  let verified = false;

  for (const link of links) {
    try {
      const resPage = await browser.newPage();
      await resPage.goto(link, { timeout: 15000, waitUntil: "domcontentloaded" });
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
