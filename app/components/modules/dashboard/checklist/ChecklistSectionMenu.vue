<script setup lang="ts">
const emit = defineEmits(['edit', 'remove']);
const open = ref(false);

function edit() {
  open.value = false;
  emit('edit');
}
function remove() {
  open.value = false;
  emit('remove');
}
</script>
<template>
  <div class="relative">
    <button
      class="hover:bg-primary-600 mr-2 rounded-full p-1.5 transition-colors duration-300 ease-in hover:text-white"
      aria-label="Mais opções"
      @click="open = !open"
    >
      <IconDots :font-controlled="false" class="size-[20px]" />
    </button>
    <transition name="fade" mode="out-in">
      <div
        v-if="open"
        class="absolute right-0 mt-2 w-40 rounded-xl border bg-white p-1 shadow-xl"
      >
        <button
          class="hover:bg-grey-50 block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors duration-300 ease-in"
          @click="edit"
        >
          Editar
        </button>
        <button
          class="block w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 transition-colors duration-300 ease-in hover:bg-red-50"
          @click="remove"
        >
          Remover
        </button>
      </div>
    </transition>
  </div>
</template>
