<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/yup';
import { useForm } from 'vee-validate';
import { number, object, string } from 'yup';
import { useToast } from 'vue-toastification';
import { getChecklistService } from '~/services/checklistService';

interface ChecklistFormProps {
  section: ChecklistSection | null;
  eventId: number;
  show?: boolean;
}

const props = withDefaults(defineProps<ChecklistFormProps>(), {
  show: false,
});

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
      .max(500, () => t('checklist.section_description_max'))
      .optional(),
    order: number()
      .typeError(() => t('checklist.section_order_type'))
      .integer(() => t('checklist.section_order_invalid'))
      .min(0, () => t('checklist.section_order_negative'))
      .required(() => t('checklist.section_order_required')),
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
} = useForm<ChecklistSectionInput>({
  validationSchema: schema,
  initialValues: {
    title: props.section?.title ?? '',
    description: props.section?.description ?? '',
    eventId: props.eventId,
    order: props.section?.order ?? 0,
  },
});

// fields + attrs
const [title, titleAttrs] = defineField('title');
const [description, descriptionAttrs] = defineField('description');

// sincronizar quando alternas entre criar/editar
watch(
  () => props.section,
  (s) => {
    setValues({
      title: s?.title ?? '',
      description: s?.description ?? '',
      eventId: props.eventId,
      order: s?.order ?? 0,
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

const onSubmit = handleSubmit(async (values) => {
  const payload: ChecklistSectionInput = {
    title: values.title,
    description: values.description ?? '',
    eventId: props.eventId,
    order: values.order ?? 0,
  };

  try {
    if (props.section) {
      await checklistService.updateSection(props.section.id, payload);
      toast.success(t('checklist.section_updated'));
    } else {
      await checklistService.createSection(payload);
      toast.success(t('checklist.section_created'));
    }
    emit('saved');
    resetForm();
  } catch (e) {
    console.log(e);
    serverErrors.value.message = getServerErrors(e as ServerError);
    serverErrors.value.hasErrors = true;
  }
});
</script>

<template>
  <BaseModal
    :show="show"
    :title="
      section
        ? t('checklist.section_edit_title')
        : t('checklist.section_create_title')
    "
    @close-modal="$emit('close')"
  >
    <form @submit.prevent="onSubmit">
      <BaseInput
        id="sectionTitleInput"
        v-model="title"
        v-bind="titleAttrs"
        :error-message="errors.title"
        :readonly="isSubmitting"
        :label="t('checklist.section_form_title_label')"
        :placeholder="t('checklist.section_title_placeholder')"
      />

      <BaseInput
        id="sectionDescriptionInput"
        v-model="description"
        v-bind="descriptionAttrs"
        :error-message="errors.description"
        :readonly="isSubmitting"
        :label="t('checklist.section_form_description_label')"
        :placeholder="t('checklist.section_description_placeholder')"
      />

      <div class="flex w-full justify-center gap-3">
        <BaseButton
          type="button"
          btn-type="outline-primary"
          :disabled="isSubmitting"
          @click="$emit('close')"
          >{{ t('common.cancel') }}</BaseButton
        >
        <BaseButton
          type="submit"
          :disabled="isSubmitting"
          :loading="isSubmitting"
        >
          {{
            section
              ? t('checklist.section_submit_edit')
              : t('checklist.section_submit_create')
          }}</BaseButton
        >
      </div>
    </form>
  </BaseModal>
</template>
