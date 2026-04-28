<script setup lang="ts">
import { useToast } from 'vue-toastification';
import { getDeskService } from '~/services/deskService';

interface IDeskRemoveFormProps {
  show?: boolean;
  desk?: Desk | undefined;
}

const props = withDefaults(defineProps<IDeskRemoveFormProps>(), {
  show: false,
  desk: undefined,
});

const toast = useToast();
const emit = defineEmits(['closeModal', 'success']);

const isSubmiting = ref<boolean>(false);
const serverErrors = ref<ServerError>({
  hasErrors: false,
  message: '',
});

const nuxtApp = useNuxtApp();
const deskService = getDeskService(nuxtApp.$api);
const { t } = useI18n();

const onSubmit = () => {
  isSubmiting.value = true;
  deskService
    .removeDesk(Number(props.desk?.id))
    .then(() => {
      emit('closeModal');
      emit('success');
      toast.success(t('desks.removed_success'));
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
    :title="t('desks.remove_title')"
    :show="show"
    @close-modal="$emit('closeModal')"
  >
    <div v-if="desk" class="my-2">
      <p class="text-grey-600 mb-4 text-center text-base md:text-lg">
        {{ t('desks.remove_confirm_prefix') }}
        <span class="font-bold">{{ desk.name }}</span
        >?
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
        >{{ t('common.remove_now') }}</BaseButton
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
