<script setup lang="ts">
import type { BodaEvent } from '#shared/types/event';

const props = withDefaults(
  defineProps<{
    event: BodaEvent;
    showActions?: boolean;
    iconSize?: number;
  }>(),
  {
    showActions: true,
    iconSize: 80,
  },
);

const emit = defineEmits<{
  (e: 'open-actions', event: BodaEvent): void;
}>();

const iconName = computed(() => props.event.eventTypeIcon || 'event-wedding');
const eventStore = useEventStore();

const goToEvent = () => {
  eventStore.selectEvent({
    id: props.event.id,
    name: props.event.name,
    slug: props.event.slug,
    eventTypeId: props.event.eventTypeId ?? undefined,
  });

  navigateTo('/admin');
};
</script>

<template>
  <article
    class="border-primary-100 bg-primary-50/70 text-grey-700 hover:border-3 hover:border-primary-700 relative flex w-full flex-col justify-between rounded-2xl border shadow-sm outline-2 transition hover:-translate-y-0.5 hover:shadow-md md:w-[300px] md:min-w-[220px] lg:min-w-[320px]"
  >
    <!-- topo: ícone + 3 dots -->
    <div
      class="relative flex flex-col items-center justify-center px-6 pb-8 pt-6"
    >
      <button
        v-if="showActions"
        type="button"
        class="text-grey-200 hover:bg-primary-100 hover:text-grey-400 absolute right-1 top-1 rounded-full p-4"
        @click.stop="emit('open-actions', event)"
      >
        <icon-dots :width="20" :height="20" :font-controlled="false" />
      </button>

      <div
        class="bg-primary-50 mt-6 flex h-16 w-16 items-center justify-center rounded-full"
      >
        <component
          :is="`icon-${iconName}`"
          :font-controlled="false"
          :width="iconSize"
          :height="iconSize"
          class="text-primary-700/90"
        />
      </div>
    </div>

    <!-- conteúdo clicável -->
    <button
      class="border-primary-100 flex flex-1 flex-col justify-between rounded-bl-2xl rounded-br-2xl bg-white px-6 pb-5 pt-4"
      @click="goToEvent"
    >
      <div class="space-y-1.5">
        <h3 class="text-grey-800 line-clamp-2 text-lg font-semibold">
          {{ truncate(event.name, 28) }}
        </h3>

        <p class="text-grey-300 text-sm">
          {{ event.event_Date ? formatDate(event.event_Date) : 'Sem Data' }}
        </p>
      </div>

      <div class="mt-6 flex items-center justify-between">
        <span
          v-if="event.eventTypeName"
          class="bg-primary-50 text-primary-700 ring-primary-100 inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1"
        >
          {{ event.eventTypeName }}
        </span>

        <span class="text-grey-300 flex items-center gap-1 text-sm font-medium">
          Ver detalhes
          <span aria-hidden="true">→</span>
        </span>
      </div>
    </button>
  </article>
</template>
