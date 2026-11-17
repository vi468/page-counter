import test from 'node:test';
import assert from 'node:assert/strict';
import { installChromeMock } from './_chrome-mock.js';
import { installDomMock, getElement } from './_dom-mock.js';

// Тот же попап, но язык принудительно английский. Проверяем, что t() и
// applyI18n действительно доходят до интерфейса, а не только до словаря.
installDomMock();
installChromeMock({ counters: [], tabs: [] });

const { setLang } = await import('../lib/i18n.js');
setLang('en');
await import('../popup/popup.js?lang=en');

test('попап на английском: без вкладки показывает английскую заглушку', () => {
  assert.equal(getElement('scope-indicator').textContent, 'No active page');
  assert.equal(getElement('toggle-new').hidden, true);
  assert.equal(getElement('new-form').hidden, true);
});
