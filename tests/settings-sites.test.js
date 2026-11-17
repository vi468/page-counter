import test from 'node:test';
import assert from 'node:assert/strict';
import { installChromeMock } from './_chrome-mock.js';

// Режим клика по сайтам в модели настроек: мусор из хранилища не должен
// превращаться в действующую настройку, а частичная запись — затирать соседние
// поля. Это тот слой, на который опираются и воркер, и страница настроек.

const { storage } = installChromeMock({ counters: [] });
const { normalizeSettings, siteModeForUrl, updateSettings } = await import('../lib/storage.js');

const settings = (patch = {}) => normalizeSettings({ iconClickAction: 'increment', ...patch });

test('siteModes чистится от мусора и переживает отсутствие в старых данных', () => {
  assert.deepEqual(settings().siteModes, {}, 'без настройки — пусто');

  const dirty = settings({
    siteModes: {
      'ok.example': 'popup',
      'other.example': 'count',
      'bad.example': 'weird',
      '': 'popup',
      'has space': 'count',
      'UPPER.example': 'popup',
    },
  });
  assert.deepEqual(dirty.siteModes, { 'ok.example': 'popup', 'other.example': 'count', 'UPPER.example': 'popup' });

  assert.deepEqual(normalizeSettings({ siteModes: 'nonsense' }).siteModes, {});
  assert.deepEqual(normalizeSettings({ siteModes: ['popup'] }).siteModes, {});
});

test('свой режим сайта важнее общей настройки', () => {
  const popupSites = settings({
    iconClickAction: 'increment',
    siteModes: { 'popup.example': 'popup' },
  });
  assert.equal(siteModeForUrl(popupSites, 'https://popup.example/page'), 'popup');
  assert.equal(siteModeForUrl(popupSites, 'https://count.example/page'), 'count');
  assert.equal(siteModeForUrl(popupSites, 'chrome://extensions'), 'count', 'неизвестный адрес — общая настройка');

  const countSite = settings({
    iconClickAction: 'openPopup',
    siteModes: { 'count.example': 'count' },
  });
  assert.equal(siteModeForUrl(countSite, 'https://count.example/page'), 'count');
  assert.equal(siteModeForUrl(countSite, 'https://other.example/page'), 'popup');
});

test('updateSettings правит одно поле и не затирает остальные', async () => {
  storage.settings = {
    defaultScope: 'domain',
    iconClickAction: 'openPopup',
    siteModes: { 'a.example': 'popup' },
  };

  const afterScope = await updateSettings({ defaultScope: 'url' });
  assert.equal(afterScope.defaultScope, 'url');
  assert.equal(afterScope.iconClickAction, 'openPopup', 'режим клика не потерян');
  assert.deepEqual(afterScope.siteModes, { 'a.example': 'popup' }, 'настройки сайтов не потеряны');

  const afterSites = await updateSettings({ siteModes: { 'b.example': 'count' } });
  assert.equal(afterSites.defaultScope, 'url', 'область по умолчанию не потеряна');
  assert.deepEqual(afterSites.siteModes, { 'b.example': 'count' });
  assert.deepEqual(storage.settings.siteModes, { 'b.example': 'count' }, 'записано в хранилище');
});
