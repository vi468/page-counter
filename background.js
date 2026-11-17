// Service worker: бейдж на иконке, хоткеи, клик по иконке, очистка tab-счётчиков.

import {
  getAll,
  mutateCounters,
  getSettings,
  getPrimaryCounter,
  pruneTabCounters,
  buildScope,
  createCounter,
  isCounterRelevant,
  normalizeStep,
  setCounterValueIn,
  incrementCounterIn,
  decrementCounterIn,
  getDomainFromUrl,
  siteModeForUrl,
  updateSettings,
} from './lib/storage.js';
import { t } from './lib/i18n.js';

// ---------- Badge ----------

async function updateBadgeForTab(tabId) {
  try {
    const tab = await chrome.tabs.get(tabId);
    if (!tab?.url) {
      await chrome.action.setBadgeText({ tabId, text: '' });
      return;
    }
    const { counters } = await getAll();
    const primary = getPrimaryCounter(counters, { tabId, url: tab.url });
    const text = primary ? String(primary.value) : '';
    await chrome.action.setBadgeText({ tabId, text });
    // Плашка бейджа — красная, как у значка внимания в Project News; цифра
    // белая. Акцентная подложка на терракотовой иконке растворилась бы в фоне.
    await chrome.action.setBadgeBackgroundColor({ tabId, color: '#c0392b' });
    await chrome.action.setBadgeTextColor({ tabId, color: '#fff' });
  } catch {
    // Таб мог быть закрыт — игнорируем.
  }
}

async function updateAllBadges() {
  const tabs = await chrome.tabs.query({});
  await Promise.all(tabs.map((t) => (t.id ? updateBadgeForTab(t.id) : null)));
}

// ---------- Counter mutations ----------

// direction: +1 — прибавить, -1 — убавить. Величина шага берётся у самого
// счётчика в момент мутации, а не из настроек: шаг — свойство счётчика.
// removeAtZero передают только хоткеи: сочетание клавиш — единственный способ
// стереть счётчик, у него нет ни списка, ни кнопки удаления. Клик по иконке и
// пункт меню «обнулить» этого не делают: убавили до нуля — счётчик остался нулём.
async function mutatePrimary(ctx, direction, { removeAtZero = false } = {}) {
  const next = await mutateCounters((counters) => {
    const primary = getPrimaryCounter(counters, ctx);
    if (!primary) return counters;
    const step = normalizeStep(primary.step);
    return direction < 0
      ? decrementCounterIn(counters, primary.id, step, { removeAtZero })
      : incrementCounterIn(counters, primary.id, step);
  });
  return getPrimaryCounter(next, ctx);
}

async function resetPrimary(ctx, { removeAtZero = false } = {}) {
  const next = await mutateCounters((counters) => {
    const primary = getPrimaryCounter(counters, ctx);
    if (!primary) return counters;
    return setCounterValueIn(counters, primary.id, primary.initialValue, { removeAtZero });
  });
  return getPrimaryCounter(next, ctx);
}

async function getActiveCtx() {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (!tab?.id || !tab.url) return null;
  return { tabId: tab.id, url: tab.url };
}

// ---------- Events ----------

// Обновление бейджа и режима иконки при смене таба/URL.
chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  updateBadgeForTab(tabId);
  try {
    const tab = await chrome.tabs.get(tabId);
    await syncTabPopup(tab);
  } catch {
    // Вкладку могли закрыть — тогда синхронизировать нечего.
  }
});
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url || changeInfo.status === 'complete') {
    updateBadgeForTab(tabId);
    syncTabPopup(tab ?? { id: tabId, url: changeInfo.url ?? '' });
  }
});

// Чистим tab-scoped счётчики при закрытии таба.
chrome.tabs.onRemoved.addListener(async (tabId) => {
  await pruneTabCounters(tabId);
});

// Реакция на изменения хранилища — перерисовать бейджи.
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && (changes.counters || changes.settings)) {
    updateAllBadges();
  }
});

// Хоткеи. Alt+↑ ведёт себя как клик по иконке, включая заведение счётчика:
// первое отмеченное действие на странице должно давать единицу, чем бы его
// ни отметили — иконкой или клавиатурой. Alt+↓ и Alt+0 стирают счётчик, когда он
// доходит до нуля: мышь трогает список, а клавиатура — нет, и убрать счётчик
// сочетанием больше нечем.
chrome.commands.onCommand.addListener(async (command) => {
  const ctx = await getActiveCtx();
  if (!ctx) return;
  if (command === 'increment-primary') await incrementPrimary(ctx);
  else if (command === 'decrement-primary') await mutatePrimary(ctx, -1, { removeAtZero: true });
  else if (command === 'reset-primary') await resetPrimary(ctx, { removeAtZero: true });
});

// Клик по иконке — только если в настройках стоит "increment".
// Если popup установлен — этот обработчик НЕ сработает. Поэтому popup снимается/ставится динамически.
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id || !tab.url) return;
  const settings = await getSettings();
  if (settings.iconClickAction !== 'increment') return;
  await incrementPrimary({ tabId: tab.id, url: tab.url });
});

// Прибавить шаг главному счётчику, а если его нет — завести со значением 1.
// Счётчик создаёт только прибавление: убавлять и сбрасывать на пустой странице
// нечего, поэтому Alt+↓ и Alt+0 без счётчика просто ничего не делают.
async function incrementPrimary(ctx) {
  const existing = await mutatePrimary(ctx, +1);
  if (existing) return existing;
  const settings = await getSettings();
  return autoCreatePrimary(ctx, settings.defaultScope);
}

// Создаёт счётчик для текущего контекста со значением 1 (после первого клика).
// Если на этой странице уже есть релевантные счётчики — новый делаем primary,
// старые primary снимает.
async function autoCreatePrimary(ctx, scopeType) {
  const scope = buildScope(scopeType, ctx);
  if (!scope) return null;
  let created = null;
  await mutateCounters((counters) => {
    // Снимаем primary-флаг у всех релевантных.
    const cleared = counters.map((c) =>
      isCounterRelevant(c, ctx) && c.isPrimary ? { ...c, isPrimary: false, updatedAt: Date.now() } : c,
    );
    created = createCounter({
      name: t('counter.defaultName'),
      scope,
      initialValue: 0,
      step: 1,
      isPrimary: true,
    });
    created.value = 1;
    cleared.push(created);
    return cleared;
  });
  return created;
}

// ---------- Режим иконки: общий и по сайтам ----------

const POPUP_PAGE = 'popup/popup.html';
const MENU_SITE_POPUP = 'site-popup-mode';

// Попап вешается на конкретную вкладку: у Chrome попап вкладки важнее общего.
// Поэтому на одном сайте иконка открывает попап, а на другом считает кликом,
// одновременно. Общая настройка задаёт режим по умолчанию для всех.
function popupFor(settings, url) {
  return siteModeForUrl(settings, url) === 'popup' ? POPUP_PAGE : '';
}

// Глобальный попап: новый таб получает его до первого onActivated. Без этого
// сработал бы default_popup из манифеста, то есть попап у всех подряд.
async function applyGlobalPopup(settings) {
  await chrome.action.setPopup({
    popup: settings.iconClickAction === 'openPopup' ? POPUP_PAGE : '',
  });
}

async function applyPopupToTab(tabId, url, knownSettings = null) {
  const settings = knownSettings ?? (await getSettings());
  try {
    await chrome.action.setPopup({ popup: popupFor(settings, url), tabId });
  } catch (err) {
    console.warn('[page-counter] setPopup:', err?.message ?? err);
  }
}

async function applyPopupToAllTabs() {
  const settings = await getSettings();
  await applyGlobalPopup(settings);
  const tabs = await chrome.tabs.query({});
  await Promise.all(
    tabs
      .filter((tab) => tab.id)
      .map((tab) => applyPopupToTab(tab.id, tab.url ?? '', settings)),
  );
}

// Галочка в ПКМ показывает, включён ли попап по клику на текущем сайте.
function updateSitePopupMenu(checked) {
  try {
    chrome.contextMenus.update(MENU_SITE_POPUP, { checked }, () => void chrome.runtime.lastError);
  } catch {
    // Меню ещё не создано (воркер только проснулся) — обновится при следующем событии.
  }
}

async function syncSitePopupMenu(url) {
  const settings = await getSettings();
  updateSitePopupMenu(siteModeForUrl(settings, url) === 'popup');
}

async function syncTabPopup(tab) {
  if (!tab?.id) return;
  await applyPopupToTab(tab.id, tab.url ?? '');
  await syncSitePopupMenu(tab.url ?? '');
}

async function syncActiveSitePopupMenu() {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  await syncSitePopupMenu(tab?.url ?? '');
}

// ---------- Context menu на иконке ----------

// Флаги на жизнь service worker'а: onInstalled и onStartup могут прийти оба,
// повторная настройка меню после успеха — no-op.
let contextMenuReady = false;
let contextMenuInProgress = false;

function setupContextMenu() {
  if (contextMenuReady || contextMenuInProgress) return;
  contextMenuInProgress = true;
  chrome.contextMenus.removeAll(() => {
    let failed = false;
    let pending = 3;
    const onCreated = () => {
      pending -= 1;
      if (pending > 0) return;
      contextMenuInProgress = false;
      // Если хотя бы один create упал — не помечаем готовым, чтобы можно было повторить.
      if (!failed) contextMenuReady = true;
    };
    const create = (options) => {
      chrome.contextMenus.create(options, () => {
        const err = chrome.runtime.lastError;
        if (err) {
          failed = true;
          console.warn('[page-counter] contextMenus.create:', err.message);
        }
        onCreated();
      });
    };
    create({
      id: 'reset-primary',
      title: t('menu.resetPrimary'),
      contexts: ['action'],
    });
    create({
      id: 'open-manager',
      title: t('menu.openManager'),
      contexts: ['action'],
    });
    // Галочка на текущий сайт: включить или выключить попап по клику.
    create({
      id: MENU_SITE_POPUP,
      title: t('menu.sitePopup'),
      type: 'checkbox',
      checked: false,
      contexts: ['action'],
    });
  });
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'reset-primary') {
    if (!tab?.id || !tab.url) return;
    await resetPrimary({ tabId: tab.id, url: tab.url });
  } else if (info.menuItemId === 'open-manager') {
    chrome.runtime.openOptionsPage();
  } else if (info.menuItemId === MENU_SITE_POPUP) {
    await toggleSitePopupMode(tab?.url ?? '', info.checked);
  }
});

// Галочка в меню ставит сайту свой режим. Если он совпал с общим — запись
// убираем, иначе настройка сайта копила бы «как и так по умолчанию».
async function toggleSitePopupMode(url, checked) {
  const host = getDomainFromUrl(url);
  if (!host) return;
  const settings = await getSettings();
  const baseMode = settings.iconClickAction === 'openPopup' ? 'popup' : 'count';
  const nextMode = checked ? 'popup' : 'count';
  const siteModes = { ...settings.siteModes };
  if (nextMode === baseMode) delete siteModes[host];
  else siteModes[host] = nextMode;
  await updateSettings({ siteModes });
  await applyPopupToAllTabs();
  updateSitePopupMenu(nextMode === 'popup');
}

chrome.runtime.onInstalled.addListener(() => {
  applyPopupToAllTabs().then(syncActiveSitePopupMenu);
  setupContextMenu();
  updateAllBadges();
});
chrome.runtime.onStartup.addListener(() => {
  applyPopupToAllTabs().then(syncActiveSitePopupMenu);
  setupContextMenu();
  updateAllBadges();
});

// При смене настроек — пересчитываем попап у всех вкладок и галочку в меню.
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.settings) {
    applyPopupToAllTabs().then(syncActiveSitePopupMenu);
  }
});

// Сообщения из попапа — например "открой меня" вручную.
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === 'refresh-badges') {
    updateAllBadges().then(() => sendResponse({ ok: true }));
    return true; // async
  }
});
