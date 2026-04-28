<script setup lang="ts">
const { t } = useI18n();
</script>

<template>
  <section
    class="flex min-h-[500px] animate-fadeIn flex-col items-center justify-center px-4 text-center"
  >
    <icon-warning
      :font-controlled="false"
      class="mb-4 block size-[120px] text-primary-700"
    />

    <h3
      class="mb-3 text-2xl font-bold leading-snug text-primary-700 md:text-3xl"
    >
      {{ t('features.not_implemented_title') }}
    </h3>

    <p class="max-w-xl text-lg text-grey-600 md:text-xl">
      {{ t('features.not_implemented_description') }}
    </p>
  </section>
</template>
