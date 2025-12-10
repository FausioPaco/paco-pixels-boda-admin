<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/yup';
import { useForm } from 'vee-validate';
import { useToast } from 'vue-toastification';
import { boolean, date, number, object, string } from 'yup';
import { getEventService } from '~/services/eventService';

interface IEventForm {
  show?: boolean;
  event?: BodaEvent | null;
}

const props = withDefaults(defineProps<IEventForm>(), {
  show: false,
  event: null,
});

const emit = defineEmits(['closeModal', 'success']);

const nuxtApp = useNuxtApp();
const eventService = getEventService(nuxtApp.$api);

const { eventTypes, isRefreshing: isRefreshingTypes } = await useEventTypes();

const toast = useToast();
const isSubmiting = ref<boolean>(false);
const serverErrors = ref<ServerError>({
  hasErrors: false,
  message: '',
});

const { errors, handleSubmit, defineField, resetForm } = useForm<EventInput>({
  validationSchema: toTypedSchema(
    object({
      name: string()
        .trim()
        .min(2, 'O nome do evento deve ter pelo menos 2 caracteres')
        .max(200, 'O nome do evento é demasiado longo')
        .required('O nome do evento é obrigatório'),

      description: string()
        .trim()
        .max(2000, 'A descrição é demasiado longa')
        .optional(),

      initials: string()
        .trim()
        .min(1, 'As iniciais devem ter pelo menos 1 carácter')
        .max(5, 'As iniciais não podem ter mais de 5 caracteres')
        .required('As iniciais são obrigatórias'),

      eventTypeId: number()
        .transform((value, originalValue) =>
          String(originalValue).trim() === '' ? undefined : value,
        )
        .typeError('Deve escolher o tipo de evento')
        .required('O tipo de evento é obrigatório'),

      event_Date: date().nullable(),
      autoCreateChecklist: boolean().default(false),
    }),
  ),
});

// Campos do formulário
const [name, nameAttrs] = defineField('name');
const [description, descriptionAttrs] = defineField('description');
const [initials, initialsAttrs] = defineField('initials');
const [eventTypeId, eventTypeIdAttrs] = defineField('eventTypeId');
const [event_Date, eventDateAttrs] = defineField('event_Date');
const [autoCreateChecklist, autoCreateChecklistAttrs] = defineField(
  'autoCreateChecklist',
);

// Submit
const onSubmit = handleSubmit((values) => {
  isSubmiting.value = true;
  serverErrors.value.hasErrors = false;

  const payload: EventInput = {
    name: values.name,
    description: values.description ?? '',
    initials: values.initials,
    eventTypeId: values.eventTypeId,
    event_Date: values.event_Date ?? undefined,
    autoCreateChecklist: values.autoCreateChecklist,
  };

  if (!props.event) {
    // Criar
    eventService
      .createEvent(payload)
      .then(() => {
        emit('success');
        resetForm();
        toast.success('O evento foi criado com sucesso');
      })
      .catch((err) => {
        console.log(err);
        serverErrors.value.message = getServerErrors(err.data);
        serverErrors.value.hasErrors = true;
      })
      .finally(() => {
        isSubmiting.value = false;
      });
  } else {
    // Actualizar
    eventService
      .updateEvent(props.event.id, payload)
      .then(() => {
        emit('success');
        toast.success('O evento foi actualizado com sucesso');
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

const closeModal = () => {
  resetForm();
  emit('closeModal');
};

// Preencher valores ao editar
watch(
  () => props.event,
  (current) => {
    resetForm({
      values: {
        name: current?.name ?? '',
        description: current?.description ?? '',
        initials: current?.initials ?? '',
        eventTypeId: current?.eventTypeId ?? undefined,
        event_Date: current?.event_Date
          ? new Date(current.event_Date)
          : undefined,
      },
    });

    serverErrors.value = { hasErrors: false, message: '' };
  },
  { immediate: true },
);
</script>

<template>
  <BaseModal
    :title="props.event ? 'Editar evento' : 'Novo evento'"
    :show="show"
    icon="Calendar"
    @close-modal="closeModal"
  >
    <BaseLoading v-if="isRefreshingTypes" size="lg" orientation="vertical" />

    <form
      v-if="!isRefreshingTypes"
      id="eventForm"
      class="mb-5 w-full animate-fadeIn px-4 text-left"
      @submit.prevent="onSubmit"
    >
      <BaseInput
        id="eventName"
        v-model="name"
        v-bind="nameAttrs"
        :error-message="errors.name"
        :readonly="isSubmiting"
        autocomplete="off"
        type="text"
        name="name"
        label="Nome do evento"
        placeholder="Ex.: Casamento Ana & João"
      />

      <BaseInput
        id="eventInitials"
        v-model="initials"
        v-bind="initialsAttrs"
        :error-message="errors.initials"
        :readonly="isSubmiting"
        autocomplete="off"
        type="text"
        name="initials"
        label="Iniciais"
        placeholder="Ex.: AJ"
        maxlength="5"
      />

      <BaseSelect
        v-if="eventTypes"
        id="eventType"
        v-model="eventTypeId"
        v-bind="eventTypeIdAttrs"
        :error-message="errors.eventTypeId"
        :readonly="isSubmiting"
        label="Tipo de evento"
        :options="
          eventTypes.map((type) => ({
            id: type.id,
            name: type.name,
            value: type.id,
          }))
        "
      />

      <div>
        <label class="mb-1 block text-sm font-medium">Data do evento</label>
        <DatePicker
          v-model="event_Date"
          v-bind="eventDateAttrs"
          locale="pt-PT"
          :enable-time-picker="false"
          :clearable="true"
          :teleport="true"
          :format="'dd/MM/yyyy'"
          :auto-apply="true"
          :disabled="isSubmiting"
          placeholder="Selecione a data"
          select-text="Selecionar"
          cancel-text="Cancelar"
        />
        <p
          v-if="errors.event_Date"
          class="text-danger-800 mt-1 animate-fadeIn text-sm"
        >
          {{ errors.event_Date }}
        </p>
      </div>

      <BaseTextArea
        id="eventDescription"
        v-model="description"
        v-bind="descriptionAttrs"
        :error-message="errors.description"
        :readonly="isSubmiting"
        name="description"
        label="Descrição (opcional)"
        placeholder="Notas sobre o evento (local, horário, etc.)"
        rows="4"
      />

      <BaseCheckbox
        v-if="!props.event"
        id="autoCreateChecklist"
        v-model="autoCreateChecklist"
        v-bind="autoCreateChecklistAttrs"
        :error="errors.autoCreateChecklist"
        :readonly="isSubmiting"
        label="Criar cronograma automático"
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
          :disabled="isSubmiting"
          :loading="isSubmiting"
        >
          {{ props.event ? 'Actualizar agora' : 'Adicionar agora' }}
        </BaseButton>

        <BaseButton
          type="button"
          btn-type="outline-primary"
          class="my-3"
          size="md"
          :disabled="isSubmiting"
          @click="$emit('closeModal')"
        >
          Cancelar
        </BaseButton>
      </div>
    </form>
  </BaseModal>
</template>
