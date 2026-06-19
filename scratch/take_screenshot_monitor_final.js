const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  try {
    await page.goto('https://i-tests.vercel.app', { waitUntil: 'networkidle0' });
    
    await page.type('input[placeholder*="jan.novak"]', 'testu');
    await page.type('input[type="password"]', 'heslo');
    await page.click('button[type="submit"]');
    await new Promise(r => setTimeout(r, 2000));
    
    // Click "Vstoupit do nástěnky"
    const buttons = await page.$$('div, button');
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && text === 'Vstoupit do nástěnky') {
        await btn.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 2000));
    
    // Click "Testy" tab
    const tabs = await page.$$('button');
    for (const tab of tabs) {
      const text = await page.evaluate(el => el.textContent, tab);
      if (text && text.includes('Testy')) {
        await tab.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 2000));
    
    // Check if there is "Sledovat živě"
    const liveBtns = await page.$$('button');
    let clickedLive = false;
    for (const btn of liveBtns) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && text.includes('Sledovat živě')) {
        await btn.click();
        clickedLive = true;
        break;
      }
    }
    
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: 'scratch/live_monitor.png' });
    
    const content = await page.content();
    if (content.includes('Application error')) {
      console.log("FOUND APPLICATION ERROR!");
    } else {
      console.log("No error found. Clicked Live? " + clickedLive);
    }
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await browser.close();
  }
})();
