<script setup lang="ts">
import { useToast } from 'vue-toastification';
import { getChecklistService } from '~/services/checklistService';

interface IChecklistSectionRemoveModal {
  show?: boolean;
  section?: ChecklistSection | undefined;
}

const props = withDefaults(defineProps<IChecklistSectionRemoveModal>(), {
  show: false,
  section: undefined,
});

const toast = useToast();
const emit = defineEmits(['closeModal', 'success']);

const isSubmiting = ref<boolean>(false);
const serverErrors = ref<ServerError>({
  hasErrors: false,
  message: '',
});

const nuxtApp = useNuxtApp();
const checklistService = getChecklistService(nuxtApp.$api);
const { t } = useI18n();

const onSubmit = () => {
  isSubmiting.value = true;
  checklistService
    .removeSection(Number(props.section?.id))
    .then(() => {
      emit('closeModal');
      emit('success');
      toast.success(t('checklist.section_removed'));
    })
    .catch((err) => {
      console.log(err.data);
      serverErrors.value.message = getServerErrors(err.data);
      serverErrors.value.hasErrors = true;
      isSubmiting.value = false;
    })
    .finally(() => {
      isSubmiting.value = false;
    });
};
</script>
<template>
  <BaseModal
    :title="t('checklist.section_remove_title')"
    :show="show"
    @close-modal="$emit('closeModal')"
  >
    <div v-if="section" class="my-2">
      <p class="text-grey-600 mb-4 text-center text-base md:text-lg">
        {{ t('checklist.section_remove_confirm', { title: section.title }) }}
      </p>

      <div class="w-full">
        <div v-if="isSubmiting" class="mt-4 flex items-center justify-center">
          <BaseLoading size="md" orientation="horizontal" />
        </div>

        <BaseError v-if="serverErrors.hasErrors">{{
          serverErrors.message
        }}</BaseError>
      </div>
    </div>
    <div class="flex w-full justify-center gap-3">
      <BaseButton
        type="submit"
        btn-type="primary"
        class="my-1"
        size="md"
        :disabled="isSubmiting"
        :loading="isSubmiting"
        @click="onSubmit"
        >{{ t('checklist.remove_now') }}</BaseButton
      >

      <BaseButton
        type="button"
        btn-type="outline-primary"
        class="my-1"
        size="md"
        :disabled="isSubmiting"
        @click="$emit('closeModal')"
        >{{ t('common.cancel') }}</BaseButton
      >
    </div>
  </BaseModal>
</template>
