<script setup lang="ts" generic="TData extends RowData">
import { FlexRender, type Row, type RowData } from '@tanstack/vue-table';
import { useVirtualizer } from '@tanstack/vue-virtual';
import type { Table } from '@tanstack/table-core';

const props = withDefaults(
  defineProps<{
    rows: Row<TData>[];
    table: Table<TData>;
    container: HTMLElement | null;
    rowHeight: number;
    overscan: number;
    groupRoot?: Row<TData>;
    groupOffsets?: Record<string, number>;
  }>(),
  {
    groupRoot: undefined,
    groupOffsets: undefined,
  },
);

const scrollMargin = computed(() => {
  if (!props.groupRoot || !props.groupOffsets) return 0;
  return props.groupOffsets[props.groupRoot.id];
});

const SSR_ROWS = 50;

const virtualizer = useVirtualizer(
  computed(() => ({
    count: props.rows.length,
    getScrollElement: () => props.container,
    estimateSize: () => props.rowHeight,
    overscan: props.overscan,
    scrollToFn: () => {},
    scrollMargin: scrollMargin.value,
    initialRect: {
      width: 0,
      height: props.rowHeight * SSR_ROWS,
    },
  })),
);

const virtualRows = computed(() => virtualizer.value.getVirtualItems());

const COL_H = 40;
const containerHeight = computed(() => {
  const groupedHeight = props.groupRoot ? COL_H : 0;
  return props.rows.length * props.rowHeight + groupedHeight;
});

const groupLeaves = computed<Row<TData>[]>(() => (props.groupRoot?.subRows as Row<TData>[]) ?? []);

const groupSelectionState = computed<boolean | 'indeterminate'>({
  get() {
    const leaves = groupLeaves.value;
    if (leaves.length === 0) return false;
    const all = leaves.every((r) => r.getIsSelected());
    if (all) return true;
    const some = leaves.some((r) => r.getIsSelected());
    return some ? 'indeterminate' : false;
  },
  set(val) {
    const leaves = groupLeaves.value;
    const current = { ...props.table.getState().rowSelection };
    for (const leaf of leaves) {
      current[leaf.id] = !!val;
    }
    props.table.setRowSelection(current);
  },
});

const groupAriaChecked = computed<'true' | 'false' | 'mixed'>(() => {
  if (groupSelectionState.value === true) return 'true';
  if (groupSelectionState.value === null) return 'mixed';
  return 'false';
});

function alignClass(align?: 'start' | 'end' | 'center') {
  if (align === 'start') return 'justify-self-start';
  if (align === 'end') return 'justify-self-end';
  if (align === 'center') return 'justify-self-center';
  return '';
}
</script>

<template>
  <div
    v-if="container || useIsSSR()"
    class="relative"
    :style="{
      height: `${containerHeight}px`,
    }"
  >
    <div
      v-for="hg in table.getHeaderGroups()"
      :key="'hg:' + hg.id"
      class="sticky z-10 grid [grid-template-columns:var(--grid-tracks)] items-center w-full shadow bg-muted h-10 font-medium text-dimmed"
      :class="groupRoot ? 'top-12' : 'top-0 rounded-t-md'"
    >
      <div
        v-for="header in hg.headers"
        :key="'header:' + header.id"
        role="columnheader"
        class="px-4"
        :class="alignClass(header.column.columnDef.meta?.align)"
        :style="{
          gridColumn: `span ${header.column.columnDef.meta?.span || 1}`,
        }"
      >
        <template v-if="props.groupRoot && header.column.id === '__select__'">
          <UCheckbox
            v-model="groupSelectionState"
            aria-label="Select all in this group"
            :aria-checked="groupAriaChecked"
            color="secondary"
            size="lg"
          />
        </template>
        <template v-else>
          <FlexRender
            :render="header.column.columnDef.header"
            :props="header.getContext()"
          />
        </template>
      </div>
    </div>
    <div
      v-for="vr in virtualRows"
      :key="vr.key.toString()"
      :data-row-id="rows[vr.index]!.id"
      role="row"
      tabindex="0"
      :aria-level="rows[vr.index]!.depth"
      class="absolute grid [grid-template-columns:var(--grid-tracks)] items-center not-last:border-b-2 border-neutral-50 w-full h-12 hover:bg-neutral-50/40"
      :style="{
        transform: `translate3d(0, ${vr.start - virtualizer.options.scrollMargin}px, 0)`,
      }"
    >
      <div
        v-for="cell in rows[vr.index]!.getVisibleCells()"
        :key="cell.id"
        role="gridcell"
        class="px-4"
        :class="alignClass(cell.column.columnDef.meta?.align)"
        :style="{
          gridColumn: `span ${cell.column.columnDef.meta?.span || 1}`,
        }"
      >
        <FlexRender
          :render="cell.column.columnDef.cell"
          :props="cell.getContext()"
        />
      </div>
    </div>
  </div>
</template>
