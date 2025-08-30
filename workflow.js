let response = await page.goto(linkedInProfile, {
  waitUntil: 'domcontentloaded',
  timeout: 60000
});

console.log('Response Status:', response.status(), response.statusText()); // Log the status of the page
