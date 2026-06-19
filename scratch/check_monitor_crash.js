const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error('BROWSER ERROR:', msg.text());
    } else {
      console.log('BROWSER LOG:', msg.text());
    }
  });

  page.on('pageerror', error => {
    console.error('PAGE ERROR EXCEPTION:', error.message);
  });

  try {
    const url = 'https://i-tests.vercel.app/?monitor=2s9a57p31';
    console.log(`Navigating to ${url}...`);
    await page.goto(url, { waitUntil: 'networkidle0' });
    console.log("Navigation complete.");
    
    await new Promise(r => setTimeout(r, 4000));
    const content = await page.content();
    if (content.includes('Application error')) {
      console.log("FOUND APPLICATION ERROR IN DOM!");
    } else {
      console.log("No Application error text found in DOM.");
    }
  } catch (err) {
    console.error("Test script error:", err);
  } finally {
    await browser.close();
  }
})();
