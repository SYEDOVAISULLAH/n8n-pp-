const { chromium } = require("playwright");

async function verify(entry) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  entry.log = entry.log || [];

  const searchEngines = [
    {
      name: "duckduckgo",
      url: q => `https://duckduckgo.com/?q=${encodeURIComponent(q)}`,
      selectors: ["a.result__a", "a[data-testid='result-title-a']"],
    },
    {
      name: "bing",
      url: q => `https://www.bing.com/search?q=${encodeURIComponent(q)}`,
      selectors: [
        "li.b_algo h2 a",
        ".b_title h2 a",
        ".b_algo a"
      ],
    },
  ];

  let verified = false;

  for (const engine of searchEngines) {
    try {
      entry.searchEngine = engine.name;
      const searchUrl = engine.url(entry.query);
      entry.searchUrl = searchUrl;

      await page.goto(searchUrl, { timeout: 15000 });
      entry.log.push(`Navigated to ${engine.name}: ${searchUrl}`);

      let link = null;

      for (const selector of engine.selectors) {
        try {
          await page.waitForSelector(selector, { timeout: 5000 });
          const element = await page.locator(selector).first();
          link = await element.getAttribute("href");
          if (link) {
            entry.checkedLinks.push(link);
            entry.log.push(`${engine.name}: Found link with selector ${selector} → ${link}`);
            verified = true;
            break;
          }
        } catch (err) {
          entry.log.push(`${engine.name}: Failed selector ${selector} → ${err.message}`);
        }
      }

      if (verified) break;
    } catch (err) {
      entry.log.push(`${engine.name}: Navigation error → ${err.message}`);
    }
  }

  entry.verified = verified;
  await browser.close();
  return entry;
}

module.exports = verify;
