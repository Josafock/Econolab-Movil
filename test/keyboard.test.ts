import { focusedFieldOffset } from '@/ui/keyboard';

const field = { offset: 200, inputTop: 500, inputHeight: 52, viewportTop: 80, viewportHeight: 600, keyboardTop: 400 };

it('revela el campo bajo el teclado conservando el desplazamiento previo', () => {
  expect(focusedFieldOffset(field)).toBe(368);
});
it('respeta una ventana ya reducida y la barra de navegación', () => {
  expect(focusedFieldOffset({ ...field, viewportHeight: 250 })).toBe(438);
});
it('mantiene quieto un campo que ya está dentro del área visible', () => {
  expect(focusedFieldOffset({ ...field, inputTop: 150 })).toBeNull();
});
it('recupera el campo sobre la ventana sin permitir desplazamientos negativos', () => {
  expect(focusedFieldOffset({ ...field, offset: 10, inputTop: 20 })).toBe(0);
});
it('ignora mediciones de una vista desmontada o sin distribución', () => {
  expect(focusedFieldOffset({ ...field, inputHeight: 0 })).toBeNull();
  expect(focusedFieldOffset({ ...field, inputTop: NaN })).toBeNull();
});
