// Куда поставить контекстное меню попапа.
//
// Окно попапа — это фиксированная по высоте страница: всё, что вылезло за её
// низ, просто обрезается. Поэтому меню нельзя ставить «всегда под кнопкой»:
// с единственным счётчиком окно низкое, и меню из семи пунктов не помещается.
// Здесь считаем: под кнопкой, над ней или на всю доступную высоту со скроллом.
//
// Вход: anchor — { top, bottom, right } кнопки, menu — { width, height },
// viewport — { height }. Выход: { top, left, maxHeight } в пикселях.
const GAP = 4; // отступ между кнопкой и меню
const MARGIN = 4; // минимальный отступ от края окна

export function menuPlacement({ anchor, menu, viewport }) {
  const height = Number(viewport?.height) || 0;
  const left = Math.max(MARGIN, anchor.right - menu.width);

  const spaceBelow = height - anchor.bottom - GAP - MARGIN;
  const spaceAbove = anchor.top - GAP - MARGIN;

  // Сначала та сторона, куда меню влезает целиком. Если не влезает никуда —
  // та, где места больше, а лишнее уйдёт в скролл.
  const fitsBelow = menu.height <= spaceBelow;
  const fitsAbove = menu.height <= spaceAbove;
  const placeBelow = fitsBelow || (!fitsAbove && spaceBelow >= spaceAbove);

  const space = Math.max(0, placeBelow ? spaceBelow : spaceAbove);
  const maxHeight = Math.max(0, Math.min(menu.height || space, space));
  const top = placeBelow
    ? anchor.bottom + GAP
    : Math.max(MARGIN, anchor.top - GAP - maxHeight);

  return { top, left, maxHeight };
}
