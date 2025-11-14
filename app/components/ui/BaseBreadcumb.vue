<template>
  <div class="dashboard-breadcumb">
    <slot></slot>
  </div>
</template>
<style>
.dashboard-breadcumb {
  @apply mb-2 flex w-full items-center space-x-2 p-6 pl-2 text-sm;
}

.dashboard-breadcumb a {
  @apply text-grey-400 underline;
}
.dashboard-breadcumb span.active {
  @apply text-primary-700 font-medium;
}
</style>
