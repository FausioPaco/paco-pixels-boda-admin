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
const { t } = useI18n();

const { defineField, setFieldValue, handleSubmit, errors } = useForm({
  validationSchema: toTypedSchema(
    object({
      peopleConfirmed: number()
        .required(t('guests.rsvp_people_required'))
        .min(1, t('guests.rsvp_people_min'))
        .max(
          props.guest?.people_Count ?? 1,
          t('guests.rsvp_people_max', {
            count: props.guest?.people_Count ?? 1,
            label:
              props.guest?.people_Count === 1
                ? t('guests.rsvp_people_one')
                : t('guests.rsvp_people_other', {
                    n: props.guest?.people_Count ?? 1,
                  }),
          }),
        ),
      additional_Comments: string()
        .max(250, t('guests.rsvp_note_max'))
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
        :label="t('guests.rsvp_people_question')"
        :options="
          Array.from({ length: props.guest?.people_Count ?? 1 }, (_, i) => ({
            id: i + 1,
            name:
              i + 1 === 1
                ? t('guests.rsvp_people_one')
                : t('guests.rsvp_people_other', { n: i + 1 }),
            value: i + 1,
          }))
        "
        :helper-text="
          t('guests.rsvp_people_helper', {
            count: props.guest?.people_Count ?? 1,
            label:
              (props.guest?.people_Count ?? 1) === 1
                ? t('guests.rsvp_people_one')
                : t('guests.rsvp_people_other', {
                    n: props.guest?.people_Count ?? 1,
                  }),
          })
        "
      />

      <BaseSelect
        id="giftBrought"
        v-model="giftBrought"
        v-bind="giftBroughtAttrs"
        :error-message="errors.gift_Brought"
        :label="t('guests.rsvp_gift_question')"
        :options="[
          { id: '', name: t('guests.rsvp_gift_not_registered'), value: null },
          { id: 'true', name: t('guests.rsvp_gift_yes'), value: true },
          { id: 'false', name: t('guests.rsvp_gift_no'), value: false },
        ]"
        disable-empty
      />

      <BaseTextArea
        id="note"
        v-model="note"
        v-bind="noteAttrs"
        :error-message="errors.additional_Comments"
        :label="t('guests.rsvp_note_label')"
        :placeholder="t('guests.rsvp_note_placeholder')"
        rows="6"
      />

      <div class="mt-6 flex justify-between gap-3">
        <BaseButton
          type="button"
          btn-type="outline-primary"
          size="md"
          @click="emit('previousStep')"
        >
          {{ t('guests.rsvp_back') }}
        </BaseButton>

        <BaseButton
          type="submit"
          btn-type="primary"
          size="md"
          :loading="isSubmiting"
        >
          {{
            props.guest?.presence_Confirmed
              ? t('guests.rsvp_update')
              : t('guests.rsvp_confirm_btn')
          }}
        </BaseButton>
      </div>
    </form>
  </div>
</template>
