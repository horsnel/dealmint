const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:4179/safe-spots', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('input[aria-label="Search safe spots by area or city"]', { timeout: 20000 });
  await page.waitForTimeout(4500); // let primary tiles fail + fallback engage
  const tiles = await page.evaluate(() => ({
    osm: document.querySelectorAll('.leaflet-tile-pane img[src*="tile.openstreetmap.org"]').length,
    carto: document.querySelectorAll('.leaflet-tile-pane img[src*="cartocdn"]').length,
  }));
  console.log('DEFAULT tiles after fallback:', JSON.stringify(tiles));
  await page.screenshot({ path: '/tmp/v48_map_default.png' });
  // layers sheet again (thumbnails + z-bump vs in-flow sheet)
  await page.click('button[aria-label="Map layers"]');
  await page.waitForSelector('text=Map type', { timeout: 5000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: '/tmp/v48_layers2.png' });
  await browser.close();
})();
