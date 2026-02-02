<script setup lang="ts">
const props = defineProps<{ program: EventProgram }>();

defineEmits(['upload']);

const fileUrl = computed(() => {
  const f = props.program?.file;
  return f?.fileUrl ?? null;
});

const showFileUploadAlert = ref(true);
</script>

<template>
  <div class="w-full rounded-2xl border bg-white p-5">
    <div
      class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
    >
      <div>
        <h3 class="text-primary-700 text-xl font-bold">
          Carregar o seu programa
        </h3>
        <p class="text-grey-400 text-sm">
          Se já tem o programa do seu evento em PDF ou imagem, carregue-o aqui
          para ser partilhado com os convidados.
        </p>
      </div>

      <BaseButton
        btn-type="primary"
        size="md"
        icon="upload"
        @click="$emit('upload')"
      >
        Carregar agora
      </BaseButton>
    </div>

    <div class="mt-5">
      <div v-if="fileUrl" class="rounded-xl border p-3">
        <div class="text-grey-300 mb-2 text-sm">Pré-visualização</div>

        <iframe
          v-if="String(fileUrl).toLowerCase().endsWith('.pdf')"
          :src="fileUrl"
          class="h-[520px] w-full rounded-lg"
        >
        </iframe>

        <img v-else :src="fileUrl" class="w-full rounded-lg" />
      </div>

      <BaseAlert
        v-else
        :show="showFileUploadAlert"
        title="Modo Planeamento Activo"
        message=" Ainda não foi carregado nenhum ficheiro."
        type="informative"
        @close="showFileUploadAlert = !showFileUploadAlert"
      />
    </div>
  </div>
</template>
