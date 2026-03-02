<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/yup';
import { useForm } from 'vee-validate';
import { useToast } from 'vue-toastification';
import * as yup from 'yup';
import { getUserService } from '~/services/userService';

interface IUsersForm {
  show?: boolean;
  user?: User | undefined;
}

const emit = defineEmits(['closeModal', 'success']);
const { roles, refreshRoles } = await useRolesList();

const props = withDefaults(defineProps<IUsersForm>(), {
  show: false,
  user: undefined,
});

const nuxtApp = useNuxtApp();
const userService = getUserService(nuxtApp.$api);
const eventStore = useEventStore();
const authStore = useAuthStore();

const toast = useToast();
const isSubmiting = ref<boolean>(false);
const serverErrors = ref<ServerError>({
  hasErrors: false,
  message: '',
});

const { errors, handleSubmit, defineField, resetForm } = useForm({
  validationSchema: toTypedSchema(
    yup.object({
      isUpdating: yup.boolean().default(false),
      name: yup
        .string()
        .matches(/[A-Za-zÀ-ÖØ-öø-ÿ\s'-]+/, 'Deve ser um nome válido')
        .required('O nome do utilizador é obrigatório')
        .default(''),
      email: yup
        .string()
        .email('Deve ser um email válido')
        .required('O email é obrigatório'),

      password: yup.string().when('isUpdating', {
        is: true,
        then: (schema) => schema,
        otherwise: (schema) =>
          schema.required('A  palavra passe é obrigatória'),
      }),

      passwordConfirm: yup.string().when('isUpdating', {
        is: true,
        then: (schema) => schema,
        otherwise: (schema) =>
          schema
            .required('Deve confirmar a palavra passe')
            .oneOf([yup.ref('password')], 'Deve ser o mesmo que palavra-passe'),
      }),

      role: yup
        .number()
        .typeError('Deves especificar o tipo de previlégio')
        .positive('Deves especificar o tipo de previlégio')
        .integer('Deves especificar o tipo de previlégio')
        .required('Deves especificar o tipo de previlégio'),
    }),
  ),
});

const [name, nameAttrs] = defineField('name');
const [email, emailAttrs] = defineField('email');
const [password, passwordAttrs] = defineField('password');
const [passwordConfirm, passwordConfirmAttrs] = defineField('passwordConfirm');
const [role, roleAttrs] = defineField('role');

const onSubmit = handleSubmit((values, _) => {
  isSubmiting.value = true;
  serverErrors.value.hasErrors = false;

  const userInput: UserInput = {
    name: values.name,
    email: values.email,
    password: values.password,
    roleId: values.role,
    eventId: eventStore.eventId!,
    partnerId: authStore.user?.partnerId,
  };

  if (!props.user) {
    userService
      .createUser(userInput)
      .then(() => {
        resetForm();
        emit('closeModal');
        emit('success');
        toast.success('O utilizador foi criado com sucesso!');
      })
      .catch((err) => {
        console.log(err.data);
        serverErrors.value.message = getServerErrors(err.data);
        serverErrors.value.hasErrors = true;
      })
      .finally(() => {
        isSubmiting.value = false;
      });
  } else {
    userService
      .updateUser(Number(props.user?.id), userInput)
      .then(() => {
        resetForm();
        emit('closeModal');
        emit('success');
        toast.success('O utilizador foi actualizado com sucesso');
      })
      .catch((err) => {
        console.log(err);
        serverErrors.value.message = getServerErrors(err.data);
        serverErrors.value.hasErrors = true;
      })
      .finally(() => {
        isSubmiting.value = false;
      });
  }
});

watch(
  () => props.user,
  (user) => {
    resetForm({
      values: {
        isUpdating: !!user,
        name: user?.name ?? '',
        email: user?.email ?? '',
        password: '',
        passwordConfirm: '',
        role: user?.roleId ?? undefined,
      },
    });

    serverErrors.value = { hasErrors: false, message: '' };
  },
  { immediate: true },
);

const closeModal = () => {
  resetForm();
  emit('closeModal');
};

onMounted(() => {
  refreshRoles({ force: true });
});
</script>
<template>
  <BaseModal
    :title="user ? 'Actualizar Utilizador' : 'Criar Utilizador'"
    :show="show"
    @close-modal="closeModal"
  >
    <form
      id="userForm"
      class="mb-5 w-full px-4 text-left"
      @submit.prevent="onSubmit"
    >
      <BaseInput
        id="userName"
        v-model="name"
        v-bind="nameAttrs"
        :error-message="errors.name"
        :readonly="isSubmiting"
        autocomplete="name"
        type="text"
        name="name"
        label="Nome:"
        placeholder="Coloque o nome do utilizador"
      />
      <BaseSelect
        v-if="roles"
        id="rolePinput"
        v-model="role"
        v-bind="roleAttrs"
        :error-message="errors.role"
        :readonly="isSubmiting"
        label="Previlégio: "
        :options="
          roles.map((role) => ({
            id: role.id,
            name: role.name,
            value: role.id,
          }))
        "
      />

      <BaseInput
        id="userEmail"
        v-model="email"
        v-bind="emailAttrs"
        :error-message="errors.email"
        autocomplete="email"
        type="email"
        name="userEmail"
        label="Email:"
        placeholder="Coloque endereço eletrônico"
      />

      <BaseInput
        v-if="!user"
        id="password"
        v-model="password"
        autocomplete="new-password"
        v-bind="passwordAttrs"
        :error-message="errors.password"
        type="password"
        name="password"
        label="Password:"
        placeholder="Coloque a palavra passe"
      />

      <BaseInput
        v-if="!user"
        id="passwordConfirm"
        v-model="passwordConfirm"
        autocomplete="new-password"
        v-bind="passwordConfirmAttrs"
        :error-message="errors.passwordConfirm"
        type="password"
        name="passwordConfirm"
        label="Confirmar password:"
        placeholder="Confirme a palavra-passe"
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
          >{{ user ? 'Actualizar agora' : 'Adicionar agora' }}</BaseButton
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
