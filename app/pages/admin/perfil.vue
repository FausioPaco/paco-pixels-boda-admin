<script setup lang="ts">
useHead({
  title: 'O meu perfil',
  meta: [
    {
      name: 'description',
      content: 'O meu perfil',
    },
  ],
});

definePageMeta({
  name: 'Perfil',
  pageName: 'Meu Perfil',
  middleware: ['auth'],
});

const authStore = useAuthStore();
const user = computed(() => authStore.user);

const handleUserUpdated = (updatedUser: User) => {
  authStore.user = updatedUser;

  const userCookie = useCookie<User>('user');
  userCookie.value = updatedUser;
};
</script>

<template>
  <div>
    <LazyUserProfileManagement
      v-if="user"
      :user="user"
      @updated="handleUserUpdated"
    />
  </div>
</template>
