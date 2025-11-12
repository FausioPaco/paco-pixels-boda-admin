<script setup lang="ts">
interface ITableProps {
  summary?: string;
}

withDefaults(defineProps<ITableProps>(), {
  summary: 'Tabela de Informação',
});
</script>
<template>
  <div class="relative mt-5 block w-full animate-fadeIn overflow-x-auto">
    <table class="w-full text-left text-sm" :summary="summary">
      <thead>
        <slot name="thead"></slot>
      </thead>
      <tbody>
        <slot name="tbody"></slot>
      </tbody>
    </table>
  </div>
</template>
<style>
table thead {
  @apply text-grey-600 border-grey-300 bg-grey-50 font-medium;
}

table thead tr th:first-child {
  @apply rounded-bl-md rounded-tl-md;
}

table thead tr th:last-child {
  @apply rounded-br-md rounded-tr-md;
}

table tr th {
  @apply text-grey-500 px-6 py-4 font-bold;
}

table tbody tr {
  @apply hover:bg-grey-50 cursor-pointer border-b transition-colors duration-300;
}

table tbody tr td {
  @apply px-6 py-3 font-medium;
}

table tbody tr:last-child {
  @apply border-none;
}
</style>
