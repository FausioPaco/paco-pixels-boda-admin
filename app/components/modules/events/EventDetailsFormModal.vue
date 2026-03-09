<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/yup';
import { useForm } from 'vee-validate';
import { useToast } from 'vue-toastification';
import { date, number, object, string } from 'yup';
import { getEventService } from '~/services/eventService';

defineOptions({
  name: 'EventDetailsFormModal',
});

interface Props {
  show?: boolean;
  event?: BodaEvent | null;
}

const props = withDefaults(defineProps<Props>(), {
  show: false,
  event: null,
});

const emit = defineEmits<{
  (e: 'closeModal' | 'success'): void;
}>();

const nuxtApp = useNuxtApp();
const eventService = getEventService(nuxtApp.$api);
const toast = useToast();

const isSubmiting = ref(false);
const serverErrors = ref<ServerError>({
  hasErrors: false,
  message: '',
});

const maxBirthDate = new Date();

const normalizeTimeString = (value?: string | null) => {
  if (!value) return null;
  return `${value}:00`;
};

const { errors, handleSubmit, defineField, resetForm } =
  useForm<EventDetailsFormValues>({
    validationSchema: toTypedSchema(
      object({
        location: string()
          .trim()
          .max(300, 'O local não pode ter mais de 300 caracteres')
          .nullable()
          .optional(),

        godparentsCount: number()
          .transform((value, originalValue) => {
            if (originalValue === '' || originalValue === null) return null;
            return Number.isNaN(value) ? null : value;
          })
          .nullable()
          .min(0, 'O número de padrinhos não pode ser negativo')
          .max(1000, 'O número de padrinhos é demasiado alto')
          .optional(),

        decorationType: string()
          .trim()
          .max(200, 'O tipo de decoração é demasiado longo')
          .nullable()
          .optional(),

        dietaryRestrictions: string()
          .trim()
          .max(1000, 'As restrições dietéticas são demasiado longas')
          .nullable()
          .optional(),

        guestProfile: string()
          .trim()
          .max(500, 'O perfil dos convidados é demasiado longo')
          .nullable()
          .optional(),

        colorPalette: string()
          .trim()
          .max(300, 'A paleta de cores é demasiado longa')
          .nullable()
          .optional(),

        event_End_Time: string()
          .trim()
          .matches(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Hora inválida')
          .nullable()
          .optional(),
        brideNationality: string()
          .trim()
          .max(120, 'A nacionalidade da noiva é demasiado longa')
          .nullable()
          .optional(),

        groomNationality: string()
          .trim()
          .max(120, 'A nacionalidade do noivo é demasiado longa')
          .nullable()
          .optional(),

        brideBirthDate: date()
          .nullable()
          .max(maxBirthDate, 'A data de nascimento não pode ser futura')
          .optional(),

        groomBirthDate: date()
          .nullable()
          .max(maxBirthDate, 'A data de nascimento não pode ser futura')
          .optional(),

        brideProfession: string()
          .trim()
          .max(150, 'A profissão da noiva é demasiado longa')
          .nullable()
          .optional(),

        groomProfession: string()
          .trim()
          .max(150, 'A profissão do noivo é demasiado longa')
          .nullable()
          .optional(),

        brideDocument: string()
          .trim()
          .max(100, 'O documento da noiva é demasiado longo')
          .nullable()
          .optional(),

        groomDocument: string()
          .trim()
          .max(100, 'O documento do noivo é demasiado longo')
          .nullable()
          .optional(),
      }),
    ),
  });

const [location, locationAttrs] = defineField('location');
const [godparentsCount, godparentsCountAttrs] = defineField('godparentsCount');
const [decorationType, decorationTypeAttrs] = defineField('decorationType');
const [dietaryRestrictions, dietaryRestrictionsAttrs] = defineField(
  'dietaryRestrictions',
);
const [guestProfile, guestProfileAttrs] = defineField('guestProfile');
const [colorPalette, colorPaletteAttrs] = defineField('colorPalette');
const [event_End_Time, eventEndTimeAttrs] = defineField('event_End_Time');

const [brideNationality, brideNationalityAttrs] =
  defineField('brideNationality');
const [groomNationality, groomNationalityAttrs] =
  defineField('groomNationality');
const [brideBirthDate, brideBirthDateAttrs] = defineField('brideBirthDate');
const [groomBirthDate, groomBirthDateAttrs] = defineField('groomBirthDate');
const [brideProfession, brideProfessionAttrs] = defineField('brideProfession');
const [groomProfession, groomProfessionAttrs] = defineField('groomProfession');
const [brideDocument, brideDocumentAttrs] = defineField('brideDocument');
const [groomDocument, groomDocumentAttrs] = defineField('groomDocument');

const closeModal = () => {
  serverErrors.value = { hasErrors: false, message: '' };
  emit('closeModal');
};

const onSubmit = handleSubmit((values) => {
  if (!props.event?.id) return;

  isSubmiting.value = true;
  serverErrors.value = { hasErrors: false, message: '' };

  const payload: EventDetailsInput = {
    location: values.location?.trim() || null,
    godparentsCount:
      values.godparentsCount === null || values.godparentsCount === undefined
        ? null
        : Number(values.godparentsCount),
    decorationType: values.decorationType?.trim() || null,
    dietaryRestrictions: values.dietaryRestrictions?.trim() || null,
    guestProfile: values.guestProfile?.trim() || null,
    colorPalette: values.colorPalette?.trim() || null,
    event_End_Time: normalizeTimeString(values.event_End_Time),
    brideNationality: values.brideNationality?.trim() || null,
    groomNationality: values.groomNationality?.trim() || null,
    brideBirthDate: values.brideBirthDate ?? null,
    groomBirthDate: values.groomBirthDate ?? null,
    brideProfession: values.brideProfession?.trim() || null,
    groomProfession: values.groomProfession?.trim() || null,
    brideDocument: values.brideDocument?.trim() || null,
    groomDocument: values.groomDocument?.trim() || null,
  };

  eventService
    .updateEventDetails(props.event.id, payload)
    .then(() => {
      toast.success('Os detalhes do evento foram actualizados com sucesso');
      emit('success');
    })
    .catch((err) => {
      console.log(err);
      serverErrors.value.message = getServerErrors(err.data);
      serverErrors.value.hasErrors = true;
    })
    .finally(() => {
      isSubmiting.value = false;
    });
});

watch(
  () => props.event,
  (current) => {
    resetForm({
      values: {
        location: current?.location ?? '',
        godparentsCount: current?.godparentsCount ?? null,
        decorationType: current?.decorationType ?? '',
        dietaryRestrictions: current?.dietaryRestrictions ?? '',
        guestProfile: current?.guestProfile ?? '',
        colorPalette: current?.colorPalette ?? '',
        event_End_Time: current?.event_End_Time?.slice(0, 5) ?? null,
        brideNationality: current?.brideNationality ?? '',
        groomNationality: current?.groomNationality ?? '',
        brideBirthDate: current?.brideBirthDate
          ? new Date(current.brideBirthDate)
          : null,
        groomBirthDate: current?.groomBirthDate
          ? new Date(current.groomBirthDate)
          : null,
        brideProfession: current?.brideProfession ?? '',
        groomProfession: current?.groomProfession ?? '',
        brideDocument: current?.brideDocument ?? '',
        groomDocument: current?.groomDocument ?? '',
      },
    });

    serverErrors.value = { hasErrors: false, message: '' };
  },
  { immediate: true },
);
</script>

<template>
  <BaseModal
    size="large"
    title="Detalhes do evento"
    :show="show"
    @close-modal="closeModal"
  >
    <form
      class="mb-5 w-full animate-fadeIn text-left"
      @submit.prevent="onSubmit"
    >
      <div class="mb-5">
        <div class="flex items-center gap-1">
          <IconInformation
            class="text-grey-500 size-[16px]"
            :font-controlled="false"
          />
          <h3 class="text-grey-500 text-sm font-semibold">Sobre o evento</h3>
        </div>
        <p class="text-grey-300 mt-1 text-xs">
          Informação útil para alinhamento interno, fornecedores e produção.
        </p>
      </div>

      <div class="grid gap-x-4 gap-y-6 md:grid-cols-2">
        <BaseInput
          id="eventLocation"
          v-model="location"
          v-bind="locationAttrs"
          :error-message="errors.location"
          :readonly="isSubmiting"
          label="Local:"
          name="location"
          type="text"
          placeholder="Ex.: Polana Serena Hotel"
          disable-margins
        />

        <BaseInput
          id="godparentsCount"
          v-model="godparentsCount"
          v-bind="godparentsCountAttrs"
          :error-message="errors.godparentsCount"
          :readonly="isSubmiting"
          label="Número de padrinhos"
          name="godparentsCount"
          type="number"
          min="0"
          placeholder="Ex.: 8"
          disable-margins
        />

        <BaseInput
          id="decorationType"
          v-model="decorationType"
          v-bind="decorationTypeAttrs"
          :error-message="errors.decorationType"
          :readonly="isSubmiting"
          label="Tipo de decoração:"
          name="decorationType"
          type="text"
          placeholder="Ex.: Clássica / Minimalista / Rústica"
          disable-margins
        />

        <div>
          <label class="mb-1 block text-sm font-medium"
            >Horário de término</label
          >

          <DatePicker
            v-model="event_End_Time"
            v-bind="eventEndTimeAttrs"
            locale="pt-PT"
            time-picker
            model-type="HH:mm"
            :is-24="true"
            :minutes-increment="1"
            :teleport="true"
            :disabled="isSubmiting"
            :clearable="true"
            placeholder="Selecione o horário"
            select-text="Selecionar"
            cancel-text="Cancelar"
          />

          <p
            v-if="errors.event_End_Time"
            class="text-danger-800 mt-1 animate-fadeIn text-sm"
          >
            {{ errors.event_End_Time }}
          </p>
        </div>
      </div>

      <BaseTextArea
        id="dietaryRestrictions"
        v-model="dietaryRestrictions"
        v-bind="dietaryRestrictionsAttrs"
        :error-message="errors.dietaryRestrictions"
        :readonly="isSubmiting"
        name="dietaryRestrictions"
        label="Restrições dietéticas:"
        placeholder="Ex.: menu vegetariano, alergia a marisco, sem glúten"
        rows="3"
      />
      <BaseTextArea
        id="guestProfile"
        v-model="guestProfile"
        v-bind="guestProfileAttrs"
        :error-message="errors.guestProfile"
        :readonly="isSubmiting"
        name="guestProfile"
        label="Perfil dos convidados:"
        placeholder="Ex.: maioritariamente família, colegas, público jovem"
        rows="4"
      />

      <BaseTextArea
        id="colorPalette"
        v-model="colorPalette"
        v-bind="colorPaletteAttrs"
        :error-message="errors.colorPalette"
        :readonly="isSubmiting"
        name="colorPalette"
        label="Paleta de cores:"
        placeholder="Ex.: bege, dourado e verde oliva"
        rows="4"
      />

      <div class="mb-5 mt-4 border-t border-gray-100 pt-6">
        <div class="mb-6 flex items-center gap-1">
          <IconBudgetOutfit
            class="text-grey-500 size-[16px]"
            :font-controlled="false"
          />
          <h3 class="text-grey-500 text-sm font-semibold">Noiva</h3>
        </div>

        <div class="mb-4 grid gap-x-4 gap-y-6 md:grid-cols-2">
          <BaseInput
            id="brideNationality"
            v-model="brideNationality"
            v-bind="brideNationalityAttrs"
            :error-message="errors.brideNationality"
            :readonly="isSubmiting"
            label="Nacionalidade:"
            name="brideNationality"
            type="text"
            placeholder="Ex.: Moçambicana"
            disable-margins
          />

          <BaseInput
            id="brideProfession"
            v-model="brideProfession"
            v-bind="brideProfessionAttrs"
            :error-message="errors.brideProfession"
            :readonly="isSubmiting"
            label="Profissão:"
            name="brideProfession"
            type="text"
            placeholder="Ex.: Médica"
            disable-margins
          />

          <div>
            <label class="mb-1 block text-sm font-medium">
              Data de nascimento
            </label>
            <DatePicker
              v-model="brideBirthDate"
              v-bind="brideBirthDateAttrs"
              locale="pt-PT"
              :enable-time-picker="false"
              :clearable="true"
              :teleport="true"
              :max-date="maxBirthDate"
              :format="'dd/MM/yyyy'"
              :auto-apply="true"
              :disabled="isSubmiting"
              placeholder="Selecione a data:"
              select-text="Selecionar"
              cancel-text="Cancelar"
            />
            <p
              v-if="errors.brideBirthDate"
              class="text-danger-800 mt-1 animate-fadeIn text-sm"
            >
              {{ errors.brideBirthDate }}
            </p>
          </div>

          <BaseInput
            id="brideDocument"
            v-model="brideDocument"
            v-bind="brideDocumentAttrs"
            :error-message="errors.brideDocument"
            :readonly="isSubmiting"
            label="Documento"
            name="brideDocument"
            type="text"
            placeholder="Ex.: BI / Passaporte"
            disable-margins
          />
        </div>
      </div>

      <div class="mb-4 mt-4 border-t border-gray-100 pt-6">
        <div class="mb-6 flex items-center gap-1">
          <IconSuit
            class="text-grey-500 size-[16px]"
            :font-controlled="false"
          />
          <h3 class="text-grey-500 text-sm font-semibold">Noivo</h3>
        </div>

        <div class="mb-4 grid gap-x-4 gap-y-6 md:grid-cols-2">
          <BaseInput
            id="groomNationality"
            v-model="groomNationality"
            v-bind="groomNationalityAttrs"
            :error-message="errors.groomNationality"
            :readonly="isSubmiting"
            label="Nacionalidade"
            name="groomNationality"
            type="text"
            placeholder="Ex.: Moçambicano"
            disable-margins
          />

          <BaseInput
            id="groomProfession"
            v-model="groomProfession"
            v-bind="groomProfessionAttrs"
            :error-message="errors.groomProfession"
            :readonly="isSubmiting"
            label="Profissão"
            name="groomProfession"
            type="text"
            placeholder="Ex.: Engenheiro"
            disable-margins
          />

          <div>
            <label class="mb-1 block text-sm font-medium">
              Data de nascimento
            </label>
            <DatePicker
              v-model="groomBirthDate"
              v-bind="groomBirthDateAttrs"
              locale="pt-PT"
              :enable-time-picker="false"
              :clearable="true"
              :teleport="true"
              :max-date="maxBirthDate"
              :format="'dd/MM/yyyy'"
              :auto-apply="true"
              :disabled="isSubmiting"
              placeholder="Selecione a data"
              select-text="Selecionar"
              cancel-text="Cancelar"
            />
            <p
              v-if="errors.groomBirthDate"
              class="text-danger-800 mt-1 animate-fadeIn text-sm"
            >
              {{ errors.groomBirthDate }}
            </p>
          </div>

          <BaseInput
            id="groomDocument"
            v-model="groomDocument"
            v-bind="groomDocumentAttrs"
            :error-message="errors.groomDocument"
            :readonly="isSubmiting"
            label="Documento"
            name="groomDocument"
            type="text"
            placeholder="Ex.: BI / Passaporte"
            disable-margins
          />
        </div>
      </div>

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
          Guardar detalhes
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
