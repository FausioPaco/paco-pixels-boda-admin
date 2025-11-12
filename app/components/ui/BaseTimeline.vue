<script setup lang="ts">
type Timeline = {
  icon: string;
  title: string;
  location: string;
  time: string;
};

interface ITimelineProps {
  events: Timeline[];
  primaryColor?: string;
}

withDefaults(defineProps<ITimelineProps>(), {
  primaryColor: '#2B2117',
});
</script>
<template>
  <div class="my-10 flex w-[80%] flex-col items-center justify-center gap-16">
    <div
      v-for="(event, index) in events"
      :key="event.title"
      class="ml-[56%] flex w-[80%] items-start gap-4"
    >
      <!--  Ícone -->
      <div class="-mt-5">
        <component
          :is="event.icon"
          :font-controlled="false"
          class="block size-[48px]"
          :class="`text-[${primaryColor}]`"
        />
      </div>

      <!-- Linha + conteúdo -->
      <div class="relative flex gap-1">
        <!-- Dot -->
        <div
          class="h-3 w-3 rounded-full border border-white"
          :class="`bg-[${primaryColor}]`"
        ></div>

        <!-- Conteúdo -->
        <div class="relative -mt-4 ml-4">
          <div class="flex flex-col gap-3">
            <p class="text-lg font-bold" :class="`text-[${primaryColor}]`">
              {{ event.title }}
            </p>
            <div class="relative w-full">
              <IconPinMap
                :font-controlled="false"
                class="block size-[20px] text-[#2B2117]"
              />
              <p
                class="absolute left-[26px] top-[-6.5px] w-[300px] font-sans text-sm"
              >
                {{ event.location }}
              </p>
            </div>

            <div class="relative w-full">
              <IconClock
                :font-controlled="false"
                class="block size-[20px] text-[#2B2117]"
              />

              <p
                class="absolute left-[26px] top-[-6.5px] w-[300px] font-sans text-sm"
              >
                {{ event.time }}
              </p>
            </div>
          </div>
        </div>

        <!-- Linha vertical -->
        <div
          v-if="index + 1 < events.length"
          class="absolute left-[5px] top-[6.4px] h-[145px] w-[2px] bg-[#2B2117]"
        ></div>
      </div>
    </div>
  </div>
</template>
