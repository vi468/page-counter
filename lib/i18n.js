// Локализация интерфейса: русский и английский.
//
// Язык берётся из системы: сначала chrome.i18n.getUILanguage() — язык интерфейса
// самого браузера, потом navigator.language. Русский, если локаль начинается с
// "ru", иначе английский. Для скриншотов и отладки язык можно задать вручную
// параметром ?lang=ru|en в адресе страницы — своей настройки в расширении нет.
//
// Все строки интерфейса живут здесь: в вёрстке — через data-i18n, в коде — через
// t(). Ключи обязаны быть в обоих словарях, это ловит tests/i18n.test.js.

export const DICTS = {
  ru: {
    'common.cancel': 'Отмена',
    'common.delete': 'Удалить',
    'common.rename': 'Переименовать',

    'popup.openSettings': 'Настройки',
    'popup.newCounter': '+ Новый счётчик',
    'popup.namePlaceholder': 'Название',
    'popup.start': 'Старт:',
    'popup.step': 'Шаг:',
    'popup.create': 'Создать',
    'popup.noActivePage': 'Нет активной страницы',
    'popup.empty': 'Нет счётчиков. Создайте новый ↓',
    'popup.makePrimary': 'Сделать главным',
    'common.setValue': 'Задать значение',
    'popup.namePrompt': 'Название:',
    'popup.valuePrompt': 'Значение:',
    'popup.initialPrompt': 'Начальное значение:',
    'popup.stepPrompt': 'Шаг:',
    'popup.deleteConfirm': 'Удалить счётчик?',
    'popup.menu.alreadyPrimary': '★ Уже главный',
    'popup.menu.makePrimary': '★ Сделать главным',
    'popup.menu.rename': 'Переименовать',
    'popup.menu.setValue': 'Задать значение',
    'popup.menu.initial': 'Начальное значение',
    'popup.menu.step': 'Шаг',
    'popup.menu.reset': 'Сбросить к {value}',
    'popup.menu.delete': 'Удалить',

    'options.pageTitle': 'Page Counter — настройки',
    'options.defaultScopeLabel': 'Scope по умолчанию для новых счётчиков',
    'options.scopeDomain': 'Domain (example.com)',
    'options.scopeTab': 'Tab (только текущая вкладка)',
    'options.scopeUrl': 'URL (точный адрес)',
    'options.scopeGlobal': 'Global (один на всё)',
    'options.iconClickLabel': 'Клик по иконке расширения',
    'options.iconClickIncrement': '+N к главному счётчику',
    'options.iconClickPopup': 'Открыть попап',
    'options.save': 'Сохранить',
    'options.saved': 'Сохранено ✓',
    'options.allCounters': 'Все счётчики',
    'options.dataSection': 'Данные',
    'options.export': 'Экспорт JSON',
    'options.import': 'Импорт JSON',
    'options.importApply': 'Импортировать',
    'options.hintBefore': 'Все данные хранятся локально в',
    'options.emptyManager':
      'Счётчиков пока нет. Откройте попап на любой странице и создайте.',
    'options.allPages': '(все страницы)',
    'options.importBadFormat': 'Некорректный формат',
    'options.importNoCounters': 'в файле нет ни одного корректного счётчика',
    'options.importConfirm': {
      one: 'Импортировать {n} счётчик? Текущие будут заменены.',
      few: 'Импортировать {n} счётчика? Текущие будут заменены.',
      many: 'Импортировать {n} счётчиков? Текущие будут заменены.',
    },
    'options.importDropped': 'Некорректных записей пропущено: {n}.',
    'options.importDone': 'Импорт завершён. Загружено счётчиков: {n}.',
    'options.importError': 'Ошибка импорта: {message}',
    'options.deleteConfirm': 'удалить?',
    'options.deleteConfirmTitle': 'Нажмите ещё раз, чтобы удалить',
    'options.stepLabel': 'шаг {n}',
    'options.resetTo': 'Сбросить к {value}',
    'options.setStepTitle': 'Изменить шаг',

    'menu.resetPrimary': 'Сбросить главный счётчик',
    'menu.openManager': 'Открыть менеджер счётчиков',
    'menu.openPopup': 'Открыть попап',
    'counter.defaultName': 'Счётчик',
  },

  en: {
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.rename': 'Rename',

    'popup.openSettings': 'Settings',
    'popup.newCounter': '+ New counter',
    'popup.namePlaceholder': 'Name',
    'popup.start': 'Start:',
    'popup.step': 'Step:',
    'popup.create': 'Create',
    'popup.noActivePage': 'No active page',
    'popup.empty': 'No counters yet. Create one ↓',
    'popup.makePrimary': 'Make primary',
    'common.setValue': 'Set value',
    'popup.namePrompt': 'Name:',
    'popup.valuePrompt': 'Value:',
    'popup.initialPrompt': 'Initial value:',
    'popup.stepPrompt': 'Step:',
    'popup.deleteConfirm': 'Delete the counter?',
    'popup.menu.alreadyPrimary': '★ Already primary',
    'popup.menu.makePrimary': '★ Make primary',
    'popup.menu.rename': 'Rename',
    'popup.menu.setValue': 'Set value',
    'popup.menu.initial': 'Initial value',
    'popup.menu.step': 'Step',
    'popup.menu.reset': 'Reset to {value}',
    'popup.menu.delete': 'Delete',

    'options.pageTitle': 'Page Counter — settings',
    'options.defaultScopeLabel': 'Default scope for new counters',
    'options.scopeDomain': 'Domain (example.com)',
    'options.scopeTab': 'Tab (the current tab only)',
    'options.scopeUrl': 'URL (an exact address)',
    'options.scopeGlobal': 'Global (one for everything)',
    'options.iconClickLabel': 'Clicking the extension icon',
    'options.iconClickIncrement': '+N to the main counter',
    'options.iconClickPopup': 'Open the popup',
    'options.save': 'Save',
    'options.saved': 'Saved ✓',
    'options.allCounters': 'All counters',
    'options.dataSection': 'Data',
    'options.export': 'Export JSON',
    'options.import': 'Import JSON',
    'options.importApply': 'Import',
    'options.hintBefore': 'All data is stored locally in',
    'options.emptyManager': 'No counters yet. Open the popup on any page and create one.',
    'options.allPages': '(all pages)',
    'options.importBadFormat': 'Invalid format',
    'options.importNoCounters': 'the file has no valid counters',
    'options.importConfirm': {
      one: 'Import {n} counter? The current ones will be replaced.',
      other: 'Import {n} counters? The current ones will be replaced.',
    },
    'options.importDropped': 'Invalid entries skipped: {n}.',
    'options.importDone': 'Import complete. Counters loaded: {n}.',
    'options.importError': 'Import failed: {message}',
    'options.deleteConfirm': 'delete?',
    'options.deleteConfirmTitle': 'Click again to delete',
    'options.stepLabel': 'step {n}',
    'options.resetTo': 'Reset to {value}',
    'options.setStepTitle': 'Change the step',

    'menu.resetPrimary': 'Reset the main counter',
    'menu.openManager': 'Open the counter manager',
    'menu.openPopup': 'Open the popup',
    'counter.defaultName': 'Counter',
  },
};

export const LANGS = Object.keys(DICTS);

// Формы для plural: русский требует three, английскому хватает two.
function pluralForm(lang, n, forms) {
  if (lang === 'ru') {
    const n10 = n % 10;
    const n100 = n % 100;
    if (n10 === 1 && n100 !== 11) return forms.one;
    if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return forms.few;
    return forms.many;
  }
  return n === 1 ? forms.one : forms.other ?? forms.many;
}

function systemLocale() {
  try {
    if (typeof chrome !== 'undefined' && chrome?.i18n?.getUILanguage) {
      const ui = chrome.i18n.getUILanguage();
      if (ui) return ui;
    }
  } catch {
    // chrome.i18n может быть недоступен (тесты, нестабильный контекст).
  }
  if (typeof navigator !== 'undefined' && navigator?.language) return navigator.language;
  return 'en';
}

// Язык интерфейса знает только два значения: русский и английский. Всё
// остальное, включая пустую локаль, падает в английский.
export function langFromLocale(locale) {
  return String(locale ?? '').toLowerCase().startsWith('ru') ? 'ru' : 'en';
}

function urlLang() {
  try {
    if (typeof location === 'undefined') return null;
    const lang = new URLSearchParams(location?.search ?? '').get('lang');
    return LANGS.includes(lang) ? lang : null;
  } catch {
    return null;
  }
}

let current = urlLang() ?? langFromLocale(systemLocale());

export function getLang() {
  return current;
}

// Переключить язык насильно: нужно тестам и съёмке скриншотов.
export function setLang(lang) {
  if (LANGS.includes(lang)) current = lang;
  return current;
}

function interpolate(message, vars) {
  return message.replace(/\{(\w+)\}/g, (match, name) =>
    name in vars ? String(vars[name]) : match,
  );
}

export function t(key, vars = {}) {
  const entry = DICTS[current][key] ?? DICTS.en[key];
  // Незнакомый ключ возвращаем как есть: опечатка видна в интерфейсе и в тестах.
  if (entry == null) return key;
  if (typeof entry === 'string') return interpolate(entry, vars);
  const message = pluralForm(current, Number(vars.n ?? 0), entry);
  return interpolate(message ?? entry.other ?? entry.many ?? '', vars);
}

// Перевод статичной вёрстки: data-i18n — текст, data-i18n-title — title,
// data-i18n-placeholder — placeholder. Вешать только на листовые элементы:
// textContent стирает детей, поэтому подпись с вложенным select оборачивается
// в свой span.
export function applyI18n(root = globalThis.document) {
  if (!root?.querySelectorAll) return root;
  for (const el of root.querySelectorAll('[data-i18n]')) {
    el.textContent = t(el.dataset.i18n);
  }
  for (const el of root.querySelectorAll('[data-i18n-title]')) {
    el.title = t(el.dataset.i18nTitle);
  }
  for (const el of root.querySelectorAll('[data-i18n-placeholder]')) {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  }
  return root;
}
