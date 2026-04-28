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

const emit = defineEmits(['closeModal', 'success']);
const { eventId } = useEventStore();

const nuxtApp = useNuxtApp();
const guestService = getGuestService(nuxtApp.$api);

const { desks, isRefreshing: isRefreshingDesks } = await useDeskOptions();
const { categories, isRefreshing: isRefreshingCategories } =
  await useGuestCategories();

const toast = useToast();
const { t } = useI18n();
const isSubmiting = ref<boolean>(false);
const serverErrors = ref<ServerError>({
  hasErrors: false,
  message: '',
});

const { errors, handleSubmit, defineField, resetForm } = useForm({
  validationSchema: toTypedSchema(
    object({
      name: string()
        .matches(/[A-Za-zÀ-ÖØ-öø-ÿ\s'-]+/, t('guests.form_name_invalid'))
        .required(t('guests.form_name_required')),

      desk: number()
        .transform((value, originalValue) =>
          String(originalValue).trim() === '' ? undefined : value,
        )
        .typeError(t('guests.form_desk_required'))
        .positive(t('guests.form_desk_positive'))
        .integer(t('guests.form_desk_integer')),

      phone: string().required(t('guests.form_phone_required')),

      people: number()
        .transform((value, originalValue) =>
          String(originalValue).trim() === '' ? undefined : value,
        )
        .typeError(t('guests.form_people_type'))
        .positive(t('guests.form_people_positive'))
        .integer(t('guests.form_people_integer'))
        .required(t('guests.form_people_required')),

      category: number()
        .transform((value, originalValue) =>
          String(originalValue).trim() === '' ? undefined : value,
        )
        .typeError(t('guests.form_category_type'))
        .required(t('guests.form_category_required')),
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
    eventId: Number(eventId!),
    people_Count: values.people,
    deskId: values.desk ?? undefined,
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
        toast.success(t('guests.added_success'));
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

        toast.success(t('guests.updated_success'));
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
    :title="
      guest ? t('guests.form_update_title') : t('guests.form_create_title')
    "
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
        :label="t('guests.form_name_label')"
        :placeholder="t('guests.form_name_placeholder')"
      />

      <BaseInput
        id="guestPhone"
        v-model="phone"
        v-bind="phoneAttrs"
        :error-message="errors.phone"
        :readonly="isSubmiting"
        type="text"
        name="phone"
        :label="t('guests.form_phone_label')"
        :placeholder="t('guests.form_phone_placeholder')"
      />

      <BaseInput
        id="guestPeopleCount"
        v-model="people"
        v-bind="peopleAttrs"
        :error-message="errors.people"
        :readonly="isSubmiting"
        type="number"
        name="name"
        :label="t('guests.form_people_label')"
        :placeholder="t('guests.form_people_placeholder')"
      />

      <BaseSelect
        v-if="desks"
        id="deskInput"
        v-model="desk"
        v-bind="deskAttrs"
        :error-message="errors.desk"
        :readonly="isSubmiting"
        :label="t('guests.form_desk_label')"
        :options="
          desks.map((desk) => ({
            id: desk.id,
            name: desk.name,
            value: desk.id,
          }))
        "
        :disabled="props.guest?.absence_Declared"
        :helper-text="
          props.guest?.absence_Declared ? t('guests.form_desk_no_assign') : ''
        "
      />

      <BaseSelect
        v-if="categories"
        id="categoryInput"
        v-model="category"
        v-bind="categoryAttrs"
        :error-message="errors.category"
        :readonly="isSubmiting"
        :label="t('guests.form_category_label')"
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
            props.guest ? t('guests.submit_update') : t('guests.submit_add')
          }}</BaseButton
        >

        <BaseButton
          type="button"
          btn-type="outline-primary"
          class="my-3"
          size="md"
          :disabled="isSubmiting"
          @click="$emit('closeModal')"
          >{{ t('common.cancel') }}</BaseButton
        >
      </div>
    </form>
  </BaseModal>
</template>
