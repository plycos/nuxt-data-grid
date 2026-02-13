<script lang="ts">
import {
  type ColumnDef,
  type ColumnFiltersState,
  type ExpandedState,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getGroupedRowModel,
  getSortedRowModel,
  type GroupingState,
  type Row,
  type RowData,
  type SortingState,
  useVueTable,
  type VisibilityState,
} from '@tanstack/vue-table';
import type { FilterFn, FilterFnOption, RowSelectionState } from '@tanstack/table-core';
import { UCheckbox } from '#components';

export type GridStyle = {
  root?: string;
  table?: string;
  row?: string;
};

export type RowClickEvent = {
  event: Event;
  target: HTMLElement;
  rowId: number;
  rowEl: HTMLElement;
  row: Row<RowData> | undefined;
};

declare module '@tanstack/vue-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    px?: number;
    fr?: number;
    min?: number;
    max?: number;
    align?: 'start' | 'end' | 'center';
    span?: number;
  }

  type CustomFilterFnOption<TData> = FilterFn<TData> | FilterFnOption<TData> | 'arrIncludesExact';

  export type DataTableColumnDef<TData> = Omit<ColumnDef<TData>, 'filterFn'> & {
    filterFn?: CustomFilterFnOption<TData>;
  };
}
</script>

<script setup lang="ts" generic="TData extends RowData & { id?: string | number }">
const props = withDefaults(
  defineProps<{
    data: TData[];
    columns: ColumnDef<TData>[];
    caption: string;
    emptyText?: string;
    rowHeight?: number;
    overscan?: number;
    ui?: GridStyle;
  }>(),
  {
    emptyText: 'No results',
    rowHeight: 48,
    overscan: 12,
    ui: undefined,
  },
);

const emits = defineEmits<{
  (e: 'row:click' | 'row:select', row: RowClickEvent | undefined): void;
}>();

const columnVisibility = defineModel<VisibilityState>('columnVisibility', {
  required: false,
  default: {},
});
const grouping = defineModel<GroupingState>('grouping', { required: false, default: [] });
const expanded = defineModel<ExpandedState>('expanded', { required: false, default: {} });
const sorting = defineModel<SortingState>('sorting', { required: false, default: [] });
const groupSorting = defineModel<SortingState>('groupSorting', { required: false, default: [] });
const rowSelection = defineModel<RowSelectionState>('rowSelection', {
  required: false,
  default: {},
});
const columnFilters = defineModel<ColumnFiltersState>('columnFilters', {
  required: false,
  default: [],
});
const globalFilter = defineModel<string>('globalFilter', {
  required: false,
  default: '',
});

const selectionCol: ComputedRef<ColumnDef<TData>> = computed(() => ({
  id: '__select__',
  enableResizing: false,
  enableSorting: false,
  enableHiding: false,
  header: () => {
    const all = table.getIsAllRowsSelected();
    const some = table.getIsSomeRowsSelected();
    return h(UCheckbox, {
      modelValue: some ? 'indeterminate' : all,
      'aria-label': 'Select all',
      'data-type': 'select-all',
    });
  },
  cell: ({ row }) =>
    h(UCheckbox, {
      modelValue: row.getIsSelected(),
      'aria-label': 'Select row',
      'data-type': 'select',
    }),
  meta: {
    px: 50,
    align: 'center',
  },
}));
const composedColumns = computed<ColumnDef<TData>[]>(() => [selectionCol.value, ...props.columns]);

const table = useVueTable({
  get data() {
    return props.data;
  },
  get columns() {
    return composedColumns.value;
  },
  getRowId: (row, index) => (row.id ?? index).toString(),
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getGroupedRowModel: getGroupedRowModel(),
  getExpandedRowModel: getExpandedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  groupedColumnMode: 'remove',
  autoResetAll: false,
  autoResetExpanded: false,
  enableRowSelection: true,
  enableMultiRowSelection: true,
  enableSubRowSelection: true,
  enableGlobalFilter: true,
  globalFilterFn: 'includesString',
  filterFns: {
    arrIncludesExact: (row, columnId, filterValue) => {
      const value = row.getValue(columnId);
      if (Array.isArray(filterValue)) {
        return filterValue.includes(value) || filterValue.length === 0;
      }
      return value === filterValue;
    },
  },
  state: {
    get columnVisibility() {
      return columnVisibility.value;
    },
    get sorting() {
      return sorting.value;
    },
    get grouping() {
      return grouping.value;
    },
    get expanded() {
      return expanded.value;
    },
    get rowSelection() {
      return rowSelection.value;
    },
    get columnFilters() {
      return columnFilters.value;
    },
    get globalFilter() {
      return globalFilter.value;
    },
  },
  onColumnVisibilityChange: (updateOrValue) => {
    columnVisibility.value =
      typeof updateOrValue === 'function' ? updateOrValue(columnVisibility.value) : updateOrValue;
  },
  onSortingChange: (updateOrValue) => {
    sorting.value =
      typeof updateOrValue === 'function' ? updateOrValue(sorting.value) : updateOrValue;
  },
  onGroupingChange: (updaterOrValue) => {
    grouping.value =
      typeof updaterOrValue === 'function' ? updaterOrValue(grouping.value) : updaterOrValue;
  },
  onExpandedChange: (updaterOrValue) => {
    expanded.value =
      typeof updaterOrValue === 'function' ? updaterOrValue(expanded.value) : updaterOrValue;
  },
  onRowSelectionChange: (updateOrValue) => {
    let next =
      typeof updateOrValue === 'function' ? updateOrValue(rowSelection.value) : updateOrValue;
    next = Object.fromEntries(Object.entries(next).filter(([_, v]) => v !== false));
    rowSelection.value = next;
  },
  onColumnFiltersChange: (updaterOrValue) => {
    columnFilters.value =
      typeof updaterOrValue === 'function' ? updaterOrValue(columnFilters.value) : updaterOrValue;
  },
  onGlobalFilterChange: (updaterOrValue) => {
    globalFilter.value =
      typeof updaterOrValue === 'function' ? updaterOrValue(globalFilter.value) : updaterOrValue;
  },
});

const rowCount = defineModel<number>('rowCount', { required: false, default: 0 });
watchEffect(() => (rowCount.value = table.getFilteredRowModel().rows.length));

const rows = computed(() => table.getRowModel().rows);
const rowMap = computed<Record<string, Row<TData>>>(() =>
  Object.fromEntries(rows.value.map((r) => [r.id, r])),
);
const groupedRows = computed(() => {
  let groups = table.getRowModel().rows.filter((r) => r.getIsGrouped() && r.depth === 0);
  if (grouping.value.length > 0 && groupSorting.value.length > 0) {
    const sortMeta = groupSorting.value.map((sort) => {
      const col = table.getColumn(sort.id);
      const sortingFn = col?.columnDef.sortingFn;
      return {
        id: sort.id,
        desc: sort.desc,
        sortingFn,
        invert: col?.columnDef.invertSorting ?? false,
      };
    });

    groups = groups.sort((a, b) => {
      for (const meta of sortMeta) {
        if (typeof meta.sortingFn === 'function') {
          const result = meta.sortingFn(a, b, meta.id);
          if (result !== 0) {
            const direction = meta.desc ? -1 : 1;
            return meta.invert ? -result * direction : result * direction;
          }
        }
      }
      return 0;
    });
  }
  return groups;
});

const tableContainer = useTemplateRef('tableContainer');

const gridTracks = computed(() => {
  return table
    .getVisibleFlatColumns()
    .map((col) => {
      const meta = col.columnDef.meta;
      if (meta?.px) return `${meta.px}px`;
      if (meta?.fr) {
        const min = meta.min ?? 120;
        return `minmax(${min}px, ${meta.fr}fr)`;
      }
      return 'auto';
    })
    .join(' ');
});

const tableContainerStyle = computed(() => ({
  '--grid-tracks': gridTracks.value,
}));

async function expandGroup(group: Row<TData>, groupId: string) {
  if (!tableContainer.value) return;
  group.toggleExpanded();
  await nextTick();
  const groupRef = tableContainer.value?.querySelector<HTMLElement>(`[data-group-id="${groupId}"]`);
  if (!groupRef) return;
  groupRef.scrollIntoView({
    block: 'nearest',
    behavior: 'auto',
  });
}

const groupOffsets = ref({});
watch(
  () => [expanded.value, grouping.value],
  async () => {
    await nextTick();
    const container = tableContainer.value;
    const validGroupIds = new Set(groupedRows.value.map((g) => g.id));
    const expandedGroupIds = Object.keys(expanded.value).filter((id) => validGroupIds.has(id));
    if (!container || expandedGroupIds.length === 0) {
      groupOffsets.value = {};
      return;
    }
    groupOffsets.value = Object.fromEntries(
      expandedGroupIds.map((id) => {
        const el = container.querySelector<HTMLElement>(`[data-group-id="${id}"]`);
        return [id, el?.offsetTop ?? 0];
      }),
    );
  },
);

watch(
  () => [grouping.value],
  () => {
    if (!tableContainer.value) return;
    tableContainer.value.scrollTop = 0;
  },
);

// ------------ Event Handlers ------------ //
function isSelectingText() {
  const state = document.getSelection();
  return state?.toString() !== '';
}

function createRowClickEventData(e: Event) {
  const target = e.target as HTMLElement;
  const rowEl = target.closest('[data-row-id]') as HTMLElement;
  if (!rowEl) return;
  const rowId = rowEl.getAttribute('data-row-id');
  if (!rowId) return;
  const row = rowMap.value[rowId];
  const eventData: RowClickEvent = { event: e, target, rowId: Number(rowId), rowEl, row };
  return eventData;
}

function handleClick(e: Event) {
  const target = e.target as HTMLElement;
  if (target.closest('[data-type="select-all"]')) {
    table.toggleAllRowsSelected();
    return;
  }
  const rowEventData = createRowClickEventData(e);
  if (rowEventData) {
    if (
      rowEventData.target.getAttribute('data-type') === 'select' ||
      (rowEventData.event as MouseEvent).ctrlKey
    ) {
      rowEventData.row?.toggleSelected();
      return;
    }

    emits('row:click', rowEventData);
    if (!isSelectingText()) emits('row:select', rowEventData);
  }
}
</script>

<template>
  <div
    ref="tableContainer"
    :class="ui?.root"
    class="font-roboto flex-1 overflow-auto text-sm my-2 border-b-2 border-neutral-50"
    :style="tableContainerStyle"
    @click="handleClick"
  >
    <div
      :aria-label="caption"
      role="treegrid"
      :class="ui?.table"
      class="relative grid gap-2"
    >
      <template v-if="grouping.length > 0 && groupedRows.length > 0">
        <div
          v-for="group in groupedRows"
          :key="'group:' + group.id"
          :data-group-id="group.id"
          role="rowgroup"
          class="relative border border-default rounded-md overflow-clip"
        >
          <div
            role="row"
            :data-group-id="group.id"
            :aria-level="group.depth + 1"
            :aria-expanded="group.getIsExpanded()"
            class="sticky top-0 [&>*]:px-4 grid [grid-template-columns:var(--grid-tracks)] items-center w-full h-12 transition-all duration-300 z-20"
            :class="group.getIsExpanded() ? 'bg-neutral-100' : 'bg-default'"
          >
            <UButton
              :aria-label="`${group.getIsExpanded() ? 'Collapse' : 'Expand'} group`"
              color="neutral"
              variant="link"
              :leading-icon="
                group.getIsExpanded() ? 'i-lucide-chevron-down' : 'i-lucide-chevron-up'
              "
              class="justify-center"
              @click.prevent="expandGroup(group, group.id)"
            />
            <slot
              name="grouping-row"
              :group="group"
            />
          </div>

          <template v-if="group.getIsExpanded()">
            <DataTableRows
              v-if="tableContainer"
              :rows="group.subRows"
              :table="table"
              :container="tableContainer"
              :row-height="rowHeight"
              :overscan="overscan"
              :group-root="group"
              :group-offsets="groupOffsets"
            />
          </template>
        </div>
      </template>

      <template v-else-if="grouping.length == 0 && rows.length != 0">
        <DataTableRows
          :rows="rows"
          :table="table"
          :container="tableContainer"
          :row-height="rowHeight"
          :overscan="overscan"
        />
      </template>

      <div
        v-else
        class="w-full my-10 text-center"
      >
        {{ emptyText }}
      </div>
    </div>
  </div>
</template>
