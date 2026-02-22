<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/yup';
import { useForm } from 'vee-validate';
import { useToast } from 'vue-toastification';
import { object, string } from 'yup';
import { getMenuService } from '~/services/menuService';

interface IMenuItemFormModal {
  show?: boolean;
  item?: MenuItem | undefined;
  menuId: number;
  menuCategoryId?: number | undefined;
  menuCategoryName?: string | undefined;
}

const emit = defineEmits(['closeModal', 'success']);

const props = withDefaults(defineProps<IMenuItemFormModal>(), {
  show: false,
  item: undefined,
  menuCategoryId: undefined,
  menuCategoryName: undefined,
});

const nuxtApp = useNuxtApp();
const menuService = getMenuService(nuxtApp.$api);
const toast = useToast();

const isSubmitting = ref(false);
const serverErrors = ref<ServerError>({
  hasErrors: false,
  message: '',
});

const { errors, handleSubmit, defineField, resetForm } = useForm({
  validationSchema: toTypedSchema(
    object({
      name: string().required('O nome do prato é obrigatório'),
    }),
  ),
});

const [name, nameAttrs] = defineField('name');

const onSubmit = handleSubmit((values) => {
  isSubmitting.value = true;
  serverErrors.value.hasErrors = false;

  if (props.menuCategoryId) {
    const input: MenuItemInput = {
      name: values.name,
      menuCategoryId: props.menuCategoryId,
    };

    const createMenuItemPromise = () =>
      menuService.addMenuItem(props.menuId, input).then(() => {
        toast.success('Prato adicionado com sucesso');
      });

    const updateMenuItemPromise = () =>
      menuService.updateMenuItem(Number(props.item?.id), input).then(() => {
        toast.success('Prato actualizado com sucesso');
      });

    const operation = props.item
      ? updateMenuItemPromise
      : createMenuItemPromise;

    operation()
      .then(() => {
        emit('success');
        emit('closeModal');
        resetForm({ values: { name: '' } });
      })
      .catch((err) => {
        console.error(err.data);
        serverErrors.value.message = getServerErrors(err.data);
        serverErrors.value.hasErrors = true;
      })
      .finally(() => {
        isSubmitting.value = false;
      });
  }
});

const closeModal = () => {
  resetForm();
  emit('closeModal');
};

watch(
  () => props.item,
  (item) => {
    resetForm({
      values: {
        name: item?.name ?? '',
      },
    });
    serverErrors.value = { hasErrors: false, message: '' };
  },
  { immediate: true },
);

watch(
  () => props.show,
  (show) => {
    if (show) {
      resetForm({
        values: {
          name: '',
        },
      });

      serverErrors.value = { hasErrors: false, message: '' };
    }
  },
  { immediate: true },
);
</script>

<template>
  <BaseModal
    :title="item ? 'Editar item' : `${menuCategoryName}: Adicionar item`"
    :show="show"
    @close-modal="closeModal"
  >
    <form class="mb-5 w-full px-4 text-left" @submit.prevent="onSubmit">
      <BaseInput
        id="itemName"
        v-model="name"
        v-bind="nameAttrs"
        :error-message="errors.name"
        :readonly="isSubmitting"
        type="text"
        name="name"
        label="Nome do item (prato/bebida):"
        placeholder="Ex: Frango assado"
      />

      <BaseError v-if="serverErrors.hasErrors">
        {{ serverErrors.message }}
      </BaseError>

      <div class="flex w-full justify-center gap-3">
        <BaseButton
          type="submit"
          btn-type="primary"
          class="my-3"
          size="md"
          :disabled="isSubmitting"
          :loading="isSubmitting"
        >
          {{ item ? 'Actualizar agora' : 'Adicionar agora' }}
        </BaseButton>

        <BaseButton
          type="button"
          btn-type="outline-primary"
          class="my-3"
          size="md"
          :disabled="isSubmitting"
          @click="closeModal"
        >
          Cancelar
        </BaseButton>
      </div>
    </form>
  </BaseModal>
</template>
