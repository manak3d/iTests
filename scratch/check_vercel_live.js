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

  page.on('requestfailed', request => {
    console.error('REQUEST FAILED:', request.url(), request.failure().errorText);
  });

  try {
    await page.goto('https://i-tests.vercel.app', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 2000));
    
    // Login
    const usernameInput = await page.$$('input');
    // username is the first one, password is the second one, wait, if there are multiple inputs?
    // let's just type into input[placeholder*="jan.novak"]
    await page.type('input[placeholder*="jan.novak"]', 'testu');
    await page.type('input[type="password"]', 'heslo');
    await page.click('button[type="submit"]');
    
    await new Promise(r => setTimeout(r, 5000));
    
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
