import { test } from 'node:test';
import assert from 'node:assert/strict';
import { repeatedPhrases } from './ngrams.mjs';

test('counts bigrams and trigrams that occur at least three times', () => {
	const text = 'fast reliable hosting. fast reliable hosting. fast reliable hosting. other words here';
	const result = repeatedPhrases(text);
	assert.deepEqual(result, [['fast reliable hosting', 3]]);
});

test('drops bigrams that sit inside a surviving trigram', () => {
	const text = 'alpha beta gamma\nalpha beta gamma\nalpha beta gamma';
	const grams = repeatedPhrases(text).map(([g]) => g);
	assert.deepEqual(grams, ['alpha beta gamma']);
});

test('keeps a bigram when no trigram survives around it', () => {
	const text = 'solar panels\nsolar panels\nsolar panels\nsolar panels roof\nother line';
	const grams = repeatedPhrases(text).map(([g]) => g);
	assert.deepEqual(grams, ['solar panels']);
});

test('does not build phrases across line breaks', () => {
	const text = 'end one\nstart two\nend one\nstart two\nend one\nstart two';
	const grams = repeatedPhrases(text).map(([g]) => g);
	assert.ok(!grams.includes('one start'));
	assert.deepEqual(new Set(grams), new Set(['end one', 'start two']));
});

test('sorts by count and respects the limit', () => {
	const text = ['aaa bbb', 'aaa bbb', 'aaa bbb', 'aaa bbb', 'ccc ddd', 'ccc ddd', 'ccc ddd'].join('\n');
	assert.deepEqual(repeatedPhrases(text, { limit: 1 }), [['aaa bbb', 4]]);
});

test('empty and short input yields an empty list', () => {
	assert.deepEqual(repeatedPhrases(''), []);
	assert.deepEqual(repeatedPhrases('a b'), []);
});
