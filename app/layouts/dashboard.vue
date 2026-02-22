<template>
  <div class="flex min-h-screen w-full max-w-full bg-[#fafafa]">
    <!-- Side bar -->
    <TheAdminSideNav />

    <!-- Main content -->
    <div id="admin-content" class="min-h-screen flex-grow overflow-hidden">
      <main id="main" role="main" class="min-h-screen">
        <TheAdminHeader />
        <div class="p-3">
          <slot></slot>
        </div>
      </main>
    </div>

    <!-- Session Expiry Warning Modal -->
    <SessionExpiryWarningModal />
  </div>
</template>
