<script lang="ts" setup>
const route = useRoute();
// const jobsStore = useBackgroundJobsStore();
</script>

<template>
  <header
    class="flex flex-wrap items-center justify-between space-y-3 px-3 py-3 md:space-y-0 md:pb-2 md:pt-8"
  >
    <h1 class="text-grey-800 text-2xl font-bold md:text-3xl">
      {{ route.meta['pageName'] }}
    </h1>

    <div class="flex items-center gap-4 md:gap-6">
      <LazyTheAdminBackgroundJobsWidget />
      <LazyTheOnlineUsersWidget />
      <LazyTheHeaderUser />
    </div>
  </header>
</template>
