const test = require('node:test');
const assert = require('node:assert/strict');
const { isValidStory, createSession, verifySession, passwordsMatch } = require('../netlify/functions/lib/security.cjs');

test('accepts non-empty story text and preserves long messages', () => {
  assert.equal(isValidStory('Aku sedang lelah'), true);
  assert.equal(isValidStory('   '), false);
  assert.equal(isValidStory('x'.repeat(20000)), true);
});

test('creates a signed 24-hour session and rejects tampering', () => {
  const token = createSession('secret', 1_800_000_000_000);
  assert.equal(verifySession(token, 'secret', 1_800_000_000_000 + 1000), true);
  assert.equal(verifySession(token + 'x', 'secret', 1_800_000_000_000 + 1000), false);
  assert.equal(verifySession(token, 'wrong', 1_800_000_000_000 + 1000), false);
});

test('session expires after 24 hours', () => {
  const now = 1_800_000_000_000;
  const token = createSession('secret', now);
  assert.equal(verifySession(token, 'secret', now + 24 * 60 * 60 * 1000 - 1), true);
  assert.equal(verifySession(token, 'secret', now + 24 * 60 * 60 * 1000 + 1), false);
});

test('compares passwords without throwing on unequal lengths', () => {
  assert.equal(passwordsMatch('test-pass', 'test-pass'), true);
  assert.equal(passwordsMatch('test-pass', 'test-pass!'), false);
});
