<script lang="ts" setup>
type HeaderUserProps = {
  mode?: 'normal' | 'embedded';
};

withDefaults(defineProps<HeaderUserProps>(), {
  mode: 'normal',
});

const showDropdown = ref<boolean>(false);
const store = useAuthStore();

const router = useRouter();
const logout = () => {
  store.logout();
  router.push('/');
};
</script>
<template>
  <div class="relative z-50 mx-2 block">
    <!-- User Name -->
    <div
      class="text-grey-800 flex cursor-pointer items-center lg:space-x-3"
      :class="mode === 'normal' ? 'text-grey-500' : 'text-white'"
      @click="showDropdown = !showDropdown"
    >
      <icon-account
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
        class="absolute left-[-5.5rem] top-[2rem] min-w-60 rounded border bg-white p-3 shadow-md"
        @click="showDropdown = false"
      >
        <ul class="flex flex-col justify-between">
          <li
            class="hover:bg-primary-100 group cursor-pointer p-2 transition-colors duration-300"
            @click.prevent="logout()"
          >
            <div
              class="group-hover:text-primary-500 relative flex items-center space-x-2 text-sm no-underline transition-colors duration-300"
            >
              <icon-logout
                :font-controlled="false"
                class="text-grey-600 group-hover:text-primary-500 h-4 w-4"
              ></icon-logout
              ><span class="text-grey-600 group-hover:text-primary-500"
                >Sair</span
              >
            </div>
          </li>
        </ul>
      </div>
    </transition>
  </div>
</template>
