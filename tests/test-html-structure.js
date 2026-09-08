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

// FR-1: title "TODO App"
check('FR-1: <title>TODO App</title> present', /<title>\s*TODO App\s*<\/title>/i.test(html));

// FR-1: doctype + html lang
check('FR-1: <!DOCTYPE html> present', /^<!DOCTYPE html>/i.test(html.trim()));
check('FR-1: <html lang="en"> present', /<html[^>]*\blang="en"/i.test(html));

const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
const head = headMatch ? headMatch[1] : '';
const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
const body = bodyMatch ? bodyMatch[1] : '';

// FR-2: style.css linked in head, script.js at end of body
check('FR-2: <link href="style.css"> present in <head>', /<link[^>]*href="style\.css"[^>]*>/i.test(head));
check('FR-2: <link> is inside <head> (not body)', !/<link[^>]*href="style\.css"[^>]*>/i.test(body));

const scriptTagRegex = /<script[^>]*src="script\.js"[^>]*><\/script>\s*$/i;
check('FR-2: <script src="script.js"> is the last element in <body>', scriptTagRegex.test(body.trim()));
check('FR-2: <script src="script.js"> is not in <head>', !/<script[^>]*src="script\.js"/i.test(head));

// FR-3: UTF-8 charset + viewport meta, no favicon required
check('FR-3: UTF-8 charset meta present', /<meta[^>]*charset="UTF-8"[^>]*>/i.test(head));
check('FR-3: viewport meta present', /<meta[^>]*name="viewport"[^>]*content="[^"]*width=device-width[^"]*"/i.test(head));

// FR-4: empty div#app placeholder
check('FR-4: <div id="app"></div> present and empty', /<div\s+id="app">\s*<\/div>/i.test(body));

// Relative paths (no leading "/") per architecture
check('Relative path: style.css href has no leading slash', !/href="\/style\.css"/i.test(head));
check('Relative path: script.js src has no leading slash', !/src="\/script\.js"/i.test(body));

console.log(`\n${failures === 0 ? 'ALL HTML STRUCTURE TESTS PASSED' : failures + ' HTML STRUCTURE TEST(S) FAILED'}`);
process.exitCode = failures === 0 ? 0 : 1;
