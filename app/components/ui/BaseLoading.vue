<template>
  <div
    class="flex animate-fadeIn items-center justify-start space-x-4 md:min-w-11"
    :class="orientation === 'vertical' ? 'flex-col space-y-4' : 'flex-row'"
  >
    <div class="spinner-container">
      <span :class="getSpinnerClass"></span>
    </div>
    <p
      v-if="message"
      class="blink font-bold text-primary-600"
      :class="orientation !== 'vertical' ? 'ml-1' : ''"
    >
      {{ message }}
    </p>
  </div>
</template>
<script lang="ts" setup>
interface ILoadingProps {
  message?: string;
  orientation?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
  color?: 'white' | 'primary';
}

const props = withDefaults(defineProps<ILoadingProps>(), {
  message: '',
  orientation: 'horizontal',
  size: 'md',
  color: 'primary',
});

const getSpinnerSizeClass = () => {
  if (props.size === 'sm') return 'spinner-sm';
  if (props.size === 'lg') return 'spinner-lg';

  return 'spinner';
};

const getSpinnerColorClass = () => {
  if (props.color === 'primary') return 'spinner-primary';

  return 'spinner-white';
};

const getSpinnerClass = computed(() => {
  const spinnerClasses = [];

  spinnerClasses.push(getSpinnerSizeClass());
  spinnerClasses.push(getSpinnerColorClass());

  return spinnerClasses.join(' ');
});
</script>
<style>
.spinner-container {
  display: block;
  position: relative;
}

.spinner-sm {
  position: relative;
  width: 20px;
  height: 20px;
  display: block;
  border-radius: 50%;
  animation: spinner 0.6s linear infinite;
}

.spinner {
  position: relative;
  width: 28px;
  height: 28px;
  display: block;
  border-radius: 50%;
  animation: spinner 0.6s linear infinite;
}

.spinner-lg {
  position: relative;
  width: 40px;
  height: 40px;
  display: block;
  border-radius: 50%;
  animation: spinner 0.6s linear infinite;
}

.spinner-white {
  border-top: 2px solid white;
  border-left: 2px solid white;
  border-right: 2px solid rgba(255, 255, 255, 0);
}

.spinner-primary {
  border-top: 2px solid #746621;
  border-left: 2px solid #746621;
  border-right: 2px solid rgba(255, 255, 255, 0);
}

.blink {
  animation: blink 1.5s linear infinite;
}

@keyframes spinner {
  to {
    transform: rotate(360deg);
  }
}

@keyframes blink {
  50% {
    opacity: 0;
  }
}
</style>
