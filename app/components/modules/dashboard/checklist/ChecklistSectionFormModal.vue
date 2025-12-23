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

const schema = toTypedSchema(
  object({
    title: string()
      .trim()
      .min(2, 'O título deve ter pelo menos 2 caracteres')
      .max(150, 'O título é demasiado longo')
      .required('O título é obrigatório'),
    description: string().max(500, 'A descrição é demasiado longa').optional(),
    order: number()
      .typeError('A ordem deve ser um número')
      .integer('A ordem deve ser um número inteiro')
      .min(0, 'A ordem não pode ser negativa')
      .required('A ordem é obrigatória'),
  }),
);

const {
  handleSubmit,
  defineField,
  errors,
  isSubmitting,
  setValues,
  resetForm,
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
      toast.success('Secção actualizada com sucesso');
    } else {
      await checklistService.createSection(payload);
      toast.success('Secção criada com sucesso');
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
    :title="section ? 'Editar secção' : 'Nova secção'"
    @close-modal="$emit('close')"
  >
    <form @submit.prevent="onSubmit">
      <BaseInput
        id="sectionTitleInput"
        v-model="title"
        v-bind="titleAttrs"
        :error-message="errors.title"
        :readonly="isSubmitting"
        label="Título"
        placeholder="Ex.: Fase 1 - Preparação"
      />

      <BaseInput
        id="sectionDescriptionInput"
        v-model="description"
        v-bind="descriptionAttrs"
        :error-message="errors.description"
        :readonly="isSubmitting"
        label="Descrição"
        placeholder="Opcional"
      />

      <div class="flex w-full justify-center gap-3">
        <BaseButton
          type="button"
          btn-type="outline-primary"
          :disabled="isSubmitting"
          @click="$emit('close')"
          >Cancelar</BaseButton
        >
        <BaseButton
          type="submit"
          :disabled="isSubmitting"
          :loading="isSubmitting"
        >
          {{ section ? 'Modificar agora' : 'Criar secção' }}</BaseButton
        >
      </div>
    </form>
  </BaseModal>
</template>
