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
  (e: 'update' | 'remove' | 'open-actions', event: BodaEvent): void;
}>();

const iconName = computed(() => props.event.eventTypeIcon || 'event-wedding');
const eventStore = useEventStore();

const goToEvent = () => {
  eventStore.selectEvent({
    id: props.event.id,
    name: props.event.name,
    slug: props.event.slug,
    icon: iconName.value,
    initials: props.event.initials,
    qrCodeImage_Url: props.event.qrCodeImage_Url,
    eventTypeId: props.event.eventTypeId ?? undefined,
    eventTypeName: props.event.eventTypeName,
    eventTypeSlug: props.event.eventTypeSlug,
  });

  navigateTo('/admin');
};

const showMenu = ref(false);

const toggleMenu = (e: MouseEvent) => {
  e.stopPropagation();
  showMenu.value = !showMenu.value;
};

const onEditClick = (e: MouseEvent) => {
  e.stopPropagation();
  showMenu.value = false;
  emit('update', props.event);
};

const onRemoveClick = (e: MouseEvent) => {
  e.stopPropagation();
  showMenu.value = false;
  emit('remove', props.event);
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
      <!-- Event Item Menu -->
      <div v-if="showActions" class="absolute right-3 top-3">
        <div class="relative">
          <button
            type="button"
            class="border-primary-100 text-grey-400 hover:bg-primary-500/10 group flex h-8 w-8 items-center justify-center rounded-full border transition-colors duration-300 ease-in"
            @click.stop="toggleMenu"
          >
            <icon-dots
              :width="20"
              :height="20"
              :font-controlled="false"
              class="hover:text-primary-600 group-hover:text-primary-600"
            />
          </button>

          <Transition name="fade">
            <div
              v-if="showMenu"
              class="border-grey-100 absolute right-0 z-20 mt-2 w-44 rounded-xl border bg-white p-1 shadow-lg"
            >
              <button
                type="button"
                class="hover:bg-grey-50 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs"
                @click.stop="onEditClick"
              >
                <IconPencil :font-controlled="false" class="block h-4 w-4" />
                <span>Editar evento</span>
              </button>

              <button
                type="button"
                class="text-danger-700 hover:bg-danger-50 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs"
                @click.stop="onRemoveClick"
              >
                <IconCloseSimple
                  :font-controlled="false"
                  class="block h-3 w-3"
                />
                <span>Remover</span>
              </button>
            </div>
          </Transition>
        </div>
      </div>

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
