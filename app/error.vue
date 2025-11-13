<script lang="ts" setup>
import type { NuxtError } from '#app';
const { siteConfig } = await useClientConfig();

const props = defineProps({
  // eslint-disable-next-line vue/require-default-prop
  error: Object as () => NuxtError,
});
const handleError = () => clearError({ redirect: '/' });

const errorMessage = computed(() => {
  if (props.error?.statusCode === 404) {
    return 'Pedimos desculpa, mas a página que procura não foi encontrada.';
  } else if (props.error?.statusCode === 500) {
    return 'Ocorreu um erro interno no servidor. Estamos a trabalhar para resolver.';
  } else if (props.error?.statusCode === 403) {
    return 'Acesso negado. Parece que não tem permissão para ver esta página.';
  } else {
    return 'Ocorreu um erro inesperado. Clique no botão abaixo para voltar à página inicial.';
  }
});

useHead({
  title: props.error?.statusCode === 404 ? 'Pagina não encontrada' : 'Ups!',
  meta: [
    {
      name: 'description',
      content: `Erro inesperado: ${siteConfig['title']}`,
    },
  ],
});
</script>

<template>
  <NuxtLayout name="entry">
    <section
      class="flex animate-fadeIn flex-col items-center justify-center gap-2"
    >
      <icon-warning
        :font-controlled="false"
        class="text-primary-700 mr-1 block size-[120px]"
      ></icon-warning>

      <h1
        class="text-grey-800 my-3 text-5xl font-bold leading-snug md:text-6xl"
      >
        Ups!
      </h1>
      <p class="text-grey-600 my-2 text-lg md:text-xl">
        {{ errorMessage }}
      </p>

      <BaseButton
        btn-type="primary"
        size="lg"
        class="my-4 w-fit"
        @click="handleError"
        >Leva-me de volta!</BaseButton
      >
    </section>
  </NuxtLayout>
</template>
