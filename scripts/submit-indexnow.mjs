// scripts/submit-indexnow.mjs
//
// Pushes every URL in the live sitemap to IndexNow, which feeds Bing --
// and therefore DuckDuckGo, which serves results from Bing's index.
// Adult search traffic skews toward both, and Google does not use
// IndexNow, so this is purely additive.
//
// The key below must match the file public/c3a44b2fe121cf6bfd3ee069788284f3.txt
// (same string, served at https://pantypost.com/c3a44b2fe121cf6bfd3ee069788284f3.txt --
// that file is how IndexNow proves the submitter owns the site).
//
// Run AFTER a deploy, from the repo root:
//
//   node scripts/submit-indexnow.mjs
//
// Safe to run as often as you like; resubmitting unchanged URLs is
// permitted and ignored. Requires Node 18+ (built-in fetch).

const HOST = 'pantypost.com';
const KEY = 'c3a44b2fe121cf6bfd3ee069788284f3';
const SITEMAP = `https://${HOST}/sitemap.xml`;

async function main() {
  const res = await fetch(SITEMAP);
  if (!res.ok) {
    console.error(`Could not fetch ${SITEMAP}: ${res.status}`);
    process.exit(1);
  }
  const xml = await res.text();

  const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)]
    .map((m) => m[1].trim())
    .filter((u) => u.startsWith(`https://${HOST}`));

  if (urls.length === 0) {
    console.error('Sitemap contained no URLs for this host. Nothing sent.');
    process.exit(1);
  }

  const payload = {
    host: HOST,
    key: KEY,
    keyLocation: `https://${HOST}/${KEY}.txt`,
    urlList: urls,
  };

  const submit = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload),
  });

  // 200 = accepted, 202 = accepted (key pending validation).
  console.log(`Submitted ${urls.length} URLs -> HTTP ${submit.status}`);
  if (submit.status === 403) {
    console.error(
      'Key not validated. Confirm the key file is deployed at ' +
        payload.keyLocation
    );
    process.exit(1);
  }
  if (submit.status >= 400) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
