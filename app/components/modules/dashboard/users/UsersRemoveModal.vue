<script setup lang="ts">
import { useToast } from 'vue-toastification';
import { getUserService } from '~/services/userService';

interface IUserRemoveProps {
  show?: boolean;
  user?: User | undefined;
}

const props = withDefaults(defineProps<IUserRemoveProps>(), {
  show: false,
  user: undefined,
});

const { t } = useI18n();
const toast = useToast();
const emit = defineEmits(['closeModal', 'success']);

const isSubmiting = ref<boolean>(false);
const serverErrors = ref<ServerError>({
  hasErrors: false,
  message: '',
});

const nuxtApp = useNuxtApp();
const userService = getUserService(nuxtApp.$api);

const onSubmit = () => {
  isSubmiting.value = true;
  userService
    .removeUser(Number(props.user?.id))
    .then(() => {
      emit('closeModal');
      emit('success');
      toast.success(t('users.removed_success'));
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
    :title="t('users.remove_title')"
    :show="show"
    @close-modal="$emit('closeModal')"
  >
    <div v-if="user" class="my-2">
      <p class="text-grey-600 mb-4 text-center text-base md:text-lg">
        {{ t('users.remove_confirm', { name: user.name }) }}
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
        >{{ t('users.remove_now') }}</BaseButton
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
