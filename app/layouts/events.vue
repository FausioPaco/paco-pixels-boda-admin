<template>
  <div class="flex min-h-screen flex-col overflow-y-auto overflow-x-hidden">
    <!-- Header -->
    <LazyTheHeader />

    <!-- Content -->
    <main class="flex-1">
      <slot></slot>
    </main>

    <!-- Session Expiry Warning Modal -->
    <SessionExpiryWarningModal />
  </div>
</template>
