<script lang="ts" setup>
import { toTypedSchema } from '@vee-validate/yup';
import { useForm } from 'vee-validate';
import { useToast } from 'vue-toastification';
import { number, object, string } from 'yup';
import { getDeskService } from '~/services/deskService';

interface IDeskFormProps {
  show?: boolean;
  desk?: Desk | undefined;
}

const emit = defineEmits(['closeModal', 'success']);

const props = withDefaults(defineProps<IDeskFormProps>(), {
  show: false,
  desk: undefined,
});

const nuxtApp = useNuxtApp();
const deskService = getDeskService(nuxtApp.$api);

const toast = useToast();
const isSubmiting = ref<boolean>(false);
const serverErrors = ref<ServerError>({
  hasErrors: false,
  message: '',
});

const { errors, handleSubmit, defineField, resetForm } = useForm({
  validationSchema: toTypedSchema(
    object({
      name: string()
        .matches(/[A-Za-zÀ-ÖØ-öø-ÿ\s'-]+/, 'Deve ser um nome válido')
        .required('O seu nome é obrigatório'),
      seats_Limit: number()
        .transform((value, originalValue) =>
          String(originalValue).trim() === '' ? undefined : value,
        )
        .typeError('Deve colocar um número')
        .positive('Deve colocar um número positivo')
        .integer('O número de lugares não pode conter vírgulas')
        .required('O número de lugares é obrigatório'),
    }),
  ),
});

const [name, nameAttrs] = defineField('name');
const [seatsLimit, seatsLimitAttrs] = defineField('seats_Limit');

const { eventId } = useEventStore();

const onSubmit = handleSubmit((values, _) => {
  isSubmiting.value = true;
  serverErrors.value.hasErrors = false;

  const deskInput: DeskInput = {
    eventId: eventId!,
    name: values.name,
    seats_Limit: values.seats_Limit,
  };

  if (!props.desk) {
    deskService
      .createDesk(deskInput)
      .then(() => {
        resetForm();
        emit('closeModal');
        emit('success');
        showSuccess('A mesa foi criada com sucesso');
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
    deskService
      .updateDesk(Number(props.desk?.id), deskInput)
      .then(() => {
        resetForm();
        emit('closeModal');
        emit('success');
        showSuccess('A mesa foi actualizada com sucesso');
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

const showSuccess = (message: string) => {
  toast.success(message);
};

const closeModal = () => {
  resetForm();
  emit('closeModal');
};

watch(
  () => props.desk,
  (desk) => {
    resetForm({
      values: {
        name: desk?.name ?? '',
        seats_Limit: desk?.seats_Limit ?? undefined,
      },
    });

    serverErrors.value = { hasErrors: false, message: '' };
  },
  { immediate: true },
);
</script>
<template>
  <BaseModal
    :title="desk ? 'Actualizar Mesa' : 'Criar Mesa'"
    :show="show"
    @close-modal="closeModal"
  >
    <form
      id="deskForm"
      class="mb-5 w-full px-4 text-left"
      @submit.prevent="onSubmit"
    >
      <BaseInput
        id="deskName"
        v-model="name"
        v-bind="nameAttrs"
        :error-message="errors.name"
        :readonly="isSubmiting"
        autocomplete="name"
        type="text"
        name="name"
        label="Nome:"
        placeholder="Coloque o nome da mesa"
      />

      <BaseInput
        id="seatsLimit"
        v-model="seatsLimit"
        v-bind="seatsLimitAttrs"
        :error-message="errors.seats_Limit"
        :readonly="isSubmiting"
        type="number"
        name="name"
        label="Nº de lugares:"
        placeholder="Coloque o número de lugares da mesa"
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
          >{{ desk ? 'Actualizar agora' : 'Adicionar agora' }}</BaseButton
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
