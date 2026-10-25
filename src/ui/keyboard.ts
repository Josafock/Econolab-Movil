/** Window coordinates keep the calculation independent of headers and bottom tabs. */
export function focusedFieldOffset({ offset, inputTop, inputHeight, viewportTop, viewportHeight, keyboardTop }: {
  offset: number; inputTop: number; inputHeight: number;
  viewportTop: number; viewportHeight: number; keyboardTop?: number;
}): number | null {
  const bottom = Math.min(viewportTop + viewportHeight, keyboardTop ?? Infinity) - 16;
  if (![offset, inputTop, inputHeight, viewportTop, viewportHeight, bottom].every(Number.isFinite)
    || inputHeight <= 0 || viewportHeight <= 0) return null;
  if (inputTop < viewportTop + 16) return Math.max(0, offset + inputTop - viewportTop - 16);
  if (inputTop + inputHeight > bottom) return Math.max(0, offset + inputTop + inputHeight - bottom);
  return null;
}
