const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error('BROWSER ERROR:', msg.text());
    }
  });

  page.on('pageerror', error => {
    console.error('PAGE ERROR EXCEPTION:', error.message);
  });

  try {
    const url = 'https://i-tests.vercel.app/?monitor=2s9a57p31';
    await page.goto(url, { waitUntil: 'networkidle0' });
    
    // wait for store to load
    await new Promise(r => setTimeout(r, 5000));
    
    await page.screenshot({ path: 'scratch/monitor_crash.png' });
    
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
