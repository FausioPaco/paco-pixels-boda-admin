<script lang="ts" setup>
interface IPaginationProps {
  paginationData: {
    totalCount: number;
    pageSize: number;
    currentPage: number;
    totalPages: number;
  };
}

const props = defineProps<IPaginationProps>();

const emit = defineEmits<{
  (e: 'pageChange' | 'pageSelected', newPage: number): void;
}>();

// Computed que gera a lista de páginas (ou "..." para indicar intervalo)
const visiblePages = computed<(number | string)[]>(() => {
  const { totalPages, currentPage } = props.paginationData;
  const pages: (number | string)[] = [];

  // Se totalPages é pequeno, mostra todas as páginas.
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  // Sempre mostra a primeira página
  pages.push(1);

  // Se o currentPage está nas primeiras 4 páginas
  if (currentPage <= 4) {
    for (let i = 2; i <= 5; i++) {
      pages.push(i);
    }
    pages.push('...');
  }

  // Se o currentPage está nas últimas 4 páginas
  else if (currentPage >= totalPages - 3) {
    pages.push('...');
    for (let i = totalPages - 4; i < totalPages; i++) {
      pages.push(i);
    }
  }
  // Se o currentPage está no meio
  else {
    pages.push('...');
    pages.push(currentPage - 1);
    pages.push(currentPage);
    pages.push(currentPage + 1);
    pages.push('...');
  }

  // Sempre mostra a última página
  pages.push(totalPages);

  return pages;
});

function changePage(newPage: number) {
  if (newPage !== props.paginationData.currentPage) {
    emit('pageSelected', newPage);
  }
}

function nextPage() {
  if (props.paginationData.currentPage < props.paginationData.totalPages) {
    emit('pageChange', props.paginationData.currentPage + 1);
  }
}

function prevPage() {
  if (props.paginationData.currentPage > 1) {
    emit('pageChange', props.paginationData.currentPage - 1);
  }
}
</script>

<template>
  <nav class="pagination mt-6 flex flex-wrap items-start gap-2">
    <button
      class="p-3"
      :disabled="paginationData.currentPage === 1"
      @click="prevPage"
    >
      <IconChevronLeft
        :font-controlled="false"
        class="size-[16px] fill-inherit"
      />
    </button>
    <ul class="flex flex-wrap items-center gap-2">
      <li v-for="(page, index) in visiblePages" :key="index">
        <button
          v-if="page !== '...'"
          class="text-grey-600 hover:bg-grey-50 rounded-md p-3 text-sm"
          :class="{ active: page === paginationData.currentPage }"
          @click="changePage(page as number)"
        >
          {{ page }}
        </button>
        <span v-else class="px-2 text-sm">{{ page }}</span>
      </li>
    </ul>
    <button
      class="p-3"
      :disabled="paginationData.currentPage === paginationData.totalPages"
      @click="nextPage"
    >
      <IconChevronRight
        :font-controlled="false"
        class="size-[16px] fill-inherit"
      />
    </button>
  </nav>
</template>

<style scoped>
.pagination button {
  @apply transition-colors duration-300 ease-in-out;
}

.pagination button.active {
  @apply bg-primary-50 text-primary-700 font-bold;
}

.pagination button:hover:not(:disabled) {
  @apply bg-grey-50 text-grey-600;
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
