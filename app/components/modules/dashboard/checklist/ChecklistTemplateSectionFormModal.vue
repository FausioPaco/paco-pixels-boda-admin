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
const { t, locale } = useI18n();

const schema = toTypedSchema(
  object({
    title: string()
      .trim()
      .min(2, () => t('checklist.section_title_min'))
      .max(150, () => t('checklist.section_title_max'))
      .required(() => t('checklist.section_title_required')),
    description: string()
      .max(2000, () => t('checklist.task_notes_max'))
      .optional(),
    default_Offset_Days: number()
      .nullable()
      .typeError(() => t('checklist.task_offset_type'))
      .integer(() => t('checklist.task_offset_integer'))
      .min(0, () => t('checklist.task_offset_min'))
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
  validate,
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

watch(locale, () => {
  if (props.show) validate();
});

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
      toast.success(t('checklist.section_updated'));
    } else {
      await checklistService.addTemplateSection(props.templateId, payload);
      toast.success(t('checklist.section_created'));
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
    :title="
      section
        ? t('checklist.section_form_edit_title')
        : t('checklist.section_form_create_title')
    "
    @close-modal="close"
  >
    <form class="space-y-4" @submit.prevent="submit">
      <BaseInput
        id="template-section-title"
        v-model="title"
        v-bind="titleAttrs"
        :error-message="errors.title"
        :readonly="isSubmitting"
        :label="t('checklist.section_title_label')"
        :placeholder="t('checklist.section_title_placeholder')"
        required
      />

      <BaseTextArea
        id="template-section-description"
        v-model="description"
        v-bind="descriptionAttrs"
        :error-message="errors.description"
        :readonly="isSubmitting"
        :label="t('checklist.task_notes_label')"
        :placeholder="t('checklist.task_notes_placeholder')"
        rows="4"
      />

      <BaseInput
        id="template-section-offset"
        v-model.number="default_Offset_Days"
        v-bind="offsetAttrs"
        :error-message="errors.default_Offset_Days"
        :readonly="isSubmitting"
        :label="t('checklist.task_offset_label')"
        :placeholder="t('checklist.task_offset_placeholder')"
        type="number"
        :helper-text="t('checklist.task_offset_helper')"
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
          {{ t('common.cancel') }}
        </BaseButton>

        <BaseButton
          type="submit"
          :disabled="isSubmitting"
          :loading="isSubmitting"
          @click.prevent="submit"
        >
          {{ section ? t('checklist.section_update') : t('checklist.section_save') }}
        </BaseButton>
      </div>
    </form>
  </BaseModal>
</template>
