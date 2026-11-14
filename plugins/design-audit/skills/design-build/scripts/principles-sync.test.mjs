// Drift guard: design-build ships its own copy of the rules, because a skill installed on its own
// cannot read a sibling folder. The two files must stay identical.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const buildCopy = fileURLToPath(new URL('../references/principles.md', import.meta.url));
const auditCopy = fileURLToPath(new URL('../../design-audit/references/principles.md', import.meta.url));
const auditFolder = fileURLToPath(new URL('../../design-audit/', import.meta.url));

const skip = existsSync(auditFolder)
	? false
	: 'skills/design-audit is not installed (standalone design-build install); nothing to compare';

test('design-build principles.md equals the design-audit copy', { skip }, () => {
	assert.ok(existsSync(auditCopy), 'skills/design-audit/references/principles.md is missing');
	assert.ok(existsSync(buildCopy), 'skills/design-build/references/principles.md is missing');
	assert.equal(
		readFileSync(buildCopy, 'utf8'),
		readFileSync(auditCopy, 'utf8'),
		'principles.md differs. Edit skills/design-audit/references/principles.md, then run: cp skills/design-audit/references/principles.md skills/design-build/references/principles.md'
	);
});
