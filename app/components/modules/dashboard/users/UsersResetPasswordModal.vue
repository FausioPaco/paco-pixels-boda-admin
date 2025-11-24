<script setup lang="ts">
import { useToast } from 'vue-toastification';
import { getUserService } from '~/services/userService';
import type { ServerError } from '~/types/api/error';
import { toTypedSchema } from '@vee-validate/yup';
import { useForm } from 'vee-validate';
import { object, string } from 'yup';
import type { PasswordInput, User } from '~/types/api/user';

interface IUsersPasswordForm {
  show?: boolean;
  user?: User | undefined;
}

const emit = defineEmits(['closeModal', 'success']);

const nuxtApp = useNuxtApp();
const userService = getUserService(nuxtApp.$api);

const props = withDefaults(defineProps<IUsersPasswordForm>(), {
  show: false,
  user: undefined,
});

const toast = useToast();
const isSubmiting = ref<boolean>(false);
const serverErrors = ref<ServerError>({
  hasErrors: false,
  message: '',
});

const { errors, handleSubmit, defineField, resetForm } = useForm({
  validationSchema: toTypedSchema(
    object({
      password: string().required('A palavra passe é obrigatória').default(''),
    }),
  ),
});

const [password, passwordAttrs] = defineField('password');

const onSubmit = handleSubmit((values, _) => {
  isSubmiting.value = true;
  serverErrors.value.hasErrors = false;

  const passwordInput: PasswordInput = {
    newPassword: values.password,
  };

  userService
    .resetPassword(Number(props.user?.id), passwordInput)
    .then(() => {
      emit('closeModal');
      resetForm({
        values: {
          password: '',
        },
      });
      emit('success');
      toast.success('A palavra passe foi alterada com sucesso');
    })
    .catch((err) => {
      console.log(err.data);
      serverErrors.value.message = getServerErrors(err.data);
      serverErrors.value.hasErrors = true;
    })
    .finally(() => {
      isSubmiting.value = false;
    });
});

const closeModal = () => {
  emit('closeModal');
  resetForm({
    values: {
      password: '',
    },
  });
};

watch(
  () => props.show,
  (show) => {
    if (show) {
      resetForm({
        values: {
          password: '',
        },
      });

      serverErrors.value = { hasErrors: false, message: '' };
    }
  },
  { immediate: true },
);
</script>
<template>
  <BaseModal
    title="Alterar palavra passe"
    :show="show"
    @close-modal="closeModal"
  >
    <form
      id="passwordResetForm"
      class="mb-5 w-full px-4 text-left"
      @submit.prevent="onSubmit"
    >
      <BaseInput
        id="password"
        v-model="password"
        autocomplete="new-password"
        v-bind="passwordAttrs"
        :error-message="errors.password"
        type="password"
        name="password"
        label="Nova password:"
        placeholder="Coloque a nova palavra-passe"
      />

      <BaseError v-if="serverErrors.hasErrors">{{
        serverErrors.message
      }}</BaseError>

      <div class="flex w-full justify-center gap-3">
        <BaseButton
          type="submit"
          btn-type="primary"
          class="my-3"
          size="md"
          :disabled="isSubmiting"
          :loading="isSubmiting"
          @click="onSubmit"
          >Actualizar agora</BaseButton
        >

        <BaseButton
          type="button"
          btn-type="outline-primary"
          class="my-3"
          size="md"
          :disabled="isSubmiting"
          @click="closeModal"
          >Cancelar</BaseButton
        >
      </div>
    </form>
  </BaseModal>
</template>
