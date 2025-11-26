<!-- components/UserProfileManagement.vue -->
<script setup lang="ts">
import { useToast } from 'vue-toastification';
import { getUserService } from '~/services/userService';

interface Props {
  user: User;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'updated', user: User): void;
}>();

const nuxtApp = useNuxtApp();
const userService = getUserService(nuxtApp.$api);

const isUploading = ref(false);
const isRemoving = ref(false);
const localUser = ref<User>({ ...props.user });
const toast = useToast();

const fileInputRef = ref<HTMLInputElement | null>(null);

watch(
  () => props.user,
  (newUser) => {
    if (newUser) {
      localUser.value = { ...newUser };
    }
  },
  { deep: true },
);

const avatarInitials = computed(() => {
  if (!localUser.value.name) return '?';
  const parts = localUser.value.name.trim().split(' ');
  if (parts.length === 1) return parts[0]!.charAt(0).toUpperCase();
  return (
    parts[0]!.charAt(0).toUpperCase() +
    parts[parts.length - 1]!.charAt(0).toUpperCase()
  );
});

const hasProfileImage = computed(
  () =>
    !!localUser.value.profileImageUrl && localUser.value.profileImageUrl !== '',
);

const lastLoginText = computed(() => {
  if (!localUser.value.lastLoginAt) return '—';

  const date =
    typeof localUser.value.lastLoginAt === 'string'
      ? new Date(localUser.value.lastLoginAt)
      : localUser.value.lastLoginAt;

  return date.toLocaleString('pt-PT');
});

const openFileDialog = () => {
  if (fileInputRef.value) {
    fileInputRef.value.click();
  }
};

const handleFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (!file) return;

  try {
    isUploading.value = true;

    const result = await userService.uploadProfilePhoto(
      localUser.value.id,
      file,
    );

    localUser.value = result.user;

    emit('updated', result.user);
  } catch (error) {
    console.error('Erro ao carregar foto de perfil', error);
    toast.error('Não foi possível carregar a foto de perfil. Contacte suporte');
  } finally {
    isUploading.value = false;
    if (fileInputRef.value) {
      fileInputRef.value.value = '';
    }
  }
};

const handleRemovePhoto = async () => {
  if (!hasProfileImage.value) return;

  try {
    isRemoving.value = true;
    await userService.removeProfilePhoto(localUser.value.id);

    localUser.value = {
      ...localUser.value,
      profileImageUrl: null,
    };

    emit('updated', localUser.value);
  } catch (error) {
    console.error('Erro ao remover foto de perfil', error);
  } finally {
    isRemoving.value = false;
  }
};
</script>

<template>
  <BaseCard
    title="O meu perfil"
    description="Revê os teus dados e actualiza a tua foto de perfil."
  >
    <div
      class="grid items-start gap-8 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]"
    >
      <!-- Coluna esquerda: dados gerais -->
      <div class="space-y-4">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Dados gerais
        </h2>

        <dl
          class="divide-y divide-gray-100 rounded-lg border border-gray-100 bg-white"
        >
          <div class="flex items-center justify-between px-4 py-3">
            <dt class="text-sm text-gray-500">Nome</dt>
            <dd class="text-sm font-medium text-gray-900">
              {{ localUser.name }}
            </dd>
          </div>

          <div class="flex items-center justify-between px-4 py-3">
            <dt class="text-sm text-gray-500">Email</dt>
            <dd class="text-sm font-medium text-gray-900">
              {{ localUser.email }}
            </dd>
          </div>

          <div class="flex items-center justify-between px-4 py-3">
            <dt class="text-sm text-gray-500">Perfil</dt>
            <dd class="text-sm font-medium text-gray-900">
              {{ localUser.roleName }}
            </dd>
          </div>

          <div class="flex items-center justify-between px-4 py-3">
            <dt class="text-sm text-gray-500">Último acesso</dt>
            <dd class="text-sm font-medium text-gray-900">
              {{ lastLoginText }}
            </dd>
          </div>
        </dl>
      </div>

      <!-- Coluna direita: foto de perfil -->
      <div class="space-y-4">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Foto de perfil
        </h2>

        <div class="flex flex-col items-center gap-4">
          <div class="relative">
            <div
              v-if="hasProfileImage"
              class="h-32 w-32 overflow-hidden rounded-full border border-gray-200 bg-gray-50"
            >
              <img
                :src="localUser.profileImageUrl || ''"
                alt="Foto de perfil"
                class="h-full w-full object-cover"
              />
            </div>

            <div
              v-else
              class="flex h-32 w-32 items-center justify-center rounded-full border border-dashed border-gray-300 bg-gray-50 text-3xl font-semibold text-gray-400"
            >
              {{ avatarInitials }}
            </div>
          </div>

          <div class="flex w-full flex-col gap-2">
            <button
              type="button"
              class="bg-primary hover:bg-primary/90 inline-flex items-center justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              :disabled="isUploading"
              @click="openFileDialog"
            >
              {{ isUploading ? 'A carregar...' : 'Carregar nova foto' }}
            </button>

            <button
              v-if="hasProfileImage"
              type="button"
              class="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              :disabled="isRemoving"
              @click="handleRemovePhoto"
            >
              {{ isRemoving ? 'A remover...' : 'Remover foto' }}
            </button>

            <p class="text-xs text-gray-500">
              Formatos suportados: JPG, PNG, WEBP. Tamanho máximo 20MB. A imagem
              será automaticamente recortada para formato quadrado.
            </p>
          </div>

          <!-- input de ficheiro escondido -->
          <input
            ref="fileInputRef"
            type="file"
            accept="image/*"
            class="hidden"
            @change="handleFileChange"
          />
        </div>
      </div>
    </div>
  </BaseCard>
</template>
