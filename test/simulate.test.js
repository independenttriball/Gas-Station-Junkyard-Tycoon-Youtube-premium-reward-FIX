// Simulates the YouTube page <-> game messaging with real MessageChannels
// and checks what the game receives. Usage: node test/simulate.test.js
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, '..', 'extension', 'fix.js'), 'utf8');

let premium = true;
global.window = global;
global.document = {
  querySelector: (s) => (s === 'ytd-topbar-logo-renderer'
    ? { data: { iconImage: { iconType: premium ? 'YOUTUBE_PREMIUM_LOGO' : 'YOUTUBE_LOGO' } } }
    : null),
};
console.info = () => {};

new Function(src)();

// port1 = YouTube page side, port2 = game side.
// The page listens with onmessage, set after the fix is installed (as in the browser).
// Like YouTube on PC for a Premium account, it rejects every ad request (result 2).
const main = new MessageChannel();
main.port1.onmessage = (e) => {
  const isAd = Array.isArray(e.data) && e.data[0] === 14;
  e.ports[0].postMessage(isAd ? [1, [null, 1, null, null, null, [2]]] : [1, [null, 1]]);
};

function request(data) {
  return new Promise((resolve) => {
    const reply = new MessageChannel();
    reply.port1.onmessage = (e) => { resolve(e.data); reply.port1.close(); };
    main.port2.postMessage(data, [reply.port2]);
  });
}

const rewarded = [14, null, null, null, null, null, null, null, null, null, null, null, [2, 'reward-id']];
const interstitial = [14, null, null, null, null, null, null, null, null, null, null, null, [1]];
const granted = [1, [null, 1, null, null, null, [5]]];
const rejected = [1, [null, 1, null, null, null, [2]]];

(async () => {
  const results = [];
  const check = (name, got, want) => {
    const ok = JSON.stringify(got) === JSON.stringify(want);
    results.push(ok);
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  ->  ${JSON.stringify(got)}`);
  };

  check('rewarded ad, Premium: reward granted', await request(rewarded), granted);
  check('interstitial ad: left as is', await request(interstitial), rejected);
  check('other request: left as is', await request([5]), [1, [null, 1]]);
  premium = false;
  check('rewarded ad, no Premium: left as is', await request(rewarded), rejected);

  main.port1.close();
  main.port2.close();
  const failed = results.filter((ok) => !ok).length;
  console.log(failed ? `${failed} failed` : 'all passed');
  process.exitCode = failed ? 1 : 0;
})();
