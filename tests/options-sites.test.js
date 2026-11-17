import test from 'node:test';
import assert from 'node:assert/strict';
import { installChromeMock } from './_chrome-mock.js';
import { installDomMock, getElement, findAllByClass, fireOn } from './_dom-mock.js';

// Список «Режим клика по сайтам» в настройках: что нарисовано, что пишется в
// хранилище при смене режима и при удалении записи. Диалогов здесь нет — правило
// страницы настроек действует и на этот блок.

installDomMock();
const { storage } = installChromeMock({
  counters: [],
  settings: {
    defaultScope: 'domain',
    iconClickAction: 'increment',
    siteModes: { 'b.example': 'count', 'a.example': 'popup' },
  },
});
await import('../options/options.js?sites=1');

const flush = () => new Promise((resolve) => setImmediate(resolve));
const rows = () => findAllByClass(getElement('sites-list'), 'site-row');
const hostOf = (row) => row.children[0].textContent;
const selectOf = (row) => row.children[1];
const deleteOf = (row) => row.children[2];

test('сайты отрисованы по алфавиту со своими режимами', () => {
  assert.deepEqual(rows().map(hostOf), ['a.example', 'b.example']);
  assert.equal(selectOf(rows()[0]).value, 'popup');
  assert.equal(selectOf(rows()[1]).value, 'count');
});

test('смена режима в списке сохраняется в настройки', async () => {
  const row = rows()[0];
  const select = selectOf(row);
  select.value = 'count';
  await Promise.all(fireOn(select, 'change'));
  await flush();

  assert.equal(storage.settings.siteModes['a.example'], 'count');
  assert.equal(selectOf(rows()[0]).value, 'count', 'список перерисован');
});

test('крестик убирает запись сайта — он снова живёт по общей настройке', async () => {
  const row = rows()[1];
  await Promise.all(fireOn(deleteOf(row), 'click'));
  await flush();

  assert.equal('b.example' in storage.settings.siteModes, false);
  assert.deepEqual(rows().map(hostOf), ['a.example']);
});

test('когда записей нет, список объясняет пустое состояние', async () => {
  await Promise.all(fireOn(deleteOf(rows()[0]), 'click'));
  await flush();

  const empty = findAllByClass(getElement('sites-list'), 'manager-empty')[0];
  assert.ok(empty, 'пустое состояние показано');
  assert.match(empty.textContent, /правым кликом по иконке/);
});
