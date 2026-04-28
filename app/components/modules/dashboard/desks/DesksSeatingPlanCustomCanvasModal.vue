<script setup lang="ts">
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/yup';
import { number, object } from 'yup';

type Props = {
  show?: boolean;
  initialWidthCm?: number;
  initialHeightCm?: number;
  isSubmitting?: boolean;
};

const props = withDefaults(defineProps<Props>(), {
  show: false,
  initialWidthCm: 1600,
  initialHeightCm: 900,
  isSubmitting: false,
});

const emit = defineEmits<{
  (e: 'closeModal'): void;
  (e: 'submit', payload: { widthCm: number; heightCm: number }): void;
}>();

const { t, locale } = useI18n();

const schema = toTypedSchema(
  object({
    widthCm: number()
      .typeError(() => t('desks.canvas_width_number'))
      .required(() => t('desks.canvas_width_required'))
      .min(200, () => t('desks.canvas_width_min'))
      .max(20000, () => t('desks.canvas_width_max')),
    heightCm: number()
      .typeError(() => t('desks.canvas_height_number'))
      .required(() => t('desks.canvas_height_required'))
      .min(200, () => t('desks.canvas_height_min'))
      .max(20000, () => t('desks.canvas_height_max')),
  }),
);

const { handleSubmit, resetForm, defineField, errors, validate } = useForm({
  validationSchema: schema,
  initialValues: {
    widthCm: props.initialWidthCm,
    heightCm: props.initialHeightCm,
  },
});

const [widthCm, widthCmAttrs] = defineField('widthCm');
const [heightCm, heightCmAttrs] = defineField('heightCm');

watch(
  () => props.show,
  (open) => {
    if (!open) return;

    resetForm({
      values: {
        widthCm: props.initialWidthCm,
        heightCm: props.initialHeightCm,
      },
    });
  },
);

watch(locale, () => {
  if (props.show) validate();
});

const onSubmit = handleSubmit((values) => {
  emit('submit', {
    widthCm: Number(values.widthCm),
    heightCm: Number(values.heightCm),
  });
});
</script>

<template>
  <BaseModal
    :title="t('desks.canvas_custom_title')"
    :show="show"
    @close-modal="emit('closeModal')"
  >
    <div class="bg-grey-50 text-grey-600 rounded-lg border p-3 text-sm">
      <div class="flex items-center gap-1 font-semibold">
        <IconLightbulb class="h-5 w-5" />
        <p>{{ t('desks.canvas_note_title') }}</p>
      </div>

      <p>
        {{ t('desks.canvas_note_prefix') }}
        <span class="font-semibold">{{ t('desks.canvas_note_scale') }}</span>.
        {{ t('desks.canvas_note_example') }}
      </p>
    </div>

    <form class="my-2 animate-fadeIn space-y-4" @submit.prevent="onSubmit">
      <div class="grid gap-3 md:grid-cols-2">
        <BaseInput
          id="canvasWidthCm"
          v-model="widthCm"
          v-bind="widthCmAttrs"
          type="number"
          :placeholder="t('desks.canvas_width_label')"
          :label="t('desks.canvas_width_label')"
          :error-message="errors.widthCm"
        />

        <BaseInput
          id="canvasHeightCm"
          v-model="heightCm"
          v-bind="heightCmAttrs"
          type="number"
          :placeholder="t('desks.canvas_height_label')"
          :label="t('desks.canvas_height_label')"
          :error-message="errors.heightCm"
        />
      </div>

      <div class="flex items-center justify-end gap-2">
        <BaseButton
          type="button"
          btn-type="outline-primary"
          :disabled="isSubmitting"
          @click="emit('closeModal')"
        >
          {{ t('common.cancel') }}
        </BaseButton>

        <BaseButton type="submit" :loading="isSubmitting">
          {{ t('desks.canvas_apply') }}
        </BaseButton>
      </div>
    </form>
  </BaseModal>
</template>
