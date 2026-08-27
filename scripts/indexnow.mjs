/**
 * Ping IndexNow (Bing, Yandex, Seznam, Naver) with the sitemap's URLs.
 *
 * IndexNow is the only way to notify Bing without a Webmaster Tools account:
 * ownership is proved by hosting a key file on the domain, not by signing in.
 * The key file is public/362e8d4f45435d9456232b04b6d2ef48.txt and must be live before this runs.
 *
 * Usage: node scripts/indexnow.mjs [--dry]
 */
const KEY = '362e8d4f45435d9456232b04b6d2ef48';
const HOST = 'flightpowers.com';
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;

const sitemap = await (await fetch(`https://${HOST}/sitemap.xml`)).text();
const urlList = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
if (urlList.length === 0) throw new Error('sitemap returned no <loc> entries');

// The key file has to resolve or IndexNow rejects the whole batch as 403.
const probe = await fetch(KEY_LOCATION);
if (!probe.ok) throw new Error(`key file not live: ${KEY_LOCATION} returned ${probe.status}`);

console.log(`${urlList.length} urls, key file OK`);
if (process.argv.includes('--dry')) process.exit(0);

const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList }),
});
console.log('IndexNow responded', res.status, res.statusText);
