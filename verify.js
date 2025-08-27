const { chromium } = require("playwright");

// List of proxies (add more free proxies here if necessary)
const proxies = [
  "http://51.158.68.133:8811",  // Example proxies
  "http://185.44.12.85:8080",
  "http://51.15.79.41:3128"
];

(async () => {
  const [,, person, company, city, state] = process.argv;
  const query = `${person} ${company} ${city} ${state}`;
  const log = [];

  const browser = await chromium.launch({
    headless: true,
    executablePath: '/usr/bin/chromium-browser',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Function to randomly pick a proxy from the list
  const getRandomProxy = () => {
    const proxy = proxies[Math.floor(Math.random() * proxies.length)];
    return proxy;
  };

  // Function to apply the selected proxy
  const applyProxy = async () => {
    const proxy = getRandomProxy();
    await page.context().setHTTPCredentials({
      proxy: {
        server: proxy, // Apply the proxy to the page
      }
    });
    log.push(`Using proxy: ${proxy}`);
  };

  const engines = [
    { name: 'Google', url: `https://www.google.com/search?q=${encodeURIComponent(query)}`, selectors: ["h3", ".tF2Cxc"] },
    { name: 'LinkedIn', url: `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(person)}%20${encodeURIComponent(company)}`, selectors: ["a.search-result__result-link"] }
  ];

  // Search and verify in parallel
  const enginePromises = engines.map(engine => {
    return page.goto(engine.url, { waitUntil: "domcontentloaded", timeout: 30000 })
      .then(async () => {
        await applyProxy();
        return getLinks(engine.selectors, engine.name);
      })
      .catch(e => log.push(`${engine.name} failed to load: ${e.message}`));
  });

  const getLinks = async (selectors, engineName) => {
    for (const sel of selectors) {
      try {
        await page.waitForSelector(sel, { timeout: 20000 });
        const found = await page.$$eval(sel, as => 
          as.map(a => a.href).filter(h => h && h.startsWith("http"))
        );
        if (found.length) {
          log.push(`${engineName}: Found ${found.length} results with selector ${sel}`);
          return found;
        } else {
          log.push(`${engineName}: No results found`);
        }
      } catch (e) {
        log.push(`${engineName}: Failed on selector ${sel} → ${e.message}`);
      }
    }
    return [];
  };

  const allLinks = await Promise.all(enginePromises);
  let verified = false;

  const verificationPromises = allLinks.flat().map(async (link) => {
    try {
      await page.goto(link, { timeout: 10000, waitUntil: "domcontentloaded" });
      const text = await page.content();

      const pageText = text.toLowerCase(); // Case insensitive search
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

  await Promise.all(verificationPromises);

  await browser.close();

  console.log(JSON.stringify({
    person,
    company,
    city,
    state,
    query,
    verified,
    log
  }, null, 2));
})();
