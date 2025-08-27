const { chromium } = require("playwright");

(async () => {
  const [,, person, company, city, state] = process.argv;
  const query = `${person} ${company} ${city} ${state}`;
  let searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
  const log = [];

  const browser = await chromium.launch({
    headless: true,
    executablePath: '/usr/bin/chromium-browser'
  });
  const page = await browser.newPage();

  async function getLinks(selectors, engineName) {
    for (const sel of selectors) {
      try {
        await page.waitForSelector(sel, { timeout: 10000 }); // Increased timeout to 10 seconds
        const found = await page.$$eval(sel, as =>
          as.map(a => a.href).filter(h => h.startsWith("http"))
        );
        if (found.length) {
          log.push(`${engineName}: Found ${found.length} results with selector ${sel}`);
          return found;
        } else {
          log.push(`${engineName}: Selector ${sel} returned no links`);
        }
      } catch (e) {
        log.push(`${engineName}: Failed on selector ${sel} → ${e.message}`);
      }
    }
    return [];
  }

  let links = [];

  // Search engines list with respective selectors
  const engines = [
    { name: 'DuckDuckGo', url: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`, selectors: ["a.result__a", "a[data-testid='result-title-a']"] },
    { name: 'Bing', url: `https://www.bing.com/search?q=${encodeURIComponent(query)}`, selectors: ["li.b_algo h2 a", ".b_title h2 a", ".b_algo a"] },
    { name: 'Google', url: `https://www.google.com/search?q=${encodeURIComponent(query)}`, selectors: ["h3", ".tF2Cxc"] },
    { name: 'Yahoo', url: `https://search.yahoo.com/search?p=${encodeURIComponent(query)}`, selectors: ["h3 a", ".ac-algo"] },
  ];

  // Iterate through engines and try to get links
  for (const engine of engines) {
    try {
      await page.goto(engine.url, { waitUntil: "domcontentloaded", timeout: 20000 }); // Increased timeout to 20 seconds
      log.push(`Navigated to ${engine.name}`);
      links = await getLinks(engine.selectors, engine.name);
      if (links.length) break; // Stop if links are found
    } catch (e) {
      log.push(`${engine.name} navigation failed: ${e.message}`);
    }
  }

  links = links.slice(0, 5); // Limit the results to the first 5 links

  let verified = false;

  // Loop through links to verify if the person is listed with the company
  for (const link of links) {
    try {
      const resPage = await browser.newPage();
      await resPage.goto(link, { timeout: 20000, waitUntil: "domcontentloaded" }); // Increased timeout
      const text = await resPage.content();

      // Check if both person's name and company are mentioned on the page
      if (text.includes(person) && text.includes(company)) {
        verified = true;
        log.push(`Verified match on ${link}`);
        await resPage.close();
        break; // Exit loop once a match is found
      } else {
        log.push(`Checked ${link} → no match`);
      }
      await resPage.close();
    } catch (e) {
      log.push(`Error visiting ${link}: ${e.message}`);
    }
  }

  await browser.close();

  // Output the results in a structured JSON format
  console.log(JSON.stringify({
    person,
    company,
    city,
    state,
    query,
    searchUrl,
    checkedLinks: links,
    verified,
    log
  }, null, 2));
})();
