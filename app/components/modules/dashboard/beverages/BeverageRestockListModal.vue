<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    show?: boolean;
    candidates?: EventBeverage[];
  }>(),
  { show: false, candidates: () => [] },
);

const emit = defineEmits<{
  (e: 'closeModal'): void;
}>();

const { t } = useI18n();
const close = () => emit('closeModal');
</script>

<template>
  <BaseModal
    :show="props.show"
    :title="t('beverages.restock_list_title')"
    @close-modal="close"
  >
    <div class="space-y-4">
      <p class="text-grey-700 text-sm">
        {{ t('beverages.restock_list_description') }}
      </p>

      <div
        v-if="props.candidates.length === 0"
        class="bg-grey-50 text-grey-700 rounded-md px-4 py-3"
      >
        {{ t('beverages.restock_list_empty') }}
      </div>

      <ul v-else class="space-y-2">
        <li
          v-for="b in props.candidates"
          :key="b.id"
          class="border-grey-200 flex items-center justify-between rounded-md border px-3 py-2"
        >
          <div>
            <p class="text-grey-900 font-bold">{{ b.name }}</p>
            <p class="text-grey-500 text-sm">{{ b.beverageCategoryName }}</p>
          </div>

          <div class="flex items-center gap-2">
            <BaseBadge
              :type="b.status === 'Low' ? 'warning' : 'error'"
              :text="
                b.status === 'Low'
                  ? t('beverages.status_low')
                  : t('beverages.status_out_of_stock')
              "
            />
            <span class="text-grey-800 font-bold">{{
              b.currentUnits ?? 0
            }}</span>
          </div>
        </li>
      </ul>

      <div class="mt-2 flex justify-end">
        <BaseButton btn-type="primary" btn-size="md" @click.prevent="close">
          {{ t('common.close') }}
        </BaseButton>
      </div>
    </div>
  </BaseModal>
</template>
