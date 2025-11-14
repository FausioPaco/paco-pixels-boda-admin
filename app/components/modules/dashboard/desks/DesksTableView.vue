<script setup lang="ts">
interface IDeskTableProps {
  deskName?: string;
  guests?: Guest[];
  peopleCount?: number;
}

withDefaults(defineProps<IDeskTableProps>(), {
  deskName: 'Convidados da Mesa',
  guests: () => [],
  peopleCount: 0,
});
</script>

<template>
  <div class="w-full md:mx-7 md:mt-4 md:w-1/2">
    <div class="border-grey-200 animate-fadeIn rounded-md border p-3">
      <!-- Header -->
      <div class="flex flex-wrap items-center justify-between gap-2">
        <h4 class="text-primary-800 text-lg font-bold">{{ deskName }}</h4>
        <div class="text-primary-700 flex items-end space-x-1">
          <icon-account :font-controlled="false" class="block h-5 w-5" />
          <small class="block font-bold">
            {{ peopleCount === 1 ? '1 Pessoa' : `${peopleCount} Pessoas` }}
          </small>
        </div>
      </div>

      <!-- Empty Guests -->
      <div
        v-if="!guests || guests.length === 0"
        class="text-grey-500 my-6 flex flex-col items-center justify-between space-y-3"
      >
        <icon-warning
          :font-controlled="false"
          class="mr-1 h-[32px] w-[32px]"
        ></icon-warning>
        <p>Até agora não existem convidados para esta mesa</p>
      </div>

      <!-- Guest List -->
      <div v-if="guests && guests.length" class="animate-fadeIn">
        <div v-for="guest in guests" :key="guest.id" class="data-list mt-2">
          <p class="text-sm font-bold">{{ guest.name }}</p>
          <p class="text-grey-600 text-sm font-light">
            {{
              guest.people_Count === 1
                ? '1 Pessoa'
                : `${guest.people_Count} Pessoas`
            }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
<style>
.data-list {
  @apply border-grey-200 flex w-full items-center justify-between border-b py-2;
}
.data-list:last-child {
  @apply border-none;
}
</style>
