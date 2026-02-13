<script setup lang="ts">
import type { ColumnSort, DataTableColumnDef } from '@tanstack/vue-table';
import type { RowClickEvent } from '~/components/DataTable.vue';
import type { Employee } from '~/composables/useFakeEmployees';

const employeeCount = ref(500);
const { data, regenerate } = useFakeEmployees(employeeCount.value);

const groupByField = ref('');
const grouping = computed(() => (groupByField.value ? [groupByField.value] : []));

const columns = computed<DataTableColumnDef<Employee>[]>(() => [
  {
    accessorKey: 'name',
    header: ({ column }) => useSortingHeader<Employee>(column, 'Name'),
    enableSorting: true,
    meta: {
      fr: 2,
      min: 150,
    },
  },
  {
    accessorKey: 'email',
    header: ({ column }) => useSortingHeader<Employee>(column, 'Email'),
    enableSorting: true,
    meta: {
      fr: 2,
      min: 180,
    },
  },
  {
    accessorKey: 'department',
    header: ({ column }) => useSortingHeader<Employee>(column, 'Department'),
    enableSorting: true,
    enableGrouping: true,
    meta: {
      fr: 1,
      min: 120,
      span: grouping.value[0] ? 2 : 1,
    },
  },
  {
    accessorKey: 'role',
    header: ({ column }) => useSortingHeader<Employee>(column, 'Role'),
    enableSorting: true,
    meta: {
      fr: 2,
      min: 140,
    },
  },
  {
    accessorKey: 'status',
    header: ({ column }) => useSortingHeader<Employee>(column, 'Status'),
    enableSorting: true,
    filterFn: 'arrIncludesExact',
    enableGlobalFilter: false,
    cell: ({ row }) => {
      const value: string = row.getValue('status');
      return value.charAt(0).toUpperCase() + value.slice(1).replace('-', ' ');
    },
    meta: {
      px: 120,
      align: 'center',
    },
  },
  {
    accessorKey: 'salary',
    header: ({ column }) => useSortingHeader<Employee>(column, 'Salary'),
    enableSorting: true,
    cell: ({ row }) => `$${Number(row.getValue('salary')).toLocaleString()}`,
    sortingFn: (rowA, rowB, columnId) => {
      const a = Number(rowA.getValue(columnId));
      const b = Number(rowB.getValue(columnId));
      return a - b;
    },
    invertSorting: true,
    aggregationFn: (_, leafRows) =>
      leafRows.reduce((acc, val) => acc + Number(val.getValue('salary')), 0),
    meta: {
      px: 120,
      align: 'end',
    },
  },
]);

const sorting = ref<ColumnSort[]>([
  {
    id: 'salary',
    desc: true,
  },
]);
const groupSorting = ref<ColumnSort[]>([
  {
    id: 'salary',
    desc: true,
  },
]);
const expanded = ref({});
const globalFilter = ref('');
const rowSelection = ref<Record<string, boolean>>({});
const rowCount = ref(0);

function handleRowSelect(e: RowClickEvent | undefined) {
  if (!e) return;
  console.log('Row selected:', e.rowId, e.row?.original);
}

function toggleGrouping() {
  groupByField.value = groupByField.value ? '' : 'department';
}
</script>

<template>
  <div class="flex flex-col h-screen p-4 gap-4">
    <div class="flex items-center gap-4 flex-wrap">
      <UInput
        v-model="employeeCount"
        type="number"
        placeholder="Row count"
        icon="i-lucide-hash"
        class="w-32"
        @change="regenerate(employeeCount)"
      />
      <UInput
        v-model="globalFilter"
        placeholder="Search..."
        icon="i-lucide-search"
        class="w-64"
      />
      <UButton
        :color="grouping.length > 0 ? 'primary' : 'neutral'"
        variant="soft"
        @click="toggleGrouping"
      >
        {{ grouping.length > 0 ? 'Ungroup' : 'Group by Department' }}
      </UButton>
      <span class="text-sm text-dimmed ml-auto">
        {{ rowCount }} rows
        <template v-if="Object.keys(rowSelection).length > 0">
          &middot; {{ Object.keys(rowSelection).length }} selected
        </template>
      </span>
    </div>

    <DataTable
      v-model:grouping="grouping"
      v-model:expanded="expanded"
      v-model:group-sorting="groupSorting"
      v-model:sorting="sorting"
      v-model:row-selection="rowSelection"
      v-model:global-filter="globalFilter"
      v-model:row-count="rowCount"
      :data="data"
      :columns="columns"
      caption="Employees"
      empty-text="No employees found"
      @row:select="handleRowSelect"
    >
      <template #grouping-row="{ group }">
        <div class="col-span-2">
          <span class="font-semibold">{{ group.getValue(grouping[0]) }}</span>
          <span class="text-muted">&nbsp;&mdash; {{ group.getLeafRows().length }} Employees</span>
        </div>
        <div class="col-6 text-right">
          <span class="font-semibold">{{ formatUSD(group.getValue('salary')) }}</span>
        </div>
      </template>
    </DataTable>
  </div>
</template>
