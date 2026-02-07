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

const schema = toTypedSchema(
  object({
    widthCm: number()
      .typeError('A largura deve ser um número.')
      .required('A largura é obrigatória.')
      .min(200, 'A largura mínima é 200 cm.')
      .max(20000, 'A largura máxima é 20000 cm.'),
    heightCm: number()
      .typeError('O comprimento deve ser um número.')
      .required('O comprimento é obrigatório.')
      .min(200, 'O comprimento mínimo é 200 cm.')
      .max(20000, 'O comprimento máximo é 20000 cm.'),
  }),
);

const { handleSubmit, resetForm, defineField, errors } = useForm({
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

const onSubmit = handleSubmit((values) => {
  emit('submit', {
    widthCm: Number(values.widthCm),
    heightCm: Number(values.heightCm),
  });
});
</script>

<template>
  <BaseModal
    title="Sala customizada (cm)"
    :show="show"
    @close-modal="emit('closeModal')"
  >
    <div class="bg-grey-50 text-grey-600 rounded-lg border p-3 text-sm">
      <div class="flex items-center gap-1 font-semibold">
        <IconLightbulb class="h-5 w-5" />
        <p>Nota</p>
      </div>

      <p>
        Neste mapa, assumimos a escala
        <span class="font-semibold">1 unidade = 1 cm</span>. Ex.: 1600 x 900 =
        16m x 9m.
      </p>
    </div>

    <form class="my-2 animate-fadeIn space-y-4" @submit.prevent="onSubmit">
      <div class="grid gap-3 md:grid-cols-2">
        <BaseInput
          id="canvasWidthCm"
          v-model="widthCm"
          v-bind="widthCmAttrs"
          type="number"
          placeholder="Largura (cm)"
          label="Largura (cm)"
          :error-message="errors.widthCm"
        />

        <BaseInput
          id="canvasHeightCm"
          v-model="heightCm"
          v-bind="heightCmAttrs"
          type="number"
          placeholder="Comprimento (cm)"
          label="Comprimento (cm)"
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
          Cancelar
        </BaseButton>

        <BaseButton type="submit" :loading="isSubmitting">Aplicar </BaseButton>
      </div>
    </form>
  </BaseModal>
</template>
