<template>
  <div class="flex min-h-screen w-full max-w-full">
    <!-- Side bar -->
    <TheAdminSideNav />

    <!-- Main content -->
    <div id="admin-content" class="flex-grow overflow-hidden">
      <main id="main" role="main" class="min-h-screen bg-[#f3e3e3]">
        <TheAdminHeader />
        <div class="p-3">
          <slot></slot>
        </div>
      </main>
    </div>
  </div>
</template>
