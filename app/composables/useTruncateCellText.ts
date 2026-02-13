export function useTruncateCellText(text: string) {
  return h(
    'span',
    {
      class: 'block truncate whitespace-nowrap overflow-hidden',
      title: String(text ?? ''),
    },
    text,
  )
}