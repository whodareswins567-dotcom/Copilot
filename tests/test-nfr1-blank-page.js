const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let failures = 0;

function check(label, condition) {
    const result = condition ? 'PASS' : 'FAIL';
    if (!condition) failures++;
    console.log(`[${result}] ${label}`);
    console.assert(condition, label);
}

const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
const body = bodyMatch ? bodyMatch[1] : '';

// Strip the known, expected elements (the empty #app container and the script tag)
// to see what — if anything — is left over that would render as visible content.
let remainder = body
    .replace(/<div\s+id="app">\s*<\/div>/i, '')
    .replace(/<script[^>]*src="script\.js"[^>]*><\/script>/i, '')
    .trim();

check('NFR-1: <body> contains only the empty #app div and the script tag (no other markup)', remainder.length === 0);

// Ensure #app itself has no text/child content that would be visible.
const appMatch = body.match(/<div\s+id="app">([\s\S]*?)<\/div>/i);
const appContent = appMatch ? appMatch[1].trim() : null;
check('NFR-1: #app container has no inner text/content', appContent === '');

// Ensure there is no stray visible text anywhere directly in <body> (outside tags).
const textOutsideTags = body.replace(/<[^>]*>/g, '').trim();
check('NFR-1: no visible text nodes exist directly in <body>', textOutsideTags.length === 0);

// Edge case: very long/garbage text accidentally left in body would fail the above checks,
// confirming the blank-page guarantee is not just a shallow string match.
check('Edge case: body markup length is minimal (no accidental large content blocks)', body.trim().length < 200);

console.log(`\n${failures === 0 ? 'ALL NFR-1 (BLANK PAGE) TESTS PASSED' : failures + ' NFR-1 TEST(S) FAILED'}`);
process.exitCode = failures === 0 ? 0 : 1;
