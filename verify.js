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
        await page.waitForSelector(sel, { timeout: 3000 });
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

  // Try DuckDuckGo first
  try {
    await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 15000 });
    log.push("Navigated to DuckDuckGo");
    links = await getLinks([
      "a.result__a",
      "a[data-testid='result-title-a']"
    ], "DuckDuckGo");
  } catch (e) {
    log.push(`DuckDuckGo navigation failed: ${e.message}`);
  }

  // Fallback to Bing
  if (links.length === 0) {
    searchUrl = `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
    try {
      await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 15000 });
      log.push("Navigated to Bing");
      links = await getLinks([
        "li.b_algo h2 a",
        ".b_title h2 a",
        ".b_algo a"
      ], "Bing");
    } catch (e) {
      log.push(`Bing navigation failed: ${e.message}`);
    }
  }

  links = links.slice(0, 5);

  let verified = false;

  for (const link of links) {
    try {
      const resPage = await browser.newPage();
      await resPage.goto(link, { timeout: 15000, waitUntil: "domcontentloaded" });
      const text = await resPage.content();

      if (text.includes(person) && text.includes(company)) {
        verified = true;
        log.push(`Verified match on ${link}`);
        await resPage.close();
        break;
      } else {
        log.push(`Checked ${link} → no match`);
      }
      await resPage.close();
    } catch (e) {
      log.push(`Error visiting ${link}: ${e.message}`);
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
    verified,
    log
  }, null, 2));
})();


