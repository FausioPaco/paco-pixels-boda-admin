<script setup lang="ts">
const props = defineProps<{
  eventId: number;
}>();

const movementParams = reactive({
  searchQuery: '',
  startDate: '',
  endDate: '',
  pageNumber: 1,
  pageSize: 10,
  eventId: props.eventId,
});

const { stockMovements, isRefreshing, isError, refreshStockMovements } =
  await useBeverageStockMovements(movementParams);

onMounted(() => {
  refreshStockMovements({ force: true });
});
</script>
<template>
  <div v-if="!isRefreshing && !isError" class="mt-6 w-full">
    <div class="border-primary-100 rounded-xl border p-4 md:p-5">
      <div class="mb-3 mt-2">
        <h4 class="text-xl font-bold">Registo de actividades</h4>
        <p class="text-grey-600">
          Movimentos recentes (consumo, ajustes e abastecimentos).
        </p>
      </div>

      <BaseLoading
        v-if="isRefreshing"
        size="md"
        orientation="horizontal"
        class="my-3"
      />

      <BaseError v-else-if="isError" class="my-3">
        Não foi possível carregar o registo de actividades.
      </BaseError>

      <div v-else class="divide-grey-100 space-y-3 divide-y p-3">
        <div v-for="m in stockMovements" :key="m.id" class="pt-3">
          <div class="flex items-center justify-between">
            <p class="text-grey-900 text-lg font-semibold">
              {{ m.beverageName }}
            </p>

            <p class="text-grey-500 text-xs">
              {{ new Date(m.occurredAt).toLocaleString('pt-PT') }}
            </p>
          </div>

          <div class="mt-1 flex items-center justify-between">
            <p class="text-grey-400 text-sm">
              <span v-if="m.type === 'Out'">Consumo</span>
              <span v-else-if="m.type === 'In'">Abastecimento</span>
              <span v-else-if="m.type === 'Adjust'">Ajuste</span>
              <span v-else>Fora do stock</span>

              <span v-if="m.type === 'Out'"> (-{{ m.quantity }})</span>
              <span v-else-if="m.type === 'In'"> (+{{ m.quantity }})</span>
            </p>

            <p class="text-grey-500 text-xs">
              {{ m.createdByName }}
            </p>
          </div>

          <p v-if="m.note" class="text-grey-300 mt-2 text-sm">
            {{ m.note }}
          </p>
        </div>

        <p
          v-if="(stockMovements?.length ?? 0) === 0"
          class="text-grey-600 text-sm"
        >
          Ainda sem actividades registadas.
        </p>
      </div>
    </div>
  </div>
</template>
