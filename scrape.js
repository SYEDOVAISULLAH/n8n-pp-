const puppeteer = require("puppeteer");

(async () => {
  const url = process.argv[2];

  if (!url || typeof url !== "string" || !url.startsWith("http")) {
    console.error("❌ Invalid or missing URL argument:", url);
    process.exit(1);
  }

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(url, { waitUntil: "domcontentloaded" });
  console.log("✅ Loaded:", url);

  await browser.close();
})();
