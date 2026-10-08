// Inserts text at the caret of an input or textarea and puts the caret after
// it. Returns the new value for the field's state.
export function insertAtCaret(el: HTMLInputElement | HTMLTextAreaElement | null, value: string, text: string): string {
  if (!el) return value + text;
  const start = el.selectionStart ?? value.length;
  const end = el.selectionEnd ?? value.length;
  const next = value.slice(0, start) + text + value.slice(end);
  requestAnimationFrame(() => {
    el.focus();
    el.setSelectionRange(start + text.length, start + text.length);
  });
  return next;
}
