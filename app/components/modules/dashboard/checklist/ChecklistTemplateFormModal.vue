<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/yup';
import { useForm } from 'vee-validate';
import { boolean, object, string } from 'yup';
import { useToast } from 'vue-toastification';
import { getChecklistService } from '~/services/checklistService';

const props = withDefaults(
  defineProps<{
    show?: boolean;
    template?: ChecklistTemplateDetail | null;
  }>(),
  {
    show: false,
    template: null,
  },
);

const emit = defineEmits<{ (e: 'close' | 'saved'): void }>();

const nuxtApp = useNuxtApp();
const checklistService = getChecklistService(nuxtApp.$api);
const toast = useToast();
const { t, locale } = useI18n();

const schema = toTypedSchema(
  object({
    name: string()
      .trim()
      .min(2, () => t('checklist.template_name_min'))
      .max(200, () => t('checklist.template_name_max'))
      .required(() => t('checklist.template_name_required')),
    description: string()
      .max(2000, () => t('checklist.section_description_max'))
      .optional(),
    isActive: boolean().default(true),
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
} = useForm<ChecklistTemplateUpdateInput>({
  validationSchema: schema,
  initialValues: {
    name: props.template?.name ?? '',
    description: props.template?.description ?? '',
    isActive: props.template?.isActive ?? true,
  },
});

const [name, nameAttrs] = defineField('name');
const [description, descriptionAttrs] = defineField('description');
const [isActive, isActiveAttrs] = defineField('isActive');

watch(
  () => props.template,
  (t) => {
    setValues({
      name: t?.name ?? '',
      description: t?.description ?? '',
      isActive: t?.isActive ?? true,
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
  if (!props.template?.id) return;

  try {
    const payload: ChecklistTemplateUpdateInput = {
      name: values.name,
      description: values.description ?? '',
      isActive: values.isActive ?? true,
    };

    await checklistService.updateTemplate(props.template.id, payload);
    toast.success(t('checklist.template_updated'));
    emit('saved');
    close();
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
    :title="t('checklist.template_edit_title')"
    @close-modal="close"
  >
    <form class="space-y-4" @submit.prevent="submit">
      <BaseInput
        id="template-name"
        v-model="name"
        v-bind="nameAttrs"
        :error-message="errors.name"
        :readonly="isSubmitting"
        :label="t('checklist.template_name_label')"
        :placeholder="t('checklist.template_name_placeholder')"
        required
      />

      <BaseTextArea
        id="template-description"
        v-model="description"
        v-bind="descriptionAttrs"
        :error-message="errors.description"
        :readonly="isSubmitting"
        :label="t('checklist.section_description_label')"
        :placeholder="t('checklist.template_description_placeholder')"
        rows="4"
      />

      <BaseCheckbox
        id="template-active"
        v-model="isActive"
        v-bind="isActiveAttrs"
        :error="errors.isActive"
        :readonly="isSubmitting"
        :label="t('checklist.template_active')"
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
        >
          {{ t('common.save') }}
        </BaseButton>
      </div>
    </form>
  </BaseModal>
</template>
