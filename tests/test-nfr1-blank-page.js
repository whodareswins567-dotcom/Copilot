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
const appMatch = body.match(/<div\s+id="app">([\s\S]*?)<\/div>\s*<script/i);
const appContent = appMatch ? appMatch[1] : '';

// TODO-4 supersedes TODO-2's NFR-1 (blank page): #app must now render the
// task form, error element, and task list — and nothing beyond them.
check('#app contains exactly one <form id="task-form">', (appContent.match(/<form\s+id="task-form">/gi) || []).length === 1);
check('#app contains exactly one inline error element (id="task-error")', (appContent.match(/id="task-error"/gi) || []).length === 1);
check('#app contains exactly one task list container (<ul id="task-list">)', (appContent.match(/<ul\s+id="task-list">/gi) || []).length === 1);

// Strip known elements (whose own visible text, e.g. the "Add" button label, is expected
// per FR-1) before checking for any stray/unexpected text left directly in #app.
const strayText = appContent
    .replace(/<form\s+id="task-form">[\s\S]*?<\/form>/i, '')
    .replace(/<p\s+id="task-error"[^>]*>[\s\S]*?<\/p>/i, '')
    .replace(/<ul\s+id="task-list">[\s\S]*?<\/ul>/i, '')
    .replace(/<[^>]*>/g, '')
    .trim();
check('#app has no visible text content outside the known elements', strayText.length === 0);
check('body outside #app and the script tag has no extra markup', body.replace(/<div\s+id="app">[\s\S]*?<\/div>/i, '').replace(/<script[^>]*src="script\.js"[^>]*><\/script>/i, '').trim().length === 0);

console.log(`\n${failures === 0 ? 'ALL VISIBLE-UI STRUCTURE TESTS PASSED' : failures + ' VISIBLE-UI STRUCTURE TEST(S) FAILED'}`);
process.exitCode = failures === 0 ? 0 : 1;
