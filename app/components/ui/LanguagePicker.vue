<script lang="ts" setup>
defineOptions({ name: 'LanguagePicker' });

const props = withDefaults(
  defineProps<{
    /** Visual variant: 'light' for dark backgrounds (e.g. login), 'dark' for light backgrounds */
    variant?: 'light' | 'dark';
  }>(),
  { variant: 'light' },
);

const { locale, changeLocale } = useLanguage();

const languages = [
  { code: 'pt', label: 'PT', name: 'Português' },
  { code: 'en', label: 'EN', name: 'English' },
] as const;
</script>

<template>
  <div class="flex items-center gap-1" role="group" aria-label="Language">
    <button
      v-for="lang in languages"
      :key="lang.code"
      type="button"
      :aria-label="lang.name"
      :aria-pressed="locale === lang.code"
      :class="[
        'rounded px-2 py-0.5 text-xs font-semibold tracking-wide transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
        locale === lang.code
          ? props.variant === 'light'
            ? 'bg-white/20 text-white ring-1 ring-white/40'
            : 'bg-primary-600 text-white'
          : props.variant === 'light'
            ? 'text-white/60 hover:text-white'
            : 'text-grey-400 hover:text-grey-700',
      ]"
      @click="changeLocale(lang.code)"
    >
      {{ lang.label }}
    </button>
  </div>
</template>
