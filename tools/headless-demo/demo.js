const puppeteer = require('puppeteer');
const axios = require('axios');
const fs = require('fs');

const apiBase = 'http://localhost:5026/api';
const appUrl = 'http://localhost:3000';

async function waitForApi(url) {
  for (let i = 0; i < 30; i++) {
    try {
      await axios.get(url);
      return true;
    } catch (e) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  return false;
}

(async () => {
  console.log('Waiting for backend...');
  const ok = await waitForApi(apiBase + '/Product');
  if (!ok) {
    console.error('Backend not available');
    process.exit(1);
  }

  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  page.setViewport({ width: 1280, height: 800 });

  console.log('Opening app...');
  await page.goto(appUrl, { waitUntil: 'networkidle2' });
  await page.screenshot({ path: 'tools/headless-demo/1-home.png' });

  // Try login
  try {
    console.log('Attempt login via API...');
    const resp = await axios.post(apiBase.replace('/api','') + '/auth/login', { username: 'admin', password: 'password123' }).catch(e => { throw e; });
    const token = resp.data?.token || resp.data?.accessToken || resp.data?.access_token;
    if (!token) throw new Error('No token returned');
    console.log('Login token obtained');

    // Set token in localStorage via page
    await page.evaluate((t) => localStorage.setItem('erp_token', t), token);
    await page.reload({ waitUntil: 'networkidle2' });
    await page.screenshot({ path: 'tools/headless-demo/2-loggedin.png' });

    // Navigate to Purchase Requests
    await page.goto(appUrl + '/purchase-requests', { waitUntil: 'networkidle2' });
    await page.screenshot({ path: 'tools/headless-demo/3-pr-list.png' });

    // Click New PR
    await page.click('button:has-text("New PR")').catch(() => {});
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'tools/headless-demo/4-pr-form.png' });

    // Add item: open item modal
    await page.click('button:has-text("Add item")');
    await page.waitForSelector('select');
    // pick first product
    await page.select('select', '');
    await page.screenshot({ path: 'tools/headless-demo/5-pr-item-modal.png' });

    // Save item
    await page.click('button:has-text("Save item")');
    await page.waitForTimeout(500);

    // Save PR
    await page.click('button:has-text("Save")');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'tools/headless-demo/6-pr-saved.png' });

  } catch (err) {
    console.error('Headless demo error', err.message || err);
    await page.screenshot({ path: 'tools/headless-demo/error.png' });
  } finally {
    await browser.close();
    console.log('Done, screenshots in tools/headless-demo/');
  }
})();
