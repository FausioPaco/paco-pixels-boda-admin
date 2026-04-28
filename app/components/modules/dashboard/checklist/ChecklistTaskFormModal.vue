<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/yup';
import { useForm } from 'vee-validate';
import { boolean, date, object, string } from 'yup';
import { useToast } from 'vue-toastification';
import { getChecklistService } from '~/services/checklistService';

const props = defineProps<{
  show?: boolean;
  task: ChecklistTask | undefined;
  tasksCount?: number;
  sectionId: number;
}>();

const emit = defineEmits<{ (e: 'close' | 'saved'): void }>();
const nuxtApp = useNuxtApp();
const checklistService = getChecklistService(nuxtApp.$api);
const serverErrors = ref<ServerError>({
  hasErrors: false,
  message: '',
});

const { eventId } = useEventStore();
const EVENT_ID = eventId;
const toast = useToast();
const { t, locale } = useI18n();

const schema = toTypedSchema(
  object({
    title: string()
      .trim()
      .min(2, () => t('checklist.task_title_min'))
      .max(200, () => t('checklist.task_title_max'))
      .required(() => t('checklist.task_title_required')),
    notes: string()
      .max(2000, () => t('checklist.task_notes_max'))
      .optional(),
    has_Indefinite_Date: boolean().default(false),
    due_Date: date()
      .nullable()
      .when('has_Indefinite_Date', {
        is: false,
        then: (s) =>
          s.required(() => t('checklist.task_due_date_required')),
        otherwise: (s) => s.nullable(),
      }),
  }),
);

const {
  handleSubmit,
  defineField,
  errors,
  setValues,
  isSubmitting,
  resetForm,
  validate,
} = useForm<ChecklistTaskInput>({
  validationSchema: schema,
  initialValues: {
    title: props.task?.title ?? '',
    notes: props.task?.notes ?? '',
    due_Date: props.task?.due_Date ? new Date(props.task.due_Date) : null,
    has_Indefinite_Date: props.task?.has_Indefinite_Date ?? false,
    sectionId: props.sectionId,
    eventId: Number(EVENT_ID),
  },
});

// mirror DeskFormModal style: field + attrs pairs
const [title, titleAttrs] = defineField('title');
const [notes, notesAttrs] = defineField('notes');
const [due_Date, dueDateAttrs] = defineField('due_Date');
const [has_Indefinite_Date, hasIndefiniteDateAttrs] = defineField(
  'has_Indefinite_Date',
);

watch(
  () => props.task,
  (t) => {
    setValues({
      title: t?.title ?? '',
      notes: t?.notes ?? '',
      due_Date: t?.due_Date ? new Date(t.due_Date) : null,
      has_Indefinite_Date: t?.has_Indefinite_Date ?? false,
      sectionId: props.sectionId,
      eventId: Number(EVENT_ID),
    });
  },
  { immediate: true },
);

watch(locale, () => {
  if (props.show) validate();
});

const submit = handleSubmit(async (values) => {
  try {
    const currentCount = props.tasksCount || 0;
    const payload = { ...values, sectionId: props.sectionId };

    if (props.task?.id) {
      await checklistService.updateTask(props.task.id, payload);
      toast.success(t('checklist.task_updated'));
    } else {
      await checklistService.createTask(payload, currentCount);
      toast.success(t('checklist.task_created'));
    }
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
    :title="
      task ? t('checklist.task_edit_title') : t('checklist.task_create_title')
    "
    icon="CheckSquare"
    @close-modal="close"
  >
    <form class="space-y-4" @submit.prevent="submit">
      <!-- Título -->
      <BaseInput
        :id="`task-form-${sectionId}-title`"
        v-model="title"
        v-bind="titleAttrs"
        :error-message="errors.title"
        :readonly="isSubmitting"
        autocomplete="off"
        type="text"
        name="title"
        :label="t('checklist.task_title_label')"
        :placeholder="t('checklist.task_title_placeholder')"
        required
      />

      <!-- Notas -->
      <BaseTextArea
        :id="`task-form-${sectionId}-notes`"
        v-model="notes"
        v-bind="notesAttrs"
        :error-message="errors.notes"
        :readonly="isSubmitting"
        name="notes"
        :label="t('checklist.task_notes_label')"
        :placeholder="t('checklist.task_notes_placeholder')"
        rows="4"
      />

      <!-- Data limite -->
      <div>
        <label class="mb-1 block text-sm font-medium">{{
          t('checklist.task_due_date_label')
        }}</label>
        <DatePicker
          v-model="due_Date"
          v-bind="dueDateAttrs"
          :locale="String(locale).startsWith('pt') ? 'pt-PT' : 'en-US'"
          :enable-time-picker="false"
          :clearable="true"
          :disabled="has_Indefinite_Date"
          :teleport="true"
          :format="'dd/MM/yyyy'"
          :auto-apply="true"
          :placeholder="t('checklist.date_placeholder')"
          :select-text="t('checklist.date_select')"
          :cancel-text="t('checklist.date_cancel')"
        />
        <p
          v-if="errors.due_Date"
          class="text-danger-800 mt-1 animate-fadeIn text-sm"
        >
          {{ errors.due_Date }}
        </p>
      </div>

      <!-- <BaseInput
        :id="`task-form-${sectionId}-due-date`"
        v-model="due_Date"
        label="Data limite"
        v-bind="dueDateAttrs"
        :error-message="errors.due_Date"
        :readonly="isSubmitting || has_Indefinite_Date"
        type="date"
        class="flex-1"
      /> -->

      <BaseCheckbox
        :id="`task-form-${sectionId}-indef`"
        v-model="has_Indefinite_Date"
        v-bind="hasIndefiniteDateAttrs"
        :error="errors.has_Indefinite_Date"
        :readonly="isSubmitting"
        :label="t('checklist.task_no_date')"
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
          >{{ t('common.cancel') }}</BaseButton
        >
        <BaseButton type="submit" :disabled="isSubmitting">
          {{ t('common.save') }}
        </BaseButton>
      </div>
    </form>
  </BaseModal>
</template>
