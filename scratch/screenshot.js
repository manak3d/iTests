const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({width: 1280, height: 800});
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  await page.goto('http://localhost:3006/?monitor=123', { waitUntil: 'networkidle0' });
  await page.screenshot({path: 'scratch/livemonitor_test2.png'});
  await browser.close();
  console.log('Screenshot saved');
})();
