import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';

test('build.js emits index.html with the shell markers resolved', () => {
  execFileSync(process.execPath, ['build.js'], { cwd: process.cwd() });
  assert.ok(existsSync('index.html'), 'index.html should exist');
  const html = readFileSync('index.html', 'utf8');
  assert.ok(!html.includes('/*SCRIPT*/'), 'SCRIPT marker must be replaced');
  assert.ok(!html.includes('/*STYLE*/'), 'STYLE marker must be replaced');
  assert.ok(html.includes('<script>'), 'bundle script tag present');
});

test('build.js emits test/bundle.mjs that parses as ESM', () => {
  execFileSync(process.execPath, ['build.js'], { cwd: process.cwd() });
  const bundle = readFileSync('test/bundle.mjs', 'utf8');
  assert.match(bundle, /^export \{/m, 'bundle must end with an export statement');
});

test('every name in src/exports.json is actually defined in the bundle', () => {
  execFileSync(process.execPath, ['build.js'], { cwd: process.cwd() });
  const names = JSON.parse(readFileSync('src/exports.json', 'utf8'));
  const bundle = readFileSync('test/bundle.mjs', 'utf8');
  for (const name of names) {
    assert.match(bundle, new RegExp(`\\b(?:const|function|class|let)\\s+${name}\\b`),
      `exported name "${name}" is not defined in the bundle`);
  }
});
