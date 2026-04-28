<script setup lang="ts">
type Props = { supplier: Supplier };
const props = defineProps<Props>();
const { t } = useI18n();

const showAbsent = computed(() => !!props.supplier.isAbsent);
const showPresence = computed(
  () => !showAbsent.value && !!props.supplier.isConfirmed,
);
const showArrival = computed(
  () => !showAbsent.value && !!props.supplier.isArrived,
);
</script>

<template>
  <div class="flex items-center gap-2">
    <BaseTooltip
      v-if="showAbsent"
      :text="t('suppliers.status_absent')"
      placement="top"
    >
      <template #trigger>
        <span
          class="bg-primary-50 inline-flex items-center rounded-md px-1.5 py-1"
        >
          <IconCloseSimple
            :font-controlled="false"
            class="text-danger-500 size-[12px]"
          />
        </span>
      </template>
    </BaseTooltip>

    <BaseTooltip
      v-if="showPresence"
      :text="t('suppliers.status_confirmed')"
      placement="top"
    >
      <template #trigger>
        <span
          class="bg-primary-50 inline-flex items-center rounded-md px-1.5 py-1"
        >
          <IconCheckmark
            :font-controlled="false"
            class="text-primary-700 size-[14px]"
          />
        </span>
      </template>
    </BaseTooltip>

    <BaseTooltip
      v-if="showArrival"
      :text="t('suppliers.status_arrived')"
      placement="top"
    >
      <template #trigger>
        <span
          class="bg-success-50 inline-flex items-center rounded-md px-1.5 py-1"
        >
          <IconDoorEnter
            :font-controlled="false"
            class="text-success-700 size-[14px]"
          />
        </span>
      </template>
    </BaseTooltip>
  </div>
</template>
