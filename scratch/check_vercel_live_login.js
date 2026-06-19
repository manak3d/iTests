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
    const url = 'https://i-tests-cjakxzwae-manak3ds-projects.vercel.app';
    console.log(`Navigating to ${url}...`);
    await page.goto(url, { waitUntil: 'networkidle0' });
    
    // login as admin
    await page.type('input[placeholder*="jan.novak"]', 'admin');
    await page.type('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    await new Promise(r => setTimeout(r, 4000));
    
    const content = await page.content();
    if (content.includes('Application error')) {
      console.log("FOUND APPLICATION ERROR FOR ADMIN!");
    } else {
      console.log("No Application error for admin.");
    }
    
    // clear cookies and try testu
    await page.deleteCookie(...await page.cookies());
    await page.evaluate(() => localStorage.clear());
    
    await page.goto(url, { waitUntil: 'networkidle0' });
    await page.type('input[placeholder*="jan.novak"]', 'testu');
    await page.type('input[type="password"]', 'heslo');
    await page.click('button[type="submit"]');
    
    await new Promise(r => setTimeout(r, 4000));
    const content2 = await page.content();
    if (content2.includes('Application error')) {
      console.log("FOUND APPLICATION ERROR FOR TESTU!");
    } else {
      console.log("No Application error for testu.");
    }
    
  } catch (err) {
    console.error("Test script error:", err);
  } finally {
    await browser.close();
  }
})();
