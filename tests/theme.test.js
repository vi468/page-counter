import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Страж темы: палитра живёт только в theme.css, обе страницы берут её оттуда,
// и тёмная схема описана теми же токенами, что и светлая. Иначе тёмная тема
// тихо отваливается в одном месте, и это видно только в браузере.

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');

const DARK_BLOCK = /@media \(prefers-color-scheme: dark\)/;

// Цветовые токены обязаны быть в обеих схемах.
const COLOR_TOKENS = [
  '--bg', '--card', '--card-2', '--card-3', '--line', '--line-2', '--track',
  '--text', '--muted', '--dim', '--accent', '--accent-2', '--accent-soft',
  '--on-accent', '--ok', '--ok-soft', '--danger', '--danger-soft', '--shadow',
];

// Геометрия и шрифт от схемы не зависят — им хватает базового блока.
const SHAPE_TOKENS = ['--radius', '--radius-sm', '--font'];

function splitSchemes(css) {
  const darkAt = css.search(DARK_BLOCK);
  assert.notEqual(darkAt, -1, 'в theme.css нет блока prefers-color-scheme: dark');
  return { light: css.slice(0, darkAt), dark: css.slice(darkAt) };
}

test('светлая и тёмная схемы описывают один и тот же набор токенов', () => {
  const css = read('theme.css');
  assert.match(css, /color-scheme:\s*light dark/);
  const { light, dark } = splitSchemes(css);

  for (const token of COLOR_TOKENS) {
    const re = new RegExp(`${token}\\s*:`);
    assert.match(light, re, `в светлой теме нет ${token}`);
    assert.match(dark, re, `в тёмной теме нет ${token}`);
  }
  for (const token of SHAPE_TOKENS) {
    assert.match(light, new RegExp(`${token}\\s*:`), `в теме нет ${token}`);
  }

  // Значения разные: копипаст светлых значений в тёмный блок означает, что
  // тему забыли переопределить.
  assert.doesNotMatch(dark, /--bg:\s*#f7f4ee/, 'фон тёмной темы остался светлым');
  assert.doesNotMatch(dark, /--text:\s*#1f1d1a/, 'текст тёмной темы остался светлым');
});

test('страницы подключают общие токены раньше своих стилей', () => {
  for (const [page, own] of [
    ['popup/popup.html', 'popup.css'],
    ['options/options.html', 'options.css'],
  ]) {
    const html = read(page);
    const themeAt = html.indexOf('href="../theme.css"');
    const ownAt = html.indexOf(`href="${own}"`);
    assert.notEqual(themeAt, -1, `${page} не подключает theme.css`);
    assert.notEqual(ownAt, -1, `${page} не подключает ${own}`);
    assert.ok(themeAt < ownAt, `в ${page} theme.css должен идти до ${own}`);
  }
});

test('в вёрстке попапа и настроек нет литеральных цветов', () => {
  for (const css of ['popup/popup.css', 'options/options.css']) {
    const text = read(css);
    assert.doesNotMatch(text, /#[0-9a-fA-F]{3,8}\b/, `${css}: цвет задан литералом, а не токеном`);
    assert.doesNotMatch(text, /\b(rgb|rgba|hsl|hsla)\(/, `${css}: цвет задан литералом, а не токен`);
  }
});

test('каждый var(--…) на страницах объявлен в theme.css', () => {
  const theme = read('theme.css');
  const defined = new Set([...theme.matchAll(/(--[a-z0-9-]+)\s*:/g)].map((m) => m[1]));

  for (const css of ['popup/popup.css', 'options/options.css']) {
    for (const m of read(css).matchAll(/var\((--[a-z0-9-]+)\)/g)) {
      assert.ok(defined.has(m[1]), `${css}: токен ${m[1]} не объявлен в theme.css`);
    }
  }
});

test('атрибут hidden побеждает display: flex из вёрстки', () => {
  // Форма нового счётчика и блок подтверждения импорта помечены hidden, но их
  // собственные display: flex сильнее правила браузера — базовое правило темы
  // обязано их прятать, иначе на странице висят пустые блоки.
  const css = read('theme.css');
  assert.match(css, /\[hidden\]\s*\{\s*display:\s*none\s*!important/);
});
