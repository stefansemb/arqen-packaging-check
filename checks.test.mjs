// Run with: node --test
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { checkChapters, checkDescription, checkTags, checkThumbnail, checkTitle, parseChapters, tagLength } from './checks.js';

const levels = (list) => list.map((i) => i.level);

test('title length and shouting', () => {
  assert.deepEqual(levels(checkTitle('')), ['fail']);
  assert.equal(checkTitle('I Built a Fully Automated AI News Channel').at(0).level, 'pass');
  assert.equal(checkTitle('x'.repeat(80)).at(0).level, 'warn');
  assert.equal(checkTitle('x'.repeat(101)).at(0).level, 'fail');
  assert.ok(checkTitle('THIS IS THE BEST AI TOOL EVER').some((i) => i.text.includes('CAPITALS')));
  assert.ok(checkTitle('Is this real?? Watch this now').some((i) => i.text.includes('clickbait')));
});

test('chapters follow YouTube rules', () => {
  const ok = '0:00 Intro\n1:05 Setup\n3:40 Results';
  assert.deepEqual(parseChapters(ok).map((c) => c.seconds), [0, 65, 220]);
  assert.deepEqual(levels(checkChapters(ok)), ['pass']);
  assert.ok(checkChapters('0:30 Intro\n1:05 A\n2:00 B').some((i) => i.text.includes('0:00')));
  assert.ok(checkChapters('0:00 Intro\n1:05 A').some((i) => i.text.includes('at least 3')));
  assert.ok(checkChapters('0:00 Intro\n0:05 A\n2:00 B').some((i) => i.text.includes('10 seconds')));
  assert.ok(checkChapters('1:02:03 Long\n0:00 Start').length);
  assert.equal(checkChapters('no timestamps here')[0].level, 'warn');
});

test('description opening, hashtags and length', () => {
  const title = 'Claude Opus Writes My Videos';
  assert.equal(checkDescription('Claude writes every script on this channel.', title)[0].level, 'pass');
  assert.equal(checkDescription('Welcome back to the channel everyone.', title)[0].level, 'warn');
  const tags = Array.from({ length: 16 }, (_, i) => `#tag${i}`).join(' ');
  assert.ok(checkDescription(`Claude video. ${tags}`, title).some((i) => i.level === 'fail'));
});

test('tags count commas and quotes like YouTube', () => {
  assert.equal(tagLength(['ai', 'claude code']), 2 + 13 + 1);
  assert.equal(checkTags('a, b, A')[1].level, 'warn');
  assert.equal(checkTags(Array.from({ length: 60 }, (_, i) => `long tag number ${i}`).join(','))[0].level, 'fail');
});

test('thumbnail size and ratio', () => {
  assert.equal(checkThumbnail({ width: 1280, height: 720, bytes: 300000, type: 'image/jpeg' })[0].level, 'pass');
  assert.ok(checkThumbnail({ width: 1280, height: 720, bytes: 3e6, type: 'image/png' }).some((i) => i.level === 'fail'));
  assert.ok(checkThumbnail({ width: 1000, height: 1000, bytes: 1e5, type: 'image/jpeg' }).some((i) => i.text.includes('16:9')));
});
