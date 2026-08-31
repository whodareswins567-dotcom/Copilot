const fs = require('fs');
const path = require('path');

const css = fs.readFileSync(path.join(__dirname, '..', 'style.css'), 'utf8');
let failures = 0;

function check(label, condition) {
    const result = condition ? 'PASS' : 'FAIL';
    if (!condition) failures++;
    console.log(`[${result}] ${label}`);
    console.assert(condition, label);
}

const resetMatch = css.match(/\*\s*{([^}]*)}/);
const resetBlock = resetMatch ? resetMatch[1] : '';

// FR-5: minimal reset
check('FR-5: universal selector reset block present', !!resetMatch);
check('FR-5: reset includes margin: 0', /margin:\s*0/.test(resetBlock));
check('FR-5: reset includes padding: 0', /padding:\s*0/.test(resetBlock));
check('FR-5: reset includes box-sizing: border-box', /box-sizing:\s*border-box/.test(resetBlock));

const bodyMatch = css.match(/(?:^|\n)\s*body\s*{([^}]*)}/);
const bodyBlock = bodyMatch ? bodyMatch[1] : '';

// FR-6: flexbox centering on body, both axes
check('FR-6: body rule present', !!bodyMatch);
check('FR-6: body uses display: flex', /display:\s*flex/.test(bodyBlock));
check('FR-6: body centers horizontally (justify-content: center)', /justify-content:\s*center/.test(bodyBlock));
check('FR-6: body centers vertically (align-items: center)', /align-items:\s*center/.test(bodyBlock));

console.log(`\n${failures === 0 ? 'ALL CSS STRUCTURE TESTS PASSED' : failures + ' CSS STRUCTURE TEST(S) FAILED'}`);
process.exitCode = failures === 0 ? 0 : 1;
