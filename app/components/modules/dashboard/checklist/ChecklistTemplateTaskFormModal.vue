<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/yup';
import { useForm } from 'vee-validate';
import { boolean, number, object, string } from 'yup';
import { useToast } from 'vue-toastification';
import { getChecklistService } from '~/services/checklistService';

const props = defineProps<{
  show?: boolean;
  task: ChecklistTemplateTask | undefined;
  sectionId: number;
}>();

const emit = defineEmits<{ (e: 'close' | 'saved'): void }>();

const nuxtApp = useNuxtApp();
const checklistService = getChecklistService(nuxtApp.$api);

const toast = useToast();
const serverErrors = ref<ServerError>({
  hasErrors: false,
  message: '',
});

const schema = toTypedSchema(
  object({
    title: string()
      .trim()
      .min(2, 'O título deve ter pelo menos 2 caracteres')
      .max(200, 'O título é demasiado longo')
      .required('O título é obrigatório'),
    notes: string().max(2000, 'As notas são demasiado longas').optional(),
    has_Indefinite_Date: boolean().default(false),
    default_Offset_Days: number()
      .nullable()
      .when('has_Indefinite_Date', {
        is: false,
        then: (s) =>
          s
            .typeError('O offset deve ser um número')
            .integer('O offset deve ser um número inteiro')
            .min(0, 'O offset não pode ser negativo')
            .required('O offset é obrigatório (ou marque “Data indefinida”)'),
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
} = useForm<ChecklistTemplateTaskInput>({
  validationSchema: schema,
  initialValues: {
    title: props.task?.title ?? '',
    notes: props.task?.notes ?? '',
    has_Indefinite_Date: props.task?.has_Indefinite_Date ?? false,
    default_Offset_Days: props.task?.default_Offset_Days ?? null,
  },
});

const [title, titleAttrs] = defineField('title');
const [notes, notesAttrs] = defineField('notes');
const [has_Indefinite_Date, hasIndefiniteDateAttrs] = defineField(
  'has_Indefinite_Date',
);
const [default_Offset_Days, offsetAttrs] = defineField('default_Offset_Days');

watch(
  () => props.task,
  (t) => {
    setValues({
      title: t?.title ?? '',
      notes: t?.notes ?? '',
      has_Indefinite_Date: t?.has_Indefinite_Date ?? false,
      default_Offset_Days: t?.default_Offset_Days ?? null,
    });
  },
  { immediate: true },
);

const submit = handleSubmit(async (values) => {
  try {
    const payload = {
      title: values.title,
      notes: values.notes ?? '',
      has_Indefinite_Date: values.has_Indefinite_Date ?? false,
      default_Offset_Days: values.has_Indefinite_Date
        ? null
        : (values.default_Offset_Days ?? null),
    };

    if (props.task?.id) {
      await checklistService.updateTemplateTask(props.task.id, payload);
      toast.success('Tarefa actualizada com sucesso');
    } else {
      await checklistService.addTemplateTask(props.sectionId, payload);
      toast.success('Tarefa criada com sucesso');
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
    :title="task ? 'Editar tarefa' : 'Nova tarefa'"
    icon="CheckSquare"
    @close-modal="close"
  >
    <form class="space-y-4" @submit.prevent="submit">
      <BaseInput
        :id="`template-task-form-${sectionId}-title`"
        v-model="title"
        v-bind="titleAttrs"
        :error-message="errors.title"
        :readonly="isSubmitting"
        autocomplete="off"
        type="text"
        name="title"
        label="Título"
        placeholder="Ex.: Confirmar catering"
        required
      />

      <BaseTextArea
        :id="`template-task-form-${sectionId}-notes`"
        v-model="notes"
        v-bind="notesAttrs"
        :error-message="errors.notes"
        :readonly="isSubmitting"
        name="notes"
        label="Notas (opcional)"
        placeholder="Notas adicionais…"
        rows="4"
      />

      <BaseCheckbox
        :id="`template-task-form-${sectionId}-indef`"
        v-model="has_Indefinite_Date"
        v-bind="hasIndefiniteDateAttrs"
        :error="errors.has_Indefinite_Date"
        :readonly="isSubmitting"
        label="Data indefinida"
      />

      <BaseInput
        :id="`template-task-form-${sectionId}-offset`"
        v-model.number="default_Offset_Days"
        v-bind="offsetAttrs"
        :error-message="errors.default_Offset_Days"
        :readonly="isSubmitting || has_Indefinite_Date"
        type="number"
        name="default_Offset_Days"
        label="Dias antes do evento (dias)"
        placeholder="Ex.: 14"
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

        <BaseButton type="submit" :disabled="isSubmitting">
          Guardar
        </BaseButton>
      </div>
    </form>
  </BaseModal>
</template>
