<script setup lang="ts">
defineProps<{
  coupleName: string;
  documentTitle: string;
  items: EventProgramItem[];
}>();
</script>

<template>
  <!-- A4 width feel (ajusta se precisares) -->
  <div class="w-[794px] bg-white">
    <div
      class="bg-primary-800 flex items-center justify-between px-10 py-4 text-white"
    >
      <div class="pb-4 font-script text-3xl font-medium leading-none">
        {{ coupleName }}
      </div>

      <div class="font-sans text-sm font-extralight tracking-[5px]">
        {{ documentTitle }}
      </div>
    </div>

    <!-- Body -->
    <div class="px-12 py-10">
      <ol class="space-y-8">
        <li v-for="(it, index) in items" :key="it.id" class="relative">
          <div class="flex gap-6">
            <!-- coluna timeline -->
            <div class="w-20 shrink-0">
              <div class="relative flex justify-center">
                <div
                  v-if="items.length > 1 && index !== items.length - 1"
                  class="bg-primary-200 absolute left-1/2 top-14 w-px -translate-x-1/2"
                  style="height: calc(100% + 2rem)"
                ></div>

                <div
                  class="border-primary-200 relative z-10 flex h-14 w-14 items-center justify-center rounded-full border-2 bg-white"
                >
                  <component
                    :is="`icon-${it.iconKey}`"
                    :font-controlled="false"
                    class="text-primary-700 h-7 w-7"
                  />
                </div>
              </div>
            </div>

            <!-- content -->
            <div
              class="border-primary-100 flex-1 rounded-2xl border px-8 pb-6 pt-2"
            >
              <div class="flex items-baseline gap-4">
                <div class="text-primary-700 font-sans text-xl font-bold">
                  {{ it.time }}
                </div>

                <div class="text-grey-900 font-sans text-xl font-semibold">
                  {{ it.title }}
                </div>
              </div>

              <div
                v-if="it.description"
                class="text-grey-400 mt-2 font-sans text-base"
              >
                {{ it.description }}
              </div>
            </div>
          </div>
        </li>
      </ol>
    </div>
  </div>
</template>
