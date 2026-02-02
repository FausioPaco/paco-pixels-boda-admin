<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/yup';
import { useForm } from 'vee-validate';
import { useToast } from 'vue-toastification';
import { object, string } from 'yup';
import { getEventProgramService } from '~/services/eventProgramService';

interface Props {
  show?: boolean;
  item?: EventProgramItem | undefined;
}

const props = withDefaults(defineProps<Props>(), {
  show: false,
  item: undefined,
});

const emit = defineEmits(['closeModal', 'success']);

const nuxtApp = useNuxtApp();
const eventProgramService = getEventProgramService(nuxtApp.$api);

const toast = useToast();
const isSubmiting = ref(false);

const serverErrors = ref<ServerError>({
  hasErrors: false,
  message: '',
});

const { eventId } = useEventStore();

const { errors, handleSubmit, defineField, resetForm } = useForm({
  validationSchema: toTypedSchema(
    object({
      time: string()
        .required('A hora é obrigatória')
        .matches(/^\d{2}:\d{2}$/, 'A hora deve estar no formato HH:mm'),
      title: string()
        .required('O título é obrigatório')
        .max(120, 'O título não pode ter mais de 120 caracteres'),
      description: string()
        .max(800, 'A descrição não pode ter mais de 800 caracteres')
        .nullable(),
    }),
  ),
});

const [time, timeAttrs] = defineField('time');
const [title, titleAttrs] = defineField('title');
const [description, descriptionAttrs] = defineField('description');

const showSuccess = (message: string) => toast.success(message);

const closeModal = () => {
  resetForm();
  serverErrors.value = { hasErrors: false, message: '' };
  emit('closeModal');
};

watch(
  () => props.item,
  (it) => {
    resetForm({
      values: {
        time: it?.time ?? '',
        title: it?.title ?? '',
        description: it?.description ?? '',
      },
    });

    serverErrors.value = { hasErrors: false, message: '' };
  },
  { immediate: true },
);

const onSubmit = handleSubmit(async (values) => {
  if (!eventId) {
    serverErrors.value = {
      hasErrors: true,
      message: 'O evento não foi encontrado.',
    };
    return;
  }

  isSubmiting.value = true;
  serverErrors.value.hasErrors = false;

  const payload = {
    time: values.time,
    title: values.title,
    description: values.description?.trim() ? values.description : null,
  };

  try {
    if (!props.item) {
      await eventProgramService.addItem(eventId, payload);
      showSuccess('O item foi criado com sucesso');
    } else {
      await eventProgramService.updateItem(eventId, props.item.id, payload);
      showSuccess('O item foi actualizado com sucesso');
    }

    resetForm();
    emit('closeModal');
    emit('success');
  } catch (err: unknown) {
    if (isFetchErrorLike(err)) {
      serverErrors.value.message = getServerErrors(err.data);
    } else {
      serverErrors.value.message = 'Ocorreu um erro ao registar o item';
    }

    serverErrors.value.hasErrors = true;
  } finally {
    isSubmiting.value = false;
  }
});
</script>

<template>
  <BaseModal
    :title="item ? 'Actualizar item' : 'Adicionar item'"
    :show="show"
    @close-modal="closeModal"
  >
    <form class="mb-5 w-full px-4 text-left" @submit.prevent="onSubmit">
      <BaseInput
        id="programTime"
        v-model="time"
        v-bind="timeAttrs"
        :error-message="errors.time"
        :readonly="isSubmiting"
        type="text"
        name="time"
        label="Hora:"
        placeholder="Ex.: 15:00"
      />

      <BaseInput
        id="programTitle"
        v-model="title"
        v-bind="titleAttrs"
        :error-message="errors.title"
        :readonly="isSubmiting"
        type="text"
        name="title"
        label="Título:"
        placeholder="Ex.: Cerimónia"
      />

      <BaseTextarea
        id="programDescription"
        v-model="description"
        v-bind="descriptionAttrs"
        :error-message="errors.description"
        :readonly="isSubmiting"
        name="description"
        label="Descrição (opcional):"
        placeholder="Coloque mais detalhes, se necessário"
        :rows="4"
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
        >
          {{ item ? 'Actualizar agora' : 'Adicionar agora' }}
        </BaseButton>

        <BaseButton
          type="button"
          btn-type="outline-primary"
          class="my-3"
          size="md"
          :disabled="isSubmiting"
          @click="closeModal"
        >
          Cancelar
        </BaseButton>
      </div>
    </form>
  </BaseModal>
</template>
