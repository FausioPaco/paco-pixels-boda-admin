<template>
  <div class="flex min-h-screen flex-col overflow-y-auto overflow-x-hidden">
    <!-- Header -->
    <LazyTheHeader />

    <!-- Content -->
    <main class="flex-1">
      <slot></slot>
    </main>
  </div>
</template>
