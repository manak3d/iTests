const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  try {
    await page.goto('https://i-tests.vercel.app', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 2000));
    
    await page.type('input[placeholder*="jan.novak"]', 'testu');
    await page.type('input[type="password"]', 'heslo');
    await page.click('button[type="submit"]');
    
    await new Promise(r => setTimeout(r, 5000));
    await page.screenshot({ path: 'scratch/teacher_dashboard.png' });
    console.log("Screenshot taken.");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await browser.close();
  }
})();
