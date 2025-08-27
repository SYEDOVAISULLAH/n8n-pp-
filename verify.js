const { chromium } = require("playwright");

(async () => {
  const [,, person, company, city, state] = process.argv;
  const query = `${person} ${company} ${city} ${state}`;
  const log = [];

  const searchEngines = {
    duckduckgo: {
      url: q => `https://duckduckgo.com/?q=${encodeURIComponent(q)}`,
      selectors: ["a.result__a", "a[data-testid='result-title-a']"],
    },
    bing: {
      url: q => `https://www.bing.com/search?q=${encodeURIComponent(q)}`,
      selectors: ["li.b_algo h2 a", ".b_title h2 a", ".b_algo a"],
    }
  };

  let links = [];
  let usedEngine = null;

  const browser = await chromium.launch({
    headless: true,
    executablePath: '/usr/bin/chromium-browser'
  });
  const page = await browser.newPage();

  // Function to scrape links for one engine
  async function scrapeEngine(name, engine) {
    try {
      await page.goto(engine.url(query), { waitUntil: "domcontentloaded", timeout: 15000 });
      log.push(`Navigated to ${name}`);
      for (const sel of engine.selectors) {
        try {
          await page.waitForSelector(sel, { timeout: 3000 });
          const found = await page.$$eval(sel, as =>
            as.map(a => a.href).filter(h => h.startsWith("http"))
          );
          if (found.length) {
            log.push(`${name}: Found ${found.length} results with selector ${sel}`);
            return found;
          } else {
            log.push(`${name}: Selector ${sel} returned no links`);
          }
        } catch (e) {
          log.push(`${name}: Failed selector ${sel} → ${e.message}`);
        }
      }
    } catch (e) {
      log.push(`${name}: Navigation failed → ${e.message}`);
    }
    return [];
  }

  // Try DuckDuckGo, then Bing
  for (const [name, engine] of Object.entries(searchEngines)) {
    links = await scrapeEngine(name, engine);
    if (links.length > 0) {
      usedEngine = name;
      break;
    }
  }

  links = links.slice(0, 5);

  let verified = false;
  const checked = [];

  for (const link of links) {
    try {
      const resPage = await browser.newPage();
      await resPage.goto(link, { timeout: 15000, waitUntil: "domcontentloaded" });
      const text = await resPage.content();

      if (text.includes(person) && text.includes(company)) {
        verified = true;
        log.push(`✅ Verified match on ${link}`);
        checked.push({ link, match: true });
        await resPage.close();
        break;
      } else {
        log.push(`❌ Checked ${link} → no match`);
        checked.push({ link, match: false });
      }
      await resPage.close();
    } catch (e) {
      log.push(`⚠️ Error visiting ${link}: ${e.message}`);
      checked.push({ link, error: e.message });
    }
  }

  await browser.close();

  console.log(JSON.stringify({
    person,
    company,
    city,
    state,
    query,
    searchEngine: usedEngine,
    checkedLinks: checked,
    verified,
    log
  }, null, 2));
})();
