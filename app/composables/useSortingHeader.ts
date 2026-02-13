import type { Column } from '@tanstack/vue-table';
import { UButton } from '#components';

export function useSortingHeader<T>(
  column: Column<T>,
  label: string,
  type: 'text' | 'number' = 'number',
) {
  const isSorted = column.getIsSorted();
  const upIcon = type == 'number' ? 'i-lucide-arrow-up-narrow-wide' : 'i-lucide-arrow-down-a-z';
  const downIcon = type == 'number' ? 'i-lucide-arrow-down-wide-narrow' : 'i-lucide-arrow-down-z-a';
  return h(UButton, {
    color: 'neutral',
    variant: 'ghost',
    label: label,
    trailingIcon: isSorted ? (isSorted === 'asc' ? upIcon : downIcon) : '',
    class: '-mx-2.5 text-inherit font-medium items-center h-8',
    'aria-label': `Sort by ${isSorted === 'asc' ? 'descending' : 'ascending'}`,
    onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
  });
}
