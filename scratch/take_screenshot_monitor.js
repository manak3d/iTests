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
    await new Promise(r => setTimeout(r, 3000));
    
    // click "Vstoupit do nástěnky"
    const buttons = await page.$$('button');
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && text.includes('Vstoupit do nástěnky')) {
        await btn.click();
        break;
      }
    }
    
    await new Promise(r => setTimeout(r, 3000));
    await page.screenshot({ path: 'scratch/teacher_dashboard2.png' });
    
    // Check if there is any application error text
    const content = await page.content();
    if (content.includes('Application error')) {
      console.log("FOUND APPLICATION ERROR AFTER DASHBOARD LOAD!");
    } else {
      console.log("No Application error text found in DOM.");
    }

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await browser.close();
  }
})();
