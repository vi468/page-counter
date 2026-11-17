import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { installChromeMock } from './_chrome-mock.js';

// Мок chrome нужен до импорта lib/i18n.js: модуль читает язык системы на
// импорте. В моке язык русский, значит по умолчанию словарь русский.
installChromeMock();
const { DICTS, LANGS, getLang, setLang, t, applyI18n, langFromLocale } = await import('../lib/i18n.js');

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');

test('системный язык определяет словарь, а setLang переключает', () => {
  assert.equal(getLang(), 'ru');
  assert.equal(t('popup.empty'), 'Нет счётчиков. Создайте новый ↓');

  setLang('en');
  assert.equal(getLang(), 'en');
  assert.equal(t('popup.empty'), 'No counters yet. Create one ↓');

  setLang('ru');
  assert.equal(t('popup.empty'), 'Нет счётчиков. Создайте новый ↓');

  // Незнакомый язык игнорируется, язык не сбрасывается в неизвестное.
  setLang('de');
  assert.equal(getLang(), 'ru');
  assert.deepEqual(LANGS.sort(), ['en', 'ru']);
});

test('словари описывают одни и те же ключи и не пустуют', () => {
  const ru = Object.keys(DICTS.ru).sort();
  const en = Object.keys(DICTS.en).sort();
  assert.deepEqual(ru, en, 'наборы ключей в ru и en должны совпадать');

  for (const lang of LANGS) {
    for (const [key, value] of Object.entries(DICTS[lang])) {
      const strings = typeof value === 'string' ? [value] : Object.values(value);
      for (const item of strings) {
        assert.ok(String(item).trim().length > 0, `${lang}: пустое значение ${key}`);
      }
    }
  }
});

test('t подставляет параметры', () => {
  setLang('ru');
  assert.equal(t('popup.menu.reset', { value: 5 }), 'Сбросить к 5');
  assert.equal(t('options.stepLabel', { n: 3 }), 'шаг 3');

  setLang('en');
  assert.equal(t('popup.menu.reset', { value: 5 }), 'Reset to 5');
  assert.equal(t('options.stepLabel', { n: 3 }), 'step 3');
});

test('числа согласуются по правилам языка', () => {
  setLang('ru');
  assert.match(t('options.importConfirm', { n: 1 }), /Импортировать 1 счётчик\?/);
  assert.match(t('options.importConfirm', { n: 3 }), /Импортировать 3 счётчика\?/);
  assert.match(t('options.importConfirm', { n: 5 }), /Импортировать 5 счётчиков\?/);
  assert.match(t('options.importConfirm', { n: 11 }), /Импортировать 11 счётчиков\?/);
  assert.match(t('options.importConfirm', { n: 21 }), /Импортировать 21 счётчик\?/);

  setLang('en');
  assert.match(t('options.importConfirm', { n: 1 }), /Import 1 counter\?/);
  assert.match(t('options.importConfirm', { n: 2 }), /Import 2 counters\?/);
});

test('локаль превращается в один из двух языков', () => {
  assert.equal(langFromLocale('ru'), 'ru');
  assert.equal(langFromLocale('ru-RU'), 'ru');
  assert.equal(langFromLocale('RU'), 'ru');
  assert.equal(langFromLocale('en-US'), 'en');
  assert.equal(langFromLocale('de-DE'), 'en');
  assert.equal(langFromLocale(undefined), 'en');
});

test('незнакомый ключ возвращается как есть, а не молча пустеет', () => {
  assert.equal(t('popup.no.such.key'), 'popup.no.such.key');
});

test('applyI18n переводит текст, title и placeholder', () => {
  setLang('en');
  const text = { dataset: { i18n: 'popup.newCounter' }, textContent: '' };
  const titleEl = { dataset: { i18nTitle: 'popup.openSettings' }, title: '' };
  const input = { dataset: { i18nPlaceholder: 'popup.namePlaceholder' }, placeholder: '' };
  const fakeRoot = {
    querySelectorAll(selector) {
      if (selector === '[data-i18n]') return [text];
      if (selector === '[data-i18n-title]') return [titleEl];
      if (selector === '[data-i18n-placeholder]') return [input];
      return [];
    },
  };

  applyI18n(fakeRoot);
  assert.equal(text.textContent, '+ New counter');
  assert.equal(titleEl.title, 'Settings');
  assert.equal(input.placeholder, 'Name');
  setLang('ru');
});

test('ключи из вёрстки и кода объявлены в словарях', () => {
  const keys = new Set();

  for (const page of ['popup/popup.html', 'options/options.html']) {
    const html = read(page);
    for (const m of html.matchAll(/data-i18n(?:-title|-placeholder)?="([^"]+)"/g)) {
      keys.add(m[1]);
    }
  }
  for (const js of ['popup/popup.js', 'options/options.js', 'background.js']) {
    for (const m of read(js).matchAll(/\bt\('([^']+)'/g)) keys.add(m[1]);
  }

  assert.ok(keys.size > 30, 'ключей должно быть много, проверка не должна быть пустой');
  for (const key of keys) {
    for (const lang of LANGS) {
      assert.ok(key in DICTS[lang], `${lang}: ключа ${key} нет в словаре`);
    }
  }
});
