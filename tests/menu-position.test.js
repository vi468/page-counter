import test from 'node:test';
import assert from 'node:assert/strict';
import { menuPlacement } from '../lib/menu-position.js';

// Меню не должно уезжать за край окна попапа: с одним счётчиком окно низкое,
// и меню из семи пунктов под кнопкой обрезалось.

const anchor = (top, bottom, right = 300) => ({ top, bottom, right });
const menu = (height, width = 160) => ({ height, width });

test('места под кнопкой хватает — меню раскрывается вниз', () => {
  const p = menuPlacement({
    anchor: anchor(20, 44),
    menu: menu(200),
    viewport: { height: 600 },
  });

  assert.equal(p.top, 48, 'на 4 пикселя ниже кнопки');
  assert.equal(p.left, 140, 'прижато к правому краю кнопки');
  assert.equal(p.maxHeight, 200, 'высота меню не меняется');
});

test('снизу не влезает, а сверху влезает — раскрывается вверх', () => {
  const p = menuPlacement({
    anchor: anchor(180, 208),
    menu: menu(160),
    viewport: { height: 250 },
  });

  assert.equal(p.top, 16, 'меню встало над кнопкой целиком');
  assert.equal(p.maxHeight, 160, 'меню целиком, без скролла');
});

test('меню выше окна — прижимается к стороне с большим местом и получает скролл', () => {
  const p = menuPlacement({
    anchor: anchor(180, 208),
    menu: menu(400),
    viewport: { height: 240 },
  });

  assert.equal(p.top, 4, 'прижато к верхнему краю');
  assert.equal(p.maxHeight, 172, 'высота ограничена местом над кнопкой');
  assert.ok(p.top + p.maxHeight <= 240 - 4, 'не вылезает за нижний край');
});
