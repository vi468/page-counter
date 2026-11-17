import test from 'node:test';
import assert from 'node:assert/strict';
import { installChromeMock, createEvent } from './_chrome-mock.js';

// Попап с иконки снят в режиме счёта, но пункт меню «Открыть попап» обязан
// показать его на один раз и вернуть иконке прежнее поведение, когда попап
// закроется. Порт от попапа — единственный сигнал «попап закрылся».

let caseId = 0;
async function loadBackground(options) {
  const mock = installChromeMock(options);
  await import(`../background.js?popup-menu=${++caseId}`);
  return mock;
}

const flush = () => new Promise((resolve) => setImmediate(resolve));
const TAB = { id: 7, url: 'https://example.com/page', windowId: 3 };

function popupOpenPort() {
  return { name: 'popup-open', onDisconnect: createEvent() };
}

test('«Открыть попап» прикрепляет попап к иконке и открывает его', async () => {
  const { chrome, calls } = await loadBackground({
    counters: [],
    settings: { defaultScope: 'domain', iconClickAction: 'increment' },
    tabs: [TAB],
  });

  await chrome.contextMenus.onClicked.listeners[0]({ menuItemId: 'open-popup' }, TAB);
  await flush();

  assert.ok(
    calls.setPopup.some((options) => options.popup === 'popup/popup.html'),
    'попап должен быть прикреплён к иконке перед открытием',
  );
  assert.equal(calls.openPopup, 1, 'openPopup должен быть вызван один раз');
});

test('закрытие попапа возвращает режим счёта по клику', async () => {
  const { chrome, calls } = await loadBackground({
    counters: [],
    settings: { defaultScope: 'domain', iconClickAction: 'increment' },
    tabs: [TAB],
  });

  const port = popupOpenPort();
  chrome.runtime.onConnect.listeners[0](port);
  await port.onDisconnect.listeners[0]();
  await flush();

  assert.equal(
    calls.setPopup.at(-1).popup,
    '',
    'после закрытия попапа иконка снова должна считать',
  );
});

test('при настройке «открыть попап» попап остаётся на иконке', async () => {
  const { chrome, calls } = await loadBackground({
    counters: [],
    settings: { defaultScope: 'domain', iconClickAction: 'openPopup' },
    tabs: [TAB],
  });

  const port = popupOpenPort();
  chrome.runtime.onConnect.listeners[0](port);
  await port.onDisconnect.listeners[0]();
  await flush();

  assert.equal(
    calls.setPopup.at(-1).popup,
    'popup/popup.html',
    'в этом режиме попап не снимается',
  );
});
