const { chromium } = require("playwright");

(async () => {
  const [,, person, company, city, state] = process.argv;
  const query = `${person} ${company} ${city} ${state}`;
  const log = [];

  // Launch browser
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/usr/bin/chromium-browser'
  });
  
  // Use a single page for all verification
  const page = await browser.newPage();

  async function getLinks(selectors, engineName) {
    for (const sel of selectors) {
      try {
        await page.waitForSelector(sel, { timeout: 10000 }); // Timeout reduced for faster execution
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

  // Run the search engines in parallel
  const enginePromises = engines.map(engine => {
    return page.goto(engine.url, { waitUntil: "domcontentloaded", timeout: 10000 })  // Timeout reduced for faster execution
      .then(() => getLinks(engine.selectors, engine.name))
      .catch(e => log.push(`${engine.name} failed to load: ${e.message}`));
  });

  // Wait for all engines to finish
  const allLinks = await Promise.all(enginePromises);
  links = allLinks.flat().slice(0, 3);  // Limit to the first 3 links for each engine

  let verified = false;

  // Loop through links to verify if the person is listed with the company
  const verificationPromises = links.map(async (link) => {
    try {
      await page.goto(link, { timeout: 10000, waitUntil: "domcontentloaded" }); // Timeout reduced
      const text = await page.content();

      // Normalize text and check if both person's name and company are mentioned on the page
      const pageText = text.toLowerCase();  // Case insensitive
      if (pageText.includes(person.toLowerCase()) && pageText.includes(company.toLowerCase())) {
        verified = true;
        log.push(`Verified match on ${link}`);
      } else {
        log.push(`Checked ${link} → no match`);
      }
    } catch (e) {
      log.push(`Error visiting ${link}: ${e.message}`);
    }
  });

  // Wait for all verification tasks to complete
  await Promise.all(verificationPromises);

  await browser.close();

  // Output the results in a structured JSON format
  console.log(JSON.stringify({
    person,
    company,
    city,
    state,
    query,
    searchUrl: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,  // Use the DuckDuckGo query URL
    checkedLinks: links,
    verified,
    log
  }, null, 2));
})();
