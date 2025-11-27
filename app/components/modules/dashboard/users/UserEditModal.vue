<script setup lang="ts">
import { useForm } from 'vee-validate';
import { useToast } from 'vue-toastification';
import * as yup from 'yup';
import { getUserService } from '~/services/userService';

interface Props {
  show?: boolean;
  user: User;
}

const props = withDefaults(defineProps<Props>(), {
  show: false,
});

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'updated', user: User): void;
}>();

const nuxtApp = useNuxtApp();
const userService = getUserService(nuxtApp.$api);
const toast = useToast();
const serverErrors = ref<ServerError>({
  hasErrors: false,
  message: '',
});

const isSubmitting = ref(false);

const schema = yup.object({
  name: yup
    .string()
    .required('O seu nome é obrigatório.')
    .min(2, 'O seu nome deve ter pelo menos 2 caracteres.'),
});

const { handleSubmit, errors, defineField, resetForm } = useForm({
  validationSchema: schema,
  initialValues: {
    name: props.user.name ?? '',
  },
});

const [name, nameAttrs] = defineField('name');

const onSubmit = handleSubmit(async (formValues) => {
  isSubmitting.value = true;
  serverErrors.value.hasErrors = false;
  const payload = { name: formValues.name.trimEnd().trimStart() };

  userService
    .updateMyProfile(payload)
    .then((userUpdated) => {
      emit('updated', userUpdated);
      resetForm();
      toast.success('O nome do seu perfil foi alterado com sucesso!');
    })
    .catch((err) => {
      console.log(err);
      serverErrors.value.message = getServerErrors(err.data);
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

watch(
  () => props.user,
  (val) => {
    name.value = val.name;
  },
);
</script>

<template>
  <BaseModal title="Modificar nome" :show="show" @close-modal="closeModal">
    <p class="text-grey-400 mt-1 text-xs font-medium">
      Actualize o seu nome tal como pretende que apareça no sistema.
    </p>

    <form
      id="changePasswordForm"
      class="mb-5 w-full animate-fadeIn px-4 text-left"
      @submit.prevent="onSubmit"
    >
      <BaseInput
        id="userName"
        v-model="name"
        v-bind="nameAttrs"
        :error-message="errors.name"
        name="name"
        type="text"
        label="Nome"
      />

      <BaseError v-if="serverErrors.hasErrors" class="mt-4">
        {{ serverErrors.message }}
      </BaseError>

      <div class="mt-6 flex animate-fadeIn items-center space-x-3">
        <BaseButton
          type="submit"
          btn-type="primary"
          class="my-3"
          size="md"
          :disabled="isSubmitting"
          :loading="isSubmitting"
        >
          Alterar agora
        </BaseButton>

        <BaseButton
          type="button"
          btn-type="outline-primary"
          class="my-3"
          size="md"
          :disabled="isSubmitting"
          @click="$emit('close')"
        >
          Cancelar
        </BaseButton>
      </div>
    </form>
  </BaseModal>
</template>
