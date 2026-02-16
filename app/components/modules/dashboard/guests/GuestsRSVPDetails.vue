<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/yup';
import { useForm } from 'vee-validate';
import { boolean, number, object, string } from 'yup';
import { getGuestService } from '~/services/guestService';

interface IConfirmationDetailsForm {
  guest: Guest | undefined;
}

const props = defineProps<IConfirmationDetailsForm>();
const emit = defineEmits(['previousStep', 'nextStep']);

const { defineField, setFieldValue, handleSubmit, errors } = useForm({
  validationSchema: toTypedSchema(
    object({
      peopleConfirmed: number()
        .required('Selecione quantas pessoas irão')
        .min(1, 'Deve ser no mínimo de 1 pessoa')
        .max(
          props.guest?.people_Count ?? 1,
          `O número de pessoas é de ${props.guest?.people_Count ?? 1} ${props.guest?.people_Count === 1 ? 'Pessoa' : 'Pessoas'}`,
        ),
      additional_Comments: string()
        .max(250, 'A nota não pode exceder 250 caracteres')
        .default(''),
      gift_Brought: boolean()
        .nullable()
        .transform((value, originalValue) => {
          // quando vem do BaseSelect sem selecção
          if (originalValue === '' || originalValue === undefined) return null;

          // quando o select devolve string
          if (originalValue === 'true') return true;
          if (originalValue === 'false') return false;

          // quando já vem boolean
          return value;
        })
        .default(null),
    }),
  ),
});

const [peopleConfirmed, peopleConfirmedAttrs] = defineField('peopleConfirmed');
const [note, noteAttrs] = defineField('additional_Comments');
const [giftBrought, giftBroughtAttrs] = defineField('gift_Brought');

const nuxtApp = useNuxtApp();
const guestService = getGuestService(nuxtApp.$api);

const isSubmiting = ref<boolean>(false);
const serverErrors = ref<ServerError>({
  hasErrors: false,
  message: '',
});

const onSubmit = handleSubmit((values) => {
  const payload: ConfirmPresenceInput = {
    peopleConfirmed: values.peopleConfirmed,
    additional_Comments: values.additional_Comments,
    gift_Brought: values.gift_Brought ?? null,
  };

  isSubmiting.value = true;

  guestService
    .confirmPresenceAdvanced(props.guest!.id, payload)
    .then(() => {
      emit('nextStep');
    })
    .catch((err) => {
      console.error(err);
      serverErrors.value.message = getServerErrors(err.data);
      serverErrors.value.hasErrors = true;
    })
    .finally(() => {
      isSubmiting.value = false;
    });
});

watch(
  () => props.guest,
  (g) => {
    if (!g) return;

    const safePeopleConfirmed =
      g.people_Confirmed && g.people_Confirmed >= 1 ? g.people_Confirmed : 1;

    setFieldValue('peopleConfirmed', safePeopleConfirmed);
    setFieldValue('additional_Comments', g.additional_Comments ?? '');
    setFieldValue('gift_Brought', g.gift_Brought ?? null);
  },
  { immediate: true },
);
</script>
<template>
  <div class="w-full px-1 text-left">
    <form @submit.prevent="onSubmit">
      <BaseSelect
        id="peopleConfirmed"
        v-model="peopleConfirmed"
        v-bind="peopleConfirmedAttrs"
        :error-message="errors.peopleConfirmed"
        label="Quantas pessoas irão ao evento?"
        :options="
          Array.from({ length: props.guest?.people_Count ?? 1 }, (_, i) => ({
            id: i + 1,
            name: `${i + 1} ${i + 1 === 1 ? 'pessoa' : 'pessoas'}`,
            value: i + 1,
          }))
        "
        :helper-text="`Este convite foi preparado para até ${props.guest?.people_Count ?? 1} ${props.guest?.people_Count === 1 ? 'pessoa' : 'pessoas'}.`"
      />

      <BaseSelect
        id="giftBrought"
        v-model="giftBrought"
        v-bind="giftBroughtAttrs"
        :error-message="errors.gift_Brought"
        label="Levou presente?"
        :options="[
          { id: '', name: 'Não registado', value: null },
          { id: 'true', name: 'Sim', value: true },
          { id: 'false', name: 'Não', value: false },
        ]"
        disable-empty
      />

      <BaseTextArea
        id="note"
        v-model="note"
        v-bind="noteAttrs"
        :error-message="errors.additional_Comments"
        label="Nota adicional (opcional):"
        placeholder="O convidado possui alguma observação ou pedido especial?"
        rows="6"
      />

      <div class="mt-6 flex justify-between gap-3">
        <BaseButton
          type="button"
          btn-type="outline-primary"
          size="md"
          @click="emit('previousStep')"
        >
          Voltar
        </BaseButton>

        <BaseButton
          type="submit"
          btn-type="primary"
          size="md"
          :loading="isSubmiting"
        >
          {{
            props.guest?.presence_Confirmed
              ? 'Actualizar confirmação'
              : 'Confirmar Presença'
          }}
        </BaseButton>
      </div>
    </form>
  </div>
</template>
