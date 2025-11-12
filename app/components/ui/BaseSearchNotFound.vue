<template>
  <div
    role="alert"
    aria-live="assertive"
    class="my-3 flex flex-col items-center justify-center gap-2 text-center"
  >
    <icon-warning
      :font-controlled="false"
      class="text-grey-400 mr-1 block size-[60px]"
      aria-hidden="true"
      focusable="false"
    ></icon-warning>
    <p
      class="text-label text-grey-500 mt-2 flex animate-fadeIn items-center text-lg font-medium"
    >
      <slot></slot>
    </p>

    <BaseButton
      v-if="showFallback"
      aria-label="Tentar nova pesquisa"
      class="mt-3 w-fit"
      btn-type="outline-primary"
      size="sm"
      @click="$emit('fallback')"
    >
      Tentar novamente
    </BaseButton>
  </div>
</template>
<script lang="ts" setup>
interface BaseSearchNotFoundProps {
  showFallback?: boolean;
}

defineOptions({
  name: 'BaseSearchNotFound',
});

defineEmits<{
  (e: 'fallback'): void;
}>();

withDefaults(defineProps<BaseSearchNotFoundProps>(), {
  showFallback: true,
});
</script>
