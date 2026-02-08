<script setup lang="ts">
type Props = {
  guest: Guest;
};

const props = defineProps<Props>();

const showAbsent = computed(() => !!props.guest.absence_Declared);
const showPresence = computed(
  () => !showAbsent.value && !!props.guest.presence_Confirmed,
);

const showArrival = computed(() => !showAbsent.value && !!props.guest.arrived);
</script>

<template>
  <div class="flex items-center gap-2">
    <!-- Ausente -->
    <BaseTooltip v-if="showAbsent" text="Ausente" placement="top">
      <template #trigger>
        <IconCloseSimple
          :font-controlled="false"
          class="text-danger-500 size-[16px]"
        />
      </template>
    </BaseTooltip>

    <!-- Presença confirmada -->
    <BaseTooltip v-if="showPresence" text="Presença confirmada" placement="top">
      <template #trigger>
        <span
          class="bg-success-50 inline-flex items-center rounded-md px-1.5 py-1"
        >
          <IconCheckmark
            :font-controlled="false"
            class="text-success-700 size-[14px]"
          />
        </span>
      </template>
    </BaseTooltip>

    <!-- Chegada confirmada -->
    <BaseTooltip v-if="showArrival" text="Chegada confirmada" placement="top">
      <template #trigger>
        <span
          class="bg-primary-50 inline-flex items-center rounded-md px-1.5 py-1"
        >
          <IconDoorEnter
            :font-controlled="false"
            class="text-primary-700 size-[14px]"
          />
        </span>
      </template>
    </BaseTooltip>
  </div>
</template>
