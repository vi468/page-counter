import test from 'node:test';
import assert from 'node:assert/strict';
import { installChromeMock } from './_chrome-mock.js';

// Режим клика по сайтам: попап вешается на конкретную вкладку, общая настройка
// остаётся режимом по умолчанию. Один сайт считает кликом, другой открывает
// попап — одновременно.

let caseId = 0;
async function loadBackground(options) {
  const mock = installChromeMock(options);
  await import(`../background.js?site-modes=${++caseId}`);
  return mock;
}

const flush = () => new Promise((resolve) => setImmediate(resolve));

const COUNT_TAB = { id: 1, url: 'https://count.example/page', windowId: 1 };
const POPUP_TAB = { id: 2, url: 'https://popup.example/page', windowId: 1 };

function popupsForTab(calls, tabId) {
  return calls.setPopup.filter((options) => options.tabId === tabId).map((o) => o.popup);
}

test('сайт с попапом открывает попап, соседний сайт продолжает считать', async () => {
  const { chrome, calls } = await loadBackground({
    counters: [],
    settings: {
      defaultScope: 'domain',
      iconClickAction: 'increment',
      siteModes: { 'popup.example': 'popup' },
    },
    tabs: [COUNT_TAB, POPUP_TAB],
  });

  calls.setPopup.length = 0;
  await chrome.tabs.onActivated.listeners[0]({ tabId: POPUP_TAB.id });
  await flush();
  await chrome.tabs.onActivated.listeners[0]({ tabId: COUNT_TAB.id });
  await flush();

  assert.equal(popupsForTab(calls, POPUP_TAB.id).at(-1), 'popup/popup.html');
  assert.equal(popupsForTab(calls, COUNT_TAB.id).at(-1), '', 'на этом сайте попапа нет');
});

test('галочка в меню включает попап для текущего сайта', async () => {
  const tab = { id: 7, url: 'https://docs.example.com/page', windowId: 1 };
  const { chrome, storage } = await loadBackground({
    counters: [],
    settings: { defaultScope: 'domain', iconClickAction: 'increment' },
    tabs: [tab],
  });

  await chrome.contextMenus.onClicked.listeners[0](
    { menuItemId: 'site-popup-mode', checked: true },
    tab,
  );
  await flush();

  assert.equal(storage.settings.siteModes['docs.example.com'], 'popup');
});

test('выключенная галочка возвращает сайт к общей настройке', async () => {
  const tab = { id: 7, url: 'https://docs.example.com/page', windowId: 1 };
  const { chrome, storage } = await loadBackground({
    counters: [],
    settings: {
      defaultScope: 'domain',
      iconClickAction: 'increment',
      siteModes: { 'docs.example.com': 'popup' },
    },
    tabs: [tab],
  });

  await chrome.contextMenus.onClicked.listeners[0](
    { menuItemId: 'site-popup-mode', checked: false },
    tab,
  );
  await flush();

  assert.equal(
    storage.settings.siteModes['docs.example.com'],
    undefined,
    'запись совпала с общим режимом — её не храним',
  );
});

test('при общей настройке «попап» сайт может считать кликом', async () => {
  const tab = { id: 3, url: 'https://count.example/page', windowId: 1 };
  const { chrome, calls } = await loadBackground({
    counters: [],
    settings: {
      defaultScope: 'domain',
      iconClickAction: 'openPopup',
      siteModes: { 'count.example': 'count' },
    },
    tabs: [tab],
  });

  calls.setPopup.length = 0;
  await chrome.tabs.onActivated.listeners[0]({ tabId: tab.id });
  await flush();

  assert.equal(popupsForTab(calls, tab.id).at(-1), '');
});

test('галочка в меню отражает режим текущего сайта', async () => {
  const { chrome, calls } = await loadBackground({
    counters: [],
    settings: {
      defaultScope: 'domain',
      iconClickAction: 'increment',
      siteModes: { 'popup.example': 'popup' },
    },
    tabs: [POPUP_TAB],
  });

  await chrome.tabs.onActivated.listeners[0]({ tabId: POPUP_TAB.id });
  await flush();

  const updates = calls.update.filter((item) => item.id === 'site-popup-mode');
  assert.ok(updates.length > 0, 'галочка должна обновляться');
  assert.equal(updates.at(-1).checked, true, 'на сайте с попапом галочка стоит');
});
