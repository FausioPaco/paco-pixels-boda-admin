<script lang="ts" setup>
defineOptions({
  name: 'BaseButtonExternalLink',
  inheritAttrs: false,
});

const props = withDefaults(defineProps<IButtonExternalLinkProps>(), {
  to: '',
  href: '',
  btnType: 'whatsapp',
  btnSize: 'md',
  icon: '',
  iconSize: 28,
  loading: false,
  disabled: false,
});

const getButtonStyleClass = () => {
  if (props.btnType === 'whatsapp')
    return 'bg-[#25D366] border-2 border-[#25D366] text-white hover:bg-[#1DA851] hover:border-[#1DA851] hover:shadow-lg hover:-translate-y-0.5 disabled:bg-grey-100 disabled:text-grey-400 disabled:border-grey-100';

  if (props.btnType === 'instagram')
    return 'bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 text-white border-none hover:brightness-110 hover:shadow-lg hover:-translate-y-0.5 disabled:bg-grey-100 disabled:text-grey-400 disabled:border-grey-100';

  if (props.btnType === 'youtube')
    return 'bg-[#FF0000] border-2 border-[#FF0000] text-white hover:bg-[#CC0000] hover:border-[#CC0000] hover:shadow-lg hover:-translate-y-0.5 disabled:bg-grey-100 disabled:text-grey-400 disabled:border-grey-100';

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
    'font-semibold  transition-all duration-300 rounded-md hover:-translate-y-0.5 block w-fit',
  );

  btnClasses.push(getButtonStyleClass());
  btnClasses.push(getButtonSizeClass());

  if (props.icon) btnClasses.push('flex items-center justify-center gap-2');

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
    <span v-if="!loading"><slot></slot></span>
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
  </a>
</template>

<style>
[aria-disabled='true'] {
  opacity: 0.9;
  cursor: not-allowed;
}
</style>
