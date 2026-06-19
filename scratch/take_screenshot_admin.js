const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  try {
    await page.goto('https://i-tests.vercel.app', { waitUntil: 'networkidle0' });
    
    await page.type('input[placeholder*="jan.novak"]', 'admin');
    await page.type('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await new Promise(r => setTimeout(r, 3000));
    
    await page.screenshot({ path: 'scratch/admin_dashboard.png' });
    
    const content = await page.content();
    if (content.includes('Application error')) {
      console.log("FOUND APPLICATION ERROR FOR ADMIN!");
    } else {
      console.log("No error found for admin.");
    }
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await browser.close();
  }
})();
