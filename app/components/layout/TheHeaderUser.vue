<script lang="ts" setup>
type HeaderUserProps = {
  mode?: 'normal' | 'embedded';
};

withDefaults(defineProps<HeaderUserProps>(), {
  mode: 'normal',
});

const showDropdown = ref<boolean>(false);
const store = useAuthStore();
const { path } = useRoute();
const { apiImageUrl } = useRuntimeConfig().public;

const router = useRouter();
const logout = () => {
  store.logout();
  router.push('/');
};

const hasProfileImage = computed(() => {
  if (!store.user) return false;

  return !!store.user.profileImageUrl && store.user.profileImageUrl !== '';
});
</script>
<template>
  <div class="relative z-50 block">
    <!-- User Name -->
    <div
      class="text-grey-800 flex cursor-pointer items-center gap-2 lg:gap-3"
      :class="mode === 'normal' ? 'text-grey-500' : 'text-white'"
      @click="showDropdown = !showDropdown"
    >
      <div v-if="hasProfileImage" class="relative">
        <div
          class="bg-primary-50 size-[40px] overflow-hidden rounded-full border border-gray-200"
        >
          <img
            :src="`${apiImageUrl}${store.user?.profileImageUrl}` || ''"
            alt="Foto de perfil"
            class="h-full w-full object-cover"
          />
        </div>
      </div>

      <icon-account
        v-else
        :font-controlled="false"
        class="h-5 w-5"
        :class="mode === 'normal' ? 'text-primary-500' : 'text-white'"
      ></icon-account>

      <span class="hover:text-primary-500 transition-colors">{{
        store.user ? store.user.name : ''
      }}</span>
      <icon-arrow-down
        :font-controlled="false"
        class="h-5 w-5 transition-transform duration-500"
        :class="showDropdown ? '-rotate-90' : ''"
      ></icon-arrow-down>
    </div>

    <!-- User Dropdown -->
    <transition name="fade">
      <div
        v-if="showDropdown"
        class="absolute left-[20px] top-[2rem] min-w-40 rounded border bg-white p-3 shadow-md md:left-[-5.5rem] md:min-w-60"
        @click="showDropdown = false"
      >
        <ul class="flex flex-col justify-between divide-y divide-gray-200">
          <li
            v-if="path.includes('/admin')"
            class="hover:bg-primary-100 group cursor-pointer p-2 transition-colors duration-300"
            @click.prevent="$router.push('/admin/perfil')"
          >
            <NuxtLink
              to="/admin/perfil"
              class="group-hover:text-primary-500 relative flex items-center space-x-2 text-sm no-underline transition-colors duration-300"
            >
              <icon-account
                :font-controlled="false"
                class="text-grey-600 group-hover:text-primary-500 h-4 w-4"
              ></icon-account
              ><span class="text-grey-600 group-hover:text-primary-500"
                >Meu Perfil</span
              >
            </NuxtLink>
          </li>
          <li
            class="hover:bg-primary-100 group cursor-pointer p-2 transition-colors duration-300"
            @click.prevent="logout()"
          >
            <button
              class="group-hover:text-primary-500 relative flex items-center space-x-2 text-sm no-underline transition-colors duration-300"
            >
              <icon-logout
                :font-controlled="false"
                class="text-grey-600 group-hover:text-primary-500 h-4 w-4"
              ></icon-logout
              ><span class="text-grey-600 group-hover:text-primary-500"
                >Sair</span
              >
            </button>
          </li>
        </ul>
      </div>
    </transition>
  </div>
</template>
