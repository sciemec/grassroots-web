const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.setViewportSize({ width: 1280, height: 860 });

  // Get auth token from backend
  const resp = await page.request.post('https://bhora-ai.onrender.com/api/v1/auth/login', {
    data: { email: 'player@grassrootssports.live', password: 'Player123!' },
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
  });
  const body = await resp.json();
  const token = body.token || body.access_token || (body.data && body.data.token) || '';
  console.log('Token:', token ? 'YES (' + token.substring(0,20) + '...)' : 'NO', '| Status:', resp.status());
  console.log('Body keys:', Object.keys(body));

  // Inject token via localStorage
  await page.goto('https://grassrootssports.live');
  await page.evaluate(function(t) {
    localStorage.setItem('auth_token', t);
    var store = { state: { user: { role: 'player', name: 'Test Player' }, token: t, _hasHydrated: true }, version: 0 };
    localStorage.setItem('auth-storage', JSON.stringify(store));
  }, token);

  await page.goto('https://grassrootssports.live/player/business-school');
  await page.waitForTimeout(5000);
  await page.screenshot({ path: 'D:/bhora-ai/grassroots-web/business-school-preview.png' });
  console.log('Screenshot saved');
  await browser.close();
})().catch(function(e) { console.error(e.message); process.exit(1); });
