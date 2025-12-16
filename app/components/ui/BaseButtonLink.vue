<script lang="ts" setup>
import type {
  RouteLocationAsPathGeneric,
  RouteLocationAsRelativeGeneric,
} from 'vue-router';

interface IButtonLinkProps {
  to?:
    | string
    | RouteLocationAsRelativeGeneric
    | RouteLocationAsPathGeneric
    | undefined;
  href?: string;
  btnSize?: ButtonSize;
  btnType?: ButtonType;
  icon?: string;
  iconSize?: number;
  loading?: boolean;
  disabled?: boolean;
  onlyIcon?: boolean;
}

defineOptions({
  name: 'BaseButtonLink',
  inheritAttrs: false,
});

const props = withDefaults(defineProps<IButtonLinkProps>(), {
  to: '',
  href: '',
  btnType: 'primary',
  btnSize: 'md',
  icon: '',
  iconSize: 28,
  loading: false,
  disabled: false,
    onlyIcon: false, 
});

const getButtonStyleClass = () => {
  if (props.btnType === 'outline-primary')
    return ' border-primary-500 border-2 text-primary-500 hover:bg-primary-500 hover:text-white';

  if (props.btnType === 'white')
    return ' border-white border-2 text-white hover:bg-white hover:text-primary-500';

  return 'bg-primary-500 border-2 border-primary-500 text-white hover:shadow-primary-500/50 hover:bg-primary-800 hover:border-primary-800 hover:text-white hover:shadow-primary-600/50 hover:-translate-y-0.5 disabled:bg-grey-100 disabled:text-grey-400 disabled:border-grey-100';
};

const getButtonSizeClass = () => {
  if (props.btnSize === 'sm') return 'px-3 py-2 text-sm';
  if (props.btnSize === 'lg') return 'px-6 py-3 text-lg';
  if (props.btnSize === 'xl') return 'px-8 py-4 text-xl';

  return 'px-5 py-3 text-sm';
};

const getButtonClass = computed(() => {
  const btnClasses = [];

  btnClasses.push(
    'font-semibold  transition-all duration-300 rounded-md hover:-translate-y-0.5 block w-fit  text-center',
  );

  btnClasses.push(getButtonStyleClass());
  btnClasses.push(getButtonSizeClass());

  if (props.icon && !props.onlyIcon) btnClasses.push('flex items-center justify-center gap-2');

  return btnClasses.join(' ');
});
</script>
<template>
  <NuxtLink v-if="to" :to="to" v-bind="$attrs" :class="getButtonClass">
    <template v-if="icon">
      <component
        :is="`icon-${icon}`"
        :font-controlled="false"
        :width="props.iconSize"
        :height="props.iconSize"
      />
    </template>
    <span v-if="!loading && !onlyIcon"><slot></slot></span>
    <BaseLoading
      v-if="loading"
      size="sm"
      orientation="vertical"
      :color="btnType === 'primary' ? 'white' : 'primary'"
    />
  </NuxtLink>

  <a v-else-if="href" :href="href" v-bind="$attrs" :class="getButtonClass">
    <template v-if="icon">
      <component
        :is="`icon-${icon}`"
        :font-controlled="false"
        :width="props.iconSize"
        :height="props.iconSize"
      />
    </template>
    <span v-if="!loading"><slot></slot></span>
    <BaseLoading
      v-if="loading"
      size="sm"
      orientation="vertical"
      :color="btnType === 'primary' ? 'white' : 'primary'"
    />
  </a>
</template>

<style>
[aria-disabled='true'] {
  opacity: 0.9;
  cursor: not-allowed;
}
</style>
