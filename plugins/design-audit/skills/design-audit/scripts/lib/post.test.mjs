import { test } from 'node:test';
import assert from 'node:assert/strict';
import { finishMeasure } from './post.mjs';

test('finishMeasure derives mono count and repeated phrases and drops the raw fields', () => {
	const raw = {
		title: 'x',
		tells: { cardLikeBoxes: 1 },
		fontsOutsideCode: { Inter: 10, monospace: 3 },
		contentText: 'big claim here\nbig claim here\nbig claim here'
	};
	const out = finishMeasure(raw);
	assert.equal(out.tells.monoTextElements, 3);
	assert.deepEqual(out.repeated, [['big claim here', 3]]);
	assert.equal(out.contentText, undefined);
	assert.equal(out.fontsOutsideCode, undefined);
	assert.equal(out.tells.cardLikeBoxes, 1);
	assert.equal(raw.contentText !== undefined, true, 'input stays untouched');
});
