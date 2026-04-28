<script setup lang="ts">
import { useForm } from 'vee-validate';
import { useToast } from 'vue-toastification';
import * as yup from 'yup';
import { getUserService } from '~/services/userService';

interface Props {
  show?: boolean;
}

withDefaults(defineProps<Props>(), {
  show: false,
});

const emit = defineEmits<{
  (e: 'close' | 'updated'): void;
}>();

const nuxtApp = useNuxtApp();
const userService = getUserService(nuxtApp.$api);
const toast = useToast();
const { t } = useI18n();
const serverErrors = ref<ServerError>({
  hasErrors: false,
  message: '',
});

const isSubmitting = ref(false);

const schema = yup.object({
  oldPassword: yup.string().required('A palavra-passe actual é obrigatória.'),
  newPassword: yup
    .string()
    .required('A nova palavra-passe é obrigatória.')
    .min(8, 'A nova palavra-passe deve ter pelo menos 8 caracteres.'),
  confirmPassword: yup
    .string()
    .oneOf(
      [yup.ref('newPassword')],
      'A confirmação não coincide com a nova palavra-passe.',
    )
    .required('A confirmação da nova palavra-passe é obrigatória.'),
});

const { handleSubmit, errors, defineField, resetForm } = useForm({
  validationSchema: schema,
  initialValues: {
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  },
});

const [oldPassword, oldPasswordAttrs] = defineField('oldPassword');
const [newPassword, newPasswordAttrs] = defineField('newPassword');
const [confirmPassword, confirmPasswordAttrs] = defineField('confirmPassword');

const onSubmit = handleSubmit(async (formValues) => {
  isSubmitting.value = true;
  serverErrors.value.hasErrors = false;
  const payload = {
    oldPassword: formValues.oldPassword,
    newPassword: formValues.newPassword,
  };

  userService
    .changeMyPassword(payload)
    .then(() => {
      emit('updated');
      resetForm();
      toast.success(t('users.password_updated_success'));
    })
    .catch((err) => {
      console.log(err);
      serverErrors.value.message = getServerErrors(err!.data);
      serverErrors.value.hasErrors = true;
    })
    .finally(() => {
      isSubmitting.value = false;
    });
});

const closeModal = () => {
  resetForm();
  emit('close');
};
</script>

<template>
  <BaseModal
    :title="t('users.change_my_password_title')"
    :show="show"
    @close-modal="closeModal"
  >
    <form
      id="changePasswordForm"
      class="mb-5 w-full animate-fadeIn px-4 text-left"
      @submit.prevent="onSubmit"
    >
      <BaseInput
        id="userOldPassword"
        v-model="oldPassword"
        v-bind="oldPasswordAttrs"
        :error-message="errors.oldPassword"
        name="oldPassword"
        type="password"
        :label="t('users.old_password_label')"
        :placeholder="t('users.old_password_placeholder')"
      />

      <BaseInput
        id="userNewPassword"
        v-model="newPassword"
        v-bind="newPasswordAttrs"
        :error-message="errors.newPassword"
        name="newPassword"
        type="password"
        label="Nova palavra passe:"
        :placeholder="t('users.password_confirm_placeholder')"
      />

      <BaseInput
        id="userConfirmPassword"
        v-model="confirmPassword"
        v-bind="confirmPasswordAttrs"
        :error-message="errors.confirmPassword"
        name="confirmPassword"
        type="password"
        :label="t('users.password_confirm_label')"
        :placeholder="t('users.password_confirm_placeholder')"
      />

      <BaseError v-if="serverErrors.hasErrors" class="mt-4">
        {{ serverErrors.message }}
      </BaseError>

      <p class="text-grey-400 text-sm">
        {{ t('users.password_security_hint') }}
      </p>

      <div class="mt-6 flex animate-fadeIn items-center space-x-3">
        <BaseButton
          type="submit"
          btn-type="primary"
          class="my-3"
          size="md"
          :disabled="isSubmitting"
          :loading="isSubmitting"
        >
          {{ t('users.change_now') }}
        </BaseButton>

        <BaseButton
          type="button"
          btn-type="outline-primary"
          class="my-3"
          size="md"
          :disabled="isSubmitting"
          @click="$emit('close')"
        >
          {{ t('common.cancel') }}
        </BaseButton>
      </div>
    </form>
  </BaseModal>
</template>
