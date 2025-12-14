<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/yup';
import { useForm } from 'vee-validate';
import { number, object, string } from 'yup';
import { useToast } from 'vue-toastification';
import { getChecklistService } from '~/services/checklistService';

const props = withDefaults(
  defineProps<{
    show?: boolean;
    section?: ChecklistTemplateSection | null;
    templateId: number;
  }>(),
  {
    show: false,
    section: null,
  },
);

const emit = defineEmits<{ (e: 'close' | 'saved'): void }>();

const nuxtApp = useNuxtApp();
const checklistService = getChecklistService(nuxtApp.$api);
const toast = useToast();

const schema = toTypedSchema(
  object({
    title: string()
      .trim()
      .min(2, 'O título deve ter pelo menos 2 caracteres')
      .max(150, 'O título é demasiado longo')
      .required('O título é obrigatório'),
    description: string().max(2000, 'As notas são demasiado longas').optional(),
    default_Offset_Days: number()
      .nullable()
      .typeError('O offset deve ser um número')
      .integer('O offset deve ser um número inteiro')
      .min(0, 'O offset não pode ser negativo')
      .optional(),
  }),
);

const {
  handleSubmit,
  defineField,
  errors,
  isSubmitting,
  setValues,
  resetForm,
} = useForm<ChecklistTemplateSectionInput>({
  validationSchema: schema,
  initialValues: {
    title: props.section?.title ?? '',
    description: props.section?.description ?? '',
    default_Offset_Days: props.section?.default_Offset_Days ?? null,
  },
});

const [title, titleAttrs] = defineField('title');
const [description, descriptionAttrs] = defineField('description');
const [default_Offset_Days, offsetAttrs] = defineField('default_Offset_Days');

watch(
  () => props.section,
  (s) => {
    setValues({
      title: s?.title ?? '',
      description: s?.description ?? '',
      default_Offset_Days: s?.default_Offset_Days ?? null,
    });
  },
  { immediate: true },
);

const serverErrors = ref<ServerError>({
  hasErrors: false,
  message: '',
});

const submit = handleSubmit(async (values) => {
  try {
    const payload = {
      title: values.title,
      description: values.description ?? '',
      default_Offset_Days: values.default_Offset_Days ?? null,
    };

    if (props.section?.id) {
      await checklistService.updateTemplateSection(props.section.id, payload);
      toast.success('Secção actualizada com sucesso');
    } else {
      await checklistService.addTemplateSection(props.templateId, payload);
      toast.success('Secção criada com sucesso');
    }

    close();
    emit('saved');
  } catch (e) {
    console.log(e);
    serverErrors.value.message = getServerErrors(e as ServerError);
    serverErrors.value.hasErrors = true;
  }
});

function close() {
  resetForm();
  emit('close');
}
</script>

<template>
  <BaseModal
    :show="show"
    :title="section ? 'Editar secção' : 'Nova secção'"
    @close-modal="close"
  >
    <form class="space-y-4" @submit.prevent="submit">
      <BaseInput
        id="template-section-title"
        v-model="title"
        v-bind="titleAttrs"
        :error-message="errors.title"
        :readonly="isSubmitting"
        label="Título"
        placeholder="Ex.: Preparação"
        required
      />

      <BaseTextArea
        id="template-section-description"
        v-model="description"
        v-bind="descriptionAttrs"
        :error-message="errors.description"
        :readonly="isSubmitting"
        label="Notas (opcional)"
        placeholder="Notas adicionais…"
        rows="4"
      />

      <BaseInput
        id="template-section-offset"
        v-model.number="default_Offset_Days"
        v-bind="offsetAttrs"
        :error-message="errors.default_Offset_Days"
        :readonly="isSubmitting"
        label="Dias antes do evento (dias)"
        placeholder="Ex.: 30"
        type="number"
        helper-text="Este valor define quantos dias antes do evento esta secção deve aparecer no cronograma."
      />

      <BaseError v-if="serverErrors.hasErrors">{{
        serverErrors.message
      }}</BaseError>

      <div class="flex w-full justify-center gap-3">
        <BaseButton
          type="button"
          btn-type="outline-primary"
          :disabled="isSubmitting"
          @click.prevent="close"
        >
          Cancelar
        </BaseButton>

        <BaseButton
          type="submit"
          :disabled="isSubmitting"
          :loading="isSubmitting"
          @click.prevent="submit"
        >
          {{ section ? 'Modificar agora' : 'Criar secção' }}
        </BaseButton>
      </div>
    </form>
  </BaseModal>
</template>
