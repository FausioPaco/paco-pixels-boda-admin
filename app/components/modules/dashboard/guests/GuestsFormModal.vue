<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/yup';
import { useForm } from 'vee-validate';
import { useToast } from 'vue-toastification';
import { number, object, string } from 'yup';
import { getGuestService } from '~/services/guestService';

interface IGuestForm {
  show?: boolean;
  guest?: Guest | null;
}
const props = withDefaults(defineProps<IGuestForm>(), {
  show: false,
  guest: null,
});

const { EVENT_ID } = useRuntimeConfig().public;
const emit = defineEmits(['closeModal', 'success']);

const nuxtApp = useNuxtApp();
const guestService = getGuestService(nuxtApp.$api);

const { desks, isRefreshing: isRefreshingDesks } = await useDeskOptions();
const { categories, isRefreshing: isRefreshingCategories } =
  await useGuestCategories();

const toast = useToast();
const isSubmiting = ref<boolean>(false);
const serverErrors = ref<ServerError>({
  hasErrors: false,
  message: '',
});

const { errors, handleSubmit, defineField, resetForm } = useForm({
  validationSchema: toTypedSchema(
    object({
      name: string()
        .matches(/[A-Za-zÀ-ÖØ-öø-ÿ\s'-]+/, 'Deve ser um nome válido')
        .required('O seu nome é obrigatório'),

      desk: number()
        .transform((value, originalValue) =>
          String(originalValue).trim() === '' ? undefined : value,
        )
        .typeError('Deves especificar a mesa')
        .positive('O número de mesa deve ser um número positivo')
        .integer('O número de mesa não pode conter vírgula')
        .required('Deve especificar a mesa'),

      phone: string().required('Deve colocar o contacto do convidado'),

      people: number()
        .transform((value, originalValue) =>
          String(originalValue).trim() === '' ? undefined : value,
        )
        .typeError('O número de pessoas deve ser um valor válido')
        .positive('O número de pessoas deve ser um número positivo')
        .integer('O número de pessoas não pode conter vírgula')
        .required('Deve especificar o número de pessoas para este convidado'),

      category: number()
        .transform((value, originalValue) =>
          String(originalValue).trim() === '' ? undefined : value,
        )
        .typeError('Deves especificar se vem da parte do noivo ou noiva')
        .required('Categoria obrigatória'),
    }),
  ),
});

const [desk, deskAttrs] = defineField('desk');
const [name, nameAttrs] = defineField('name');
const [phone, phoneAttrs] = defineField('phone');
const [people, peopleAttrs] = defineField('people');
const [category, categoryAttrs] = defineField('category');

const onSubmit = handleSubmit((values, _) => {
  isSubmiting.value = true;
  serverErrors.value.hasErrors = false;

  const guestInput: GuestInput = {
    eventId: Number(EVENT_ID),
    people_Count: values.people,
    deskId: values.desk,
    name: values.name,
    phone: values.phone,
    categoryId: values.category,
  };

  if (!props.guest) {
    guestService
      .createGuest(guestInput)
      .then(() => {
        emit('success');
        emit('closeModal');
        resetForm();
        toast.success('O convidado foi adicionado com sucesso');
      })
      .catch((err) => {
        console.log(err.data);
        serverErrors.value.message = getServerErrors(err.data);
        serverErrors.value.hasErrors = true;
      })
      .finally(() => {
        isSubmiting.value = false;
      });
  } else {
    guestService
      .updateGuest(props.guest!.id, guestInput)
      .then(() => {
        emit('success');
        emit('closeModal');
        resetForm();

        toast.success('O convidado foi actualizado com sucesso');
      })
      .catch((err) => {
        console.log(err);
        serverErrors.value.message = getServerErrors(err.data);
        serverErrors.value.hasErrors = true;
      })
      .finally(() => {
        isSubmiting.value = false;
      });
  }
});

const closeModal = () => {
  resetForm();
  emit('closeModal');
};

watch(
  () => props.guest,
  (guest) => {
    resetForm({
      values: {
        name: guest?.name ?? '',
        desk: guest?.deskId ?? undefined,
        phone: guest?.phone ?? '',
        people: guest?.people_Count ?? undefined,
        category: guest?.categoryId ?? undefined,
      },
    });

    serverErrors.value = { hasErrors: false, message: '' };
  },
  { immediate: true },
);
</script>
<template>
  <BaseModal
    :title="desk ? 'Actualizar Convidado' : 'Adicionar Convidado'"
    :show="show"
    @close-modal="closeModal"
  >
    <BaseLoading
      v-if="isRefreshingDesks || isRefreshingCategories"
      size="lg"
      orientation="vertical"
    />

    <form
      v-if="!isRefreshingDesks && !isRefreshingCategories"
      id="guestForm"
      class="mb-5 w-full animate-fadeIn px-4 text-left"
    >
      <BaseInput
        id="guestName"
        v-model="name"
        v-bind="nameAttrs"
        :error-message="errors.name"
        :readonly="isSubmiting"
        autocomplete="name"
        type="text"
        name="name"
        label="Nome:"
        placeholder="Coloque o nome do convidado"
      />

      <BaseInput
        id="guestPhone"
        v-model="phone"
        v-bind="phoneAttrs"
        :error-message="errors.phone"
        :readonly="isSubmiting"
        type="text"
        name="phone"
        label="Telefone:"
        placeholder="Coloque o contacto do convidado"
      />

      <BaseInput
        id="guestPeopleCount"
        v-model="people"
        v-bind="peopleAttrs"
        :error-message="errors.people"
        :readonly="isSubmiting"
        type="number"
        name="name"
        label="Nº de pessoas:"
        placeholder="Coloque o número de pessoas"
      />

      <BaseSelect
        v-if="desks"
        id="deskInput"
        v-model="desk"
        v-bind="deskAttrs"
        :error-message="errors.desk"
        :readonly="isSubmiting"
        label="Mesa: "
        :options="
          desks.map((desk) => ({
            id: desk.id,
            name: desk.name,
            value: desk.id,
          }))
        "
      />

      <BaseSelect
        v-if="categories"
        id="categoryInput"
        v-model="category"
        v-bind="categoryAttrs"
        :error-message="errors.category"
        :readonly="isSubmiting"
        label="Tipo de convidado: "
        :options="
          categories.map((category) => ({
            id: category.id,
            name: category.name,
            value: category.id,
          }))
        "
      />

      <BaseError v-if="serverErrors.hasErrors">{{
        serverErrors.message
      }}</BaseError>

      <div class="flex animate-fadeIn items-center space-x-3">
        <BaseButton
          type="submit"
          btn-type="primary"
          class="my-3"
          size="md"
          :disabled="isSubmiting"
          :loading="isSubmiting"
          @click="onSubmit"
          >{{
            props.guest ? 'Actualizar agora' : 'Adicionar agora'
          }}</BaseButton
        >

        <BaseButton
          type="button"
          btn-type="outline-primary"
          class="my-3"
          size="md"
          :disabled="isSubmiting"
          @click="$emit('closeModal')"
          >Cancelar</BaseButton
        >
      </div>
    </form>
  </BaseModal>
</template>
