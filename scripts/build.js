// Builds the Tampermonkey/Violentmonkey userscript from extension/fix.js,
// so the extension and the userscript always contain the same code.
// Usage: node scripts/build.js
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const repo = 'independenttriball/Gas-Station-Junkyard-Tycoon-Youtube-premium-reward-FIX';
const file = 'yt-playables-premium-rewards.user.js';
const rawUrl = `https://raw.githubusercontent.com/${repo}/main/${file}`;

const manifest = JSON.parse(fs.readFileSync(path.join(root, 'extension', 'manifest.json'), 'utf8'));
const fix = fs.readFileSync(path.join(root, 'extension', 'fix.js'), 'utf8');

const header = `// ==UserScript==
// @name         ${manifest.name}
// @namespace    https://github.com/${repo}
// @version      ${manifest.version}
// @description  ${manifest.description}
// @homepageURL  https://github.com/${repo}
// @supportURL   https://github.com/${repo}/issues
// @downloadURL  ${rawUrl}
// @updateURL    ${rawUrl}
// @match        https://www.youtube.com/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

`;

fs.writeFileSync(path.join(root, file), header + fix);
console.log(`wrote ${file} (v${manifest.version})`);
